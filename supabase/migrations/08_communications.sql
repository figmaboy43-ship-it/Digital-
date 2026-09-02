-- 1. NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    order_notifications BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    wallet_notifications BOOLEAN DEFAULT true,
    wholesale_notifications BOOLEAN DEFAULT true,
    support_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT DO NOTHING;

-- Trigger to create preferences for new users
CREATE OR REPLACE FUNCTION handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON profiles;
CREATE TRIGGER on_auth_user_created_preferences
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_preferences();

-- 2. ENHANCE SUPPORT TICKETS
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS related_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- 3. ENHANCE SUPPORT MESSAGES
ALTER TABLE support_messages
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- 4. RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Update RLS for support_messages to hide internal notes
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON support_messages;
CREATE POLICY "Users can view their non-internal messages" ON support_messages 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets st 
            WHERE st.id = ticket_id AND st.user_id = auth.uid()
        ) AND is_internal = false
    );

CREATE POLICY "Admins can view all messages" ON support_messages 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- 5. FUNCTION TO GENERATE TICKET NUMBER
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INT;
BEGIN
    seq_val := nextval('ticket_seq');
    NEW.ticket_number := 'TKT-' || to_char(NOW(), 'YYYY') || '-' || lpad(seq_val::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- 6. RPC for Admin Announcements
CREATE OR REPLACE FUNCTION create_admin_announcement(
    p_title TEXT,
    p_message TEXT,
    p_target_audience TEXT -- 'all', 'retail', 'wholesale', 'specific'
) RETURNS VOID AS $$
DECLARE
    v_user RECORD;
BEGIN
    IF p_target_audience = 'all' THEN
        FOR v_user IN SELECT id FROM profiles WHERE role != 'admin' AND role != 'super_admin' LOOP
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (v_user.id, p_title, p_message, 'announcement');
        END LOOP;
    ELSIF p_target_audience = 'wholesale' THEN
        FOR v_user IN SELECT id FROM profiles WHERE role = 'wholesale' LOOP
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (v_user.id, p_title, p_message, 'announcement');
        END LOOP;
    ELSIF p_target_audience = 'retail' THEN
        FOR v_user IN SELECT id FROM profiles WHERE role = 'retail' LOOP
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (v_user.id, p_title, p_message, 'announcement');
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
