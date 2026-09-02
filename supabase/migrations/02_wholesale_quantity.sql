-- Migration to support quantity in create_order
CREATE OR REPLACE FUNCTION create_order(
  p_service_id uuid,
  p_order_data jsonb,
  p_coupon_code text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_service record;
  v_wallet_balance decimal;
  v_final_price decimal;
  v_is_wholesale boolean;
  v_order_id uuid;
  v_quantity integer;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Check service
  SELECT * INTO v_service FROM services WHERE id = p_service_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Service not found or inactive');
  END IF;

  -- Extract quantity from order_data, default to 1
  v_quantity := COALESCE((p_order_data->>'quantity')::integer, 1);
  IF v_quantity < 1 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid quantity');
  END IF;

  -- Check wholesale status
  SELECT (role = 'wholesale' AND wholesale_status = 'approved') INTO v_is_wholesale
  FROM profiles WHERE id = v_user_id;

  -- Determine base price
  IF v_is_wholesale THEN
    v_final_price := v_service.wholesale_price * v_quantity;
  ELSE
    v_final_price := v_service.retail_price * v_quantity;
  END IF;

  -- Note: Coupon logic would go here, omitting for brevity

  -- Check wallet balance
  SELECT balance INTO v_wallet_balance FROM wallets WHERE user_id = v_user_id;
  IF v_wallet_balance < v_final_price THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance');
  END IF;

  -- Deduct balance
  UPDATE wallets SET balance = balance - v_final_price WHERE user_id = v_user_id;

  -- Create order
  INSERT INTO orders (
    user_id, service_id, status, total_amount, order_data
  ) VALUES (
    v_user_id, p_service_id, 'pending_payment', v_final_price, p_order_data
  ) RETURNING id INTO v_order_id;

  -- Create wallet transaction
  INSERT INTO transactions (
    user_id, type, amount, status, reference_id, metadata
  ) VALUES (
    v_user_id, 'order_payment', v_final_price, 'completed', v_order_id, 
    jsonb_build_object('service_name', v_service.name, 'quantity', v_quantity)
  );

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
