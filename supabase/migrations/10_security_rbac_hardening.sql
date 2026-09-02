-- 10_security_rbac_hardening.sql

-- 1. Extend Roles to support super_admin and specialized admins
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('retail', 'wholesale', 'admin', 'super_admin', 'support_admin', 'finance_admin', 'order_admin'));

-- 2. Add permissions array to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}'::text[];

-- 3. Enhance Admin verification functions
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'support_admin', 'finance_admin', 'order_admin')
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT) RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_permissions TEXT[];
    user_status TEXT;
BEGIN
    SELECT role, permissions, account_status INTO user_role, user_permissions, user_status
    FROM profiles
    WHERE id = auth.uid();
    
    IF user_status != 'active' THEN
        RETURN false;
    END IF;

    IF user_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    IF user_role IN ('admin', 'support_admin', 'finance_admin', 'order_admin') AND required_permission = ANY(user_permissions) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure Wholesale Access Check
CREATE OR REPLACE FUNCTION is_approved_wholesale(check_user_id UUID DEFAULT auth.uid()) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = check_user_id 
        AND role = 'wholesale' 
        AND wholesale_status = 'approved'
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to prevent users from escalating their own privileges
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only super_admins can change roles
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_super_admin() THEN
        IF TG_OP = 'UPDATE' THEN
            RAISE EXCEPTION 'You do not have permission to change roles.';
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.account_status IS DISTINCT FROM OLD.account_status AND NOT has_permission('users.manage') THEN
            RAISE EXCEPTION 'You do not have permission to change account status.';
        END IF;
        
        IF NEW.wholesale_status IS DISTINCT FROM OLD.wholesale_status AND NOT has_permission('wholesale.manage') THEN
            RAISE EXCEPTION 'You do not have permission to change wholesale status.';
        END IF;

        IF NEW.permissions IS DISTINCT FROM OLD.permissions AND NOT is_super_admin() THEN
            RAISE EXCEPTION 'You do not have permission to modify permissions. Super Admin required.';
        END IF;
        
        -- Prevent a super admin from removing their own super admin status if they are the last one
        IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
            IF (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin' AND account_status = 'active') <= 1 THEN
                RAISE EXCEPTION 'Cannot remove the last active super_admin.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_privilege_escalation ON profiles;
CREATE TRIGGER enforce_privilege_escalation
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION prevent_privilege_escalation();

-- 6. Harden RLS on sensitive tables (Example: auditing existing ones)

-- Wallets: Ensure NO direct updates
DROP POLICY IF EXISTS "Users can read own wallet" ON wallets;
CREATE POLICY "Users can read own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Wallet transactions: ensure NO direct inserts/updates
DROP POLICY IF EXISTS "Users can read own transactions" ON wallet_transactions;
CREATE POLICY "Users can read own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- 7. Audit Log Insert Function
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_entity_id UUID,
    p_entity_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (actor_id, action, entity_id, entity_type, metadata)
    VALUES (auth.uid(), p_action, p_entity_id, p_entity_type, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Secure Payment Insert (Prevent injecting verified status)
CREATE OR REPLACE FUNCTION secure_payment_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_admin() THEN
        -- Force status to pending for non-admins
        NEW.status = 'pending';
        NEW.verified_by = NULL;
        -- Assuming verified_at doesn't exist, if it does, set to NULL
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_payment_security ON payments;
CREATE TRIGGER enforce_payment_security
    BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION secure_payment_insert();

-- No UPDATE policy for payments for normal users, so we are safe there.

-- 9. Add Security Headers helper (for admin dashboards or tracking if needed)
-- (We handle HTTP security headers in vite.config.ts or vercel.json usually)


-- 10. Hide internal notes from normal users in support_messages
DROP POLICY IF EXISTS "Users can access own ticket msgs" ON support_messages;
CREATE POLICY "Users can access own ticket msgs" ON support_messages 
FOR SELECT USING (
    (is_internal = false AND EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid()))
    OR is_admin()
);


-- 11. Secure Wholesale Application Insert
CREATE OR REPLACE FUNCTION secure_wholesale_app_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_admin() THEN
        -- Force status to pending for non-admins
        NEW.status = 'pending';
        NEW.admin_note = NULL;
        NEW.reviewed_by = NULL;
        NEW.reviewed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_wholesale_security ON wholesale_applications;
CREATE TRIGGER enforce_wholesale_security
    BEFORE INSERT OR UPDATE ON wholesale_applications
    FOR EACH ROW EXECUTE FUNCTION secure_wholesale_app_insert();

