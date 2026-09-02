CREATE OR REPLACE FUNCTION admin_verify_payment(p_payment_id UUID) RETURNS BOOLEAN AS $$
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
    UPDATE payments SET status = 'verified', verified_by = v_admin_id, verified_at = NOW(), updated_at = NOW() WHERE id = p_payment_id;

    -- If this payment belongs to an order, update the order
    IF v_payment.order_id IS NOT NULL THEN
        UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = v_payment.order_id;
        
        -- Insert order event
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_payment.order_id, v_admin_id, 'PAYMENT_VERIFIED', 'Manual payment verified by admin');

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Payment Verified', 'Your payment of ৳' || v_payment.amount || ' has been verified.', 'payment', 'order', v_payment.order_id);
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

    -- Update payment
    UPDATE payments SET status = 'rejected', updated_at = NOW() WHERE id = p_payment_id;

    -- If this payment belongs to an order, update the order
    IF v_payment.order_id IS NOT NULL THEN
        UPDATE orders SET payment_status = 'rejected', status = 'cancelled', updated_at = NOW() WHERE id = v_payment.order_id;
        
        -- Insert order event
        INSERT INTO order_events (order_id, actor_id, event_type, message)
        VALUES (v_payment.order_id, v_admin_id, 'PAYMENT_REJECTED', p_reason);

        -- Notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (v_payment.user_id, 'Payment Rejected', 'Your payment was rejected: ' || p_reason, 'payment', 'order', v_payment.order_id);
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
