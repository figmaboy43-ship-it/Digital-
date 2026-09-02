-- Order Events Table
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES profiles(id),
    event_type TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for order_events
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order events" ON order_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_events.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins full access order events" ON order_events FOR ALL USING (is_admin());

-- Refine create_order function to handle all Part 6 constraints
CREATE OR REPLACE FUNCTION create_order(
    p_service_id UUID,
    p_order_data JSONB,
    p_use_wallet BOOLEAN DEFAULT true, -- Changed to true to match frontend expectation
    p_customer_note TEXT DEFAULT NULL,
    p_coupon_code TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
    v_service RECORD;
    v_quantity INTEGER;
    v_order_number TEXT;
    v_customer_type TEXT;
    v_unit_price NUMERIC(12,2);
    v_subtotal NUMERIC(12,2);
    v_discount NUMERIC(12,2) := 0;
    v_final_price NUMERIC(12,2);
    v_wallet RECORD;
    v_balance_after NUMERIC(14,2);
    v_order_id UUID;
    v_coupon RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.account_status != 'active' THEN RAISE EXCEPTION 'Account is not active'; END IF;

    SELECT * INTO v_service FROM services WHERE id = p_service_id;
    IF NOT FOUND OR v_service.is_active = false THEN RAISE EXCEPTION 'Service not available'; END IF;

    v_quantity := COALESCE((p_order_data->>'quantity')::integer, 1);
    IF v_quantity < 1 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    -- Note: admin limits on quantity could be enforced here if added to services table

    IF is_approved_wholesale(v_user_id) THEN
        v_customer_type := 'wholesale';
        v_unit_price := v_service.wholesale_price;
    ELSE
        v_customer_type := 'retail';
        v_unit_price := v_service.retail_price;
    END IF;

    v_subtotal := v_unit_price * v_quantity;

    -- Handle Coupon (Simplified)
    IF p_coupon_code IS NOT NULL THEN
        SELECT * INTO v_coupon FROM coupons 
        WHERE code = p_coupon_code 
          AND discount_type IN ('percentage', 'fixed')
          AND is_active = true 
          AND (starts_at IS NULL OR starts_at <= NOW()) 
          AND (expires_at IS NULL OR expires_at >= NOW());
          
        IF FOUND AND (v_coupon.usage_limit IS NULL OR v_coupon.used_count < v_coupon.usage_limit) AND v_subtotal >= v_coupon.minimum_order THEN
            IF v_coupon.discount_type = 'percentage' THEN
                v_discount := (v_subtotal * (v_coupon.discount_value / 100));
                IF v_coupon.maximum_discount IS NOT NULL AND v_discount > v_coupon.maximum_discount THEN
                    v_discount := v_coupon.maximum_discount;
                END IF;
            ELSE
                v_discount := v_coupon.discount_value;
            END IF;
            -- Update usage
            UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
        ELSE
            -- Invalid coupon, but we just continue with 0 discount or could RAISE EXCEPTION
        END IF;
    END IF;

    v_final_price := v_subtotal - v_discount;
    IF v_final_price < 0 THEN v_final_price := 0; END IF;

    -- Inject price snapshot into order_data
    p_order_data := p_order_data || jsonb_build_object(
        'price_snapshot', jsonb_build_object(
            'customer_type', v_customer_type,
            'unit_price', v_unit_price,
            'quantity', v_quantity,
            'subtotal', v_subtotal,
            'discount', v_discount,
            'total', v_final_price
        )
    );

    v_order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 6, '0');

    -- Insert Order
    INSERT INTO orders (order_number, user_id, service_id, customer_type, unit_price, total_amount, order_data, customer_note, status, payment_status)
    VALUES (v_order_number, v_user_id, p_service_id, v_customer_type, v_unit_price, v_final_price, p_order_data, p_customer_note, 'pending_payment', 'unpaid')
    RETURNING id INTO v_order_id;

    -- Insert Order Event
    INSERT INTO order_events (order_id, actor_id, event_type, message)
    VALUES (v_order_id, v_user_id, 'ORDER_CREATED', 'Order created successfully');

    -- Handle atomic wallet deduction if requested
    IF p_use_wallet THEN
        SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id FOR UPDATE;
        IF v_wallet.balance < v_final_price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
        IF v_wallet.status != 'active' THEN RAISE EXCEPTION 'Wallet is not active'; END IF;

        v_balance_after := v_wallet.balance - v_final_price;

        -- Update Wallet
        UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

        -- Insert Transaction
        INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
        VALUES (v_wallet.id, v_user_id, 'order_payment', v_final_price, v_wallet.balance, v_balance_after, 'order', v_order_id, 'Payment for ' || v_order_number, v_user_id);

        -- Update Order Status
        UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = v_order_id;
        
        -- Insert Event
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_order_id, v_user_id, 'PAYMENT_VERIFIED', 'Paid via Wallet');
    END IF;

    -- Insert Notification
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_user_id, 'Order Created', 'Order ' || v_order_number || ' has been received.', 'order', 'order', v_order_id);

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Admin RPC for updating order status and generating events
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

    -- Disallow invalid transitions (simplified)
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

    -- Notification
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_order.user_id, 'Order Status Updated', 'Your order ' || v_order.order_number || ' is now ' || p_new_status, 'order', 'order', p_order_id);

    -- Audit log
    INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
    VALUES (v_admin_id, 'UPDATE_ORDER_STATUS', 'order', p_order_id, jsonb_build_object('old_status', v_order.status, 'new_status', p_new_status));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure Refund RPC
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

    -- Refund logic (Wallet refund)
    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_order.user_id FOR UPDATE;
    v_balance_after := v_wallet.balance + v_order.total_amount;

    UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
    VALUES (v_wallet.id, v_order.user_id, 'refund', v_order.total_amount, v_wallet.balance, v_balance_after, 'order', p_order_id, 'Refund for ' || v_order.order_number || ' - ' || p_reason, v_admin_id);

    UPDATE orders SET status = 'refunded', payment_status = 'refunded', updated_at = NOW() WHERE id = p_order_id;

    INSERT INTO order_events (order_id, actor_id, event_type, message)
    VALUES (p_order_id, v_admin_id, 'REFUND_CREATED', p_reason);

    -- Notification
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_order.user_id, 'Order Refunded', 'Your order ' || v_order.order_number || ' has been refunded. ৳' || v_order.total_amount || ' added to wallet.', 'wallet', 'order', p_order_id);

    -- Audit log
    INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
    VALUES (v_admin_id, 'ORDER_REFUND', 'order', p_order_id, jsonb_build_object('amount', v_order.total_amount, 'reason', p_reason));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
