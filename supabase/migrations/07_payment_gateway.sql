-- 1. Add fields to payment_methods
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS min_amount NUMERIC(12,2);
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS max_amount NUMERIC(12,2);

-- 2. Create payment_events
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    provider TEXT,
    event_type TEXT NOT NULL,
    provider_reference TEXT,
    payload_metadata JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access payment events" ON payment_events FOR ALL USING (is_admin());

-- 3. Wallet Freeze RPC
CREATE OR REPLACE FUNCTION admin_freeze_wallet(p_user_id UUID, p_freeze BOOLEAN) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_new_status TEXT;
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    IF p_freeze THEN
        v_new_status := 'frozen';
    ELSE
        v_new_status := 'active';
    END IF;

    UPDATE wallets SET status = v_new_status, updated_at = NOW() WHERE user_id = p_user_id;

    -- Create Audit Log
    INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
    VALUES (v_admin_id, CASE WHEN p_freeze THEN 'WALLET_FROZEN' ELSE 'WALLET_UNFROZEN' END, 'wallet', p_user_id, jsonb_build_object('status', v_new_status));
    
    -- Notification
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (p_user_id, 'Wallet Status Update', 'Your wallet has been ' || v_new_status || '.', 'wallet', 'wallet', p_user_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-declare robust admin_verify_payment (covers deposits and order payments)
CREATE OR REPLACE FUNCTION admin_verify_payment(p_payment_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_payment RECORD;
    v_wallet RECORD;
    v_balance_after NUMERIC(14,2);
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    IF v_payment.status != 'pending' THEN RAISE EXCEPTION 'Payment is not pending'; END IF;

    -- Update payment
    UPDATE payments SET status = 'verified', verified_by = v_admin_id, verified_at = NOW(), updated_at = NOW() WHERE id = p_payment_id;

    -- Insert Payment Event Log
    INSERT INTO payment_events (payment_id, event_type, provider_reference, processed)
    VALUES (p_payment_id, 'VERIFIED', v_payment.transaction_reference, true);

    -- If order_id IS NULL, it's a wallet deposit
    IF v_payment.order_id IS NULL THEN
        SELECT * INTO v_wallet FROM wallets WHERE user_id = v_payment.user_id FOR UPDATE;
        IF v_wallet.status = 'frozen' THEN RAISE EXCEPTION 'Wallet is frozen'; END IF;

        v_balance_after := v_wallet.balance + v_payment.amount;
        UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

        INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
        VALUES (v_wallet.id, v_payment.user_id, 'deposit', v_payment.amount, v_wallet.balance, v_balance_after, 'payment', p_payment_id, 'Manual deposit verification', v_admin_id);

        -- Audit Log
        INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
        VALUES (v_admin_id, 'DEPOSIT_VERIFIED', 'payment', p_payment_id, jsonb_build_object('amount', v_payment.amount));

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Deposit Verified', 'Your deposit of ৳' || v_payment.amount || ' has been verified and added to your wallet.', 'wallet', 'payment', p_payment_id);

    ELSE
        -- It's a direct order payment
        UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = v_payment.order_id;
        
        -- Insert order event
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_payment.order_id, v_admin_id, 'PAYMENT_VERIFIED', 'Manual payment verified by admin');

        -- Audit Log
        INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
        VALUES (v_admin_id, 'PAYMENT_VERIFIED', 'payment', p_payment_id, jsonb_build_object('order_id', v_payment.order_id));

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Payment Verified', 'Your payment of ৳' || v_payment.amount || ' for your order has been verified.', 'payment', 'order', v_payment.order_id);
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Updated Rejection RPC
CREATE OR REPLACE FUNCTION admin_reject_payment(p_payment_id UUID, p_reason TEXT) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_payment RECORD;
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    IF v_payment.status != 'pending' THEN RAISE EXCEPTION 'Payment is not pending'; END IF;

    -- Update payment
    UPDATE payments SET status = 'rejected', admin_note = p_reason, updated_at = NOW() WHERE id = p_payment_id;

    -- Insert Payment Event
    INSERT INTO payment_events (payment_id, event_type, provider_reference, processed)
    VALUES (p_payment_id, 'REJECTED', v_payment.transaction_reference, true);

    -- If this payment belongs to an order, update the order
    IF v_payment.order_id IS NOT NULL THEN
        UPDATE orders SET payment_status = 'rejected', status = 'cancelled', updated_at = NOW() WHERE id = v_payment.order_id;
        
        -- Insert order event
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_payment.order_id, v_admin_id, 'PAYMENT_REJECTED', p_reason);

        -- Audit Log
        INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
        VALUES (v_admin_id, 'PAYMENT_REJECTED', 'payment', p_payment_id, jsonb_build_object('order_id', v_payment.order_id, 'reason', p_reason));

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Payment Rejected', 'Your payment was rejected: ' || p_reason, 'payment', 'order', v_payment.order_id);
    ELSE
        -- Audit Log
        INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
        VALUES (v_admin_id, 'DEPOSIT_REJECTED', 'payment', p_payment_id, jsonb_build_object('reason', p_reason));

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Deposit Rejected', 'Your deposit was rejected: ' || p_reason, 'wallet', 'payment', p_payment_id);
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Unique Constraint for Manual Transaction References to avoid duplicate submissions
ALTER TABLE payments ADD CONSTRAINT unique_transaction_reference UNIQUE (transaction_reference);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_transaction_reference;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_transaction_reference ON payments (transaction_reference) WHERE status != 'rejected';
