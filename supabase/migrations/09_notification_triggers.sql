-- NOTIFICATION TRIGGERS

-- Trigger for New Orders
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (NEW.user_id, 'Order Submitted', 'Your order ORD-' || substr(NEW.id::text, 1, 8) || ' has been submitted successfully.', 'order', 'order', NEW.id);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'processing' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Order Processing', 'Your order is now being processed.', 'order', 'order', NEW.id);
        ELSIF NEW.status = 'completed' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Order Completed', 'Your order has been completed.', 'order', 'order', NEW.id);
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Order Rejected', 'Your order has been rejected.', 'order', 'order', NEW.id);
        ELSIF NEW.status = 'cancelled' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Order Cancelled', 'Your order has been cancelled.', 'order', 'order', NEW.id);
        ELSIF NEW.status = 'refunded' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Order Refunded', 'Your refund has been processed.', 'order', 'order', NEW.id);
        ELSIF NEW.status = 'info_required' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Action Required', 'Additional information is required for your order.', 'order', 'order', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();


-- Trigger for New Payments
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (NEW.user_id, 'Deposit Submitted', 'Your deposit request is under review.', 'payment', 'payment', NEW.id);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'verified' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Deposit Verified', 'Your deposit has been verified and your wallet has been credited.', 'payment', 'payment', NEW.id);
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Deposit Rejected', 'Your deposit could not be verified.', 'payment', 'payment', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_status_change ON payments;
CREATE TRIGGER on_payment_status_change
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION notify_payment_status_change();

-- Trigger for Wholesale Application Status
CREATE OR REPLACE FUNCTION notify_wholesale_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (NEW.user_id, 'Application Submitted', 'Your wholesale application has been submitted and is under review.', 'wholesale', 'wholesale', NEW.id);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'approved' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Application Approved', 'Congratulations! Your wholesale access has been approved.', 'wholesale', 'wholesale', NEW.id);
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Application Rejected', 'Your wholesale application was rejected.', 'wholesale', 'wholesale', NEW.id);
        ELSIF NEW.status = 'suspended' THEN
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (NEW.user_id, 'Account Suspended', 'Your wholesale access has been suspended.', 'wholesale', 'wholesale', NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wholesale_status_change ON wholesale_applications;
CREATE TRIGGER on_wholesale_status_change
    AFTER INSERT OR UPDATE ON wholesale_applications
    FOR EACH ROW EXECUTE FUNCTION notify_wholesale_status_change();
