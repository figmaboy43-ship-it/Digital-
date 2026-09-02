CREATE OR REPLACE FUNCTION submit_order_information(
    p_order_id UUID,
    p_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_order RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_order FROM orders WHERE id = p_order_id AND user_id = v_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

    IF v_order.status != 'need_information' THEN
        RAISE EXCEPTION 'Order is not in need_information status';
    END IF;

    -- Update order status back to processing
    UPDATE orders SET status = 'processing', updated_at = NOW() WHERE id = p_order_id;

    -- Insert event
    INSERT INTO order_events (order_id, actor_id, event_type, message)
    VALUES (p_order_id, v_user_id, 'INFORMATION_PROVIDED', p_message);

    -- Notification to admin (simplified as inserting a general notification)
    -- Or just rely on the admin checking the queue.

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
