CREATE OR REPLACE FUNCTION admin_update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_message TEXT DEFAULT NULL,
    p_admin_note TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_order RECORD;
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    IF v_order.status = 'completed' AND p_new_status IN ('processing', 'pending_payment') THEN
        RAISE EXCEPTION 'Cannot revert completed order back to processing';
    END IF;

    UPDATE orders SET 
        status = p_new_status, 
        admin_note = COALESCE(p_admin_note, admin_note), 
        updated_at = NOW() 
    WHERE id = p_order_id;

    INSERT INTO order_events (order_id, actor_id, event_type, message)
    VALUES (p_order_id, v_admin_id, 'STATUS_CHANGED', p_message);

    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_order.user_id, 'Order Status Updated', 'Your order ' || v_order.order_number || ' is now ' || p_new_status, 'order', 'order', p_order_id);

    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, 'UPDATE_ORDER_STATUS', 'order', p_order_id, jsonb_build_object('old_status', v_order.status, 'new_status', p_new_status));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION admin_process_refund(
    p_order_id UUID,
    p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_order RECORD;
    v_wallet RECORD;
    v_balance_after NUMERIC(14,2);
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    IF v_order.payment_status != 'paid' THEN 
        RAISE EXCEPTION 'Cannot refund unpaid order';
    END IF;

    IF v_order.status = 'refunded' OR v_order.payment_status = 'refunded' THEN 
        RAISE EXCEPTION 'Order already refunded';
    END IF;

    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_order.user_id FOR UPDATE;

    v_balance_after := v_wallet.balance + v_order.total_amount;
    UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
    VALUES (v_wallet.id, v_order.user_id, 'refund', v_order.total_amount, v_wallet.balance, v_balance_after, 'order', p_order_id, 'Refund for ' || v_order.order_number || ' - ' || p_reason, v_admin_id);

    UPDATE orders SET status = 'refunded', payment_status = 'refunded', updated_at = NOW() WHERE id = p_order_id;

    INSERT INTO order_events (order_id, actor_id, event_type, message)
    VALUES (p_order_id, v_admin_id, 'REFUND_CREATED', p_reason);

    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_order.user_id, 'Order Refunded', 'Your order ' || v_order.order_number || ' has been refunded. ৳' || v_order.total_amount || ' added to wallet.', 'wallet', 'order', p_order_id);

    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, 'ORDER_REFUND', 'order', p_order_id, jsonb_build_object('amount', v_order.total_amount, 'reason', p_reason));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION admin_freeze_wallet(p_user_id UUID, p_freeze BOOLEAN) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_wallet RECORD;
    v_new_status TEXT;
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    
    SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
    
    v_new_status := CASE WHEN p_freeze THEN 'frozen' ELSE 'active' END;
    
    UPDATE wallets SET status = v_new_status, updated_at = NOW() WHERE id = v_wallet.id;
    
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, CASE WHEN p_freeze THEN 'WALLET_FROZEN' ELSE 'WALLET_UNFROZEN' END, 'wallet', p_user_id, jsonb_build_object('status', v_new_status));
    
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (p_user_id, 'Wallet Status Update', 'Your wallet has been ' || v_new_status || '.', 'wallet', 'wallet', p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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

    UPDATE payments SET status = 'verified', verified_by = v_admin_id, verified_at = NOW(), updated_at = NOW() WHERE id = p_payment_id;

    INSERT INTO payment_events (payment_id, event_type, provider_reference, processed)
    VALUES (p_payment_id, 'VERIFIED', v_payment.transaction_reference, true);

    IF v_payment.order_id IS NULL THEN
        SELECT * INTO v_wallet FROM wallets WHERE user_id = v_payment.user_id FOR UPDATE;
        IF v_wallet.status = 'frozen' THEN RAISE EXCEPTION 'Wallet is frozen'; END IF;
        
        v_balance_after := v_wallet.balance + v_payment.amount;
        UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;
        
        INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
        VALUES (v_wallet.id, v_payment.user_id, 'deposit', v_payment.amount, v_wallet.balance, v_balance_after, 'payment', p_payment_id, 'Manual deposit verification', v_admin_id);
        
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (v_admin_id, 'DEPOSIT_VERIFIED', 'payment', p_payment_id, jsonb_build_object('amount', v_payment.amount));
        
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Deposit Verified', 'Your deposit of ৳' || v_payment.amount || ' has been verified and added to your wallet.', 'wallet', 'payment', p_payment_id);
    ELSE
        UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = v_payment.order_id;
        
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_payment.order_id, v_admin_id, 'PAYMENT_VERIFIED', 'Manual payment verified by admin');
        
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (v_admin_id, 'PAYMENT_VERIFIED', 'payment', p_payment_id, jsonb_build_object('order_id', v_payment.order_id));
        
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Payment Verified', 'Your payment of ৳' || v_payment.amount || ' for your order has been verified.', 'payment', 'order', v_payment.order_id);
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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

    UPDATE payments SET status = 'rejected', admin_note = p_reason, updated_at = NOW() WHERE id = p_payment_id;

    INSERT INTO payment_events (payment_id, event_type, provider_reference, processed)
    VALUES (p_payment_id, 'REJECTED', v_payment.transaction_reference, true);

    IF v_payment.order_id IS NOT NULL THEN
        UPDATE orders SET payment_status = 'rejected', status = 'cancelled', updated_at = NOW() WHERE id = v_payment.order_id;
        
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_payment.order_id, v_admin_id, 'PAYMENT_REJECTED', p_reason);
        
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (v_admin_id, 'PAYMENT_REJECTED', 'payment', p_payment_id, jsonb_build_object('order_id', v_payment.order_id, 'reason', p_reason));
        
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Payment Rejected', 'Your payment was rejected: ' || p_reason, 'payment', 'order', v_payment.order_id);
    ELSE
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (v_admin_id, 'DEPOSIT_REJECTED', 'payment', p_payment_id, jsonb_build_object('reason', p_reason));
        
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Deposit Rejected', 'Your deposit was rejected: ' || p_reason, 'wallet', 'payment', p_payment_id);
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
