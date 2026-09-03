-- Admin verification helper function
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wholesale verification helper function
CREATE OR REPLACE FUNCTION is_approved_wholesale(check_user_id UUID DEFAULT auth.uid()) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = check_user_id AND role = 'wholesale' AND wholesale_status = 'approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent normal users from modifying sensitive profile fields
CREATE OR REPLACE FUNCTION restrict_profile_updates() RETURNS TRIGGER AS $$
BEGIN
    IF NOT is_admin() THEN
        NEW.role = OLD.role;
        NEW.account_status = OLD.account_status;
        NEW.wholesale_status = OLD.wholesale_status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER restrict_profile_updates_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE restrict_profile_updates();


-- 2. SERVICE CATEGORIES
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICES
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    icon TEXT,
    retail_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (retail_price >= 0),
    wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (wholesale_price >= 0),
    processing_time TEXT,
    required_fields JSONB DEFAULT '[]'::jsonb,
    instructions TEXT,
    terms TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WHOLESALE APPLICATIONS
CREATE TABLE wholesale_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    business_type TEXT,
    business_address TEXT,
    expected_monthly_orders INTEGER CHECK (expected_monthly_orders >= 0),
    reason TEXT,
    supporting_document_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
    admin_note TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle wholesale approval
CREATE OR REPLACE FUNCTION handle_wholesale_approval() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE profiles SET role = 'wholesale', wholesale_status = 'approved' WHERE id = NEW.user_id;
    ELSIF NEW.status IN ('rejected', 'suspended') AND OLD.status NOT IN ('rejected', 'suspended') THEN
        UPDATE profiles SET role = 'retail', wholesale_status = NEW.status WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_wholesale_status_change
AFTER UPDATE OF status ON wholesale_applications
FOR EACH ROW EXECUTE PROCEDURE handle_wholesale_approval();


-- 5. ORDERS
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('retail', 'wholesale')),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    order_data JSONB DEFAULT '{}'::jsonb,
    customer_note TEXT,
    admin_note TEXT,
    status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'processing', 'need_information', 'completed', 'rejected', 'cancelled', 'refunded')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'verified', 'rejected', 'refunded')),
    assigned_admin UUID REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WALLET
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance NUMERIC(14,2) DEFAULT 0 CHECK (balance >= 0), -- Explicitly preventing negative balances
    currency TEXT DEFAULT 'BDT',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WALLET TRANSACTIONS
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'order_payment', 'refund', 'bonus', 'admin_adjustment', 'withdrawal')),
    amount NUMERIC(14,2) NOT NULL,
    balance_before NUMERIC(14,2) NOT NULL,
    balance_after NUMERIC(14,2) NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENT METHODS
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_identifier TEXT,
    instructions TEXT,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    transaction_reference TEXT,
    proof_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
    admin_note TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    reference_type TEXT,
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUPPORT TICKETS & MESSAGES
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1;

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. COUPONS
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
    minimum_order NUMERIC(12,2) DEFAULT 0,
    maximum_discount NUMERIC(12,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SITE SETTINGS
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 15. AUTOMATIC PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, email, role, account_status, wholesale_status)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'mobile', 
        new.email, 
        'retail', 
        'active', 
        'not_applied'
    );
    
    INSERT INTO public.wallets (user_id, balance)
    VALUES (new.id, 0);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists from previous iteration, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 16. UPDATED_AT TRIGGERS FOR ALL TABLES
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_service_categories_modtime BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wholesale_apps_modtime BEFORE UPDATE ON wholesale_applications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wallets_modtime BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payment_methods_modtime BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_support_tickets_modtime BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_site_settings_modtime BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- 20. SECURE ORDER CREATION FUNCTION
CREATE OR REPLACE FUNCTION create_order(
    p_service_id UUID,
    p_order_data JSONB DEFAULT '{}'::jsonb,
    p_customer_note TEXT DEFAULT NULL,
    p_use_wallet BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_profile RECORD;
    v_service RECORD;
    v_price NUMERIC(12,2);
    v_order_id UUID;
    v_order_number TEXT;
    v_customer_type TEXT;
    v_wallet RECORD;
    v_balance_after NUMERIC(14,2);
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.account_status != 'active' THEN RAISE EXCEPTION 'Account is not active'; END IF;

    SELECT * INTO v_service FROM services WHERE id = p_service_id;
    IF NOT FOUND OR v_service.is_active = false THEN RAISE EXCEPTION 'Service not available'; END IF;

    -- Determine Pricing based on Secure DB Status
    IF is_approved_wholesale(v_user_id) THEN
        v_customer_type := 'wholesale';
        v_price := v_service.wholesale_price;
    ELSE
        v_customer_type := 'retail';
        v_price := v_service.retail_price;
    END IF;

    -- Generate secure unique order number
    v_order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 6, '0');

    -- Insert Order
    INSERT INTO orders (order_number, user_id, service_id, customer_type, unit_price, total_amount, order_data, customer_note, status, payment_status)
    VALUES (v_order_number, v_user_id, p_service_id, v_customer_type, v_price, v_price, p_order_data, p_customer_note, 'pending_payment', 'unpaid')
    RETURNING id INTO v_order_id;

    -- Handle atomic wallet deduction if requested
    IF p_use_wallet THEN
        SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id FOR UPDATE;
        IF v_wallet.balance < v_price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
        IF v_wallet.status != 'active' THEN RAISE EXCEPTION 'Wallet is not active'; END IF;

        v_balance_after := v_wallet.balance - v_price;

        -- Update Wallet
        UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

        -- Insert Transaction
        INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
        VALUES (v_wallet.id, v_user_id, 'order_payment', v_price, v_wallet.balance, v_balance_after, 'order', v_order_id, 'Payment for ' || v_order_number, v_user_id);

        -- Update Order Status
        UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = NOW() WHERE id = v_order_id;
    END IF;

    -- Insert Notification
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_user_id, 'Order Created', 'Order ' || v_order_number || ' has been received.', 'order', 'order', v_order_id);

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 21. SECURE WALLET FUNCTIONS
CREATE OR REPLACE FUNCTION admin_wallet_adjustment(
    p_user_id UUID,
    p_amount NUMERIC(14,2),
    p_type TEXT,
    p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_wallet RECORD;
    v_balance_after NUMERIC(14,2);
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized: Admins only'; END IF;
    IF p_type NOT IN ('admin_adjustment', 'bonus', 'refund') THEN RAISE EXCEPTION 'Invalid adjustment type'; END IF;

    SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

    v_balance_after := v_wallet.balance + p_amount;
    IF v_balance_after < 0 THEN RAISE EXCEPTION 'Resulting balance cannot be negative'; END IF;

    UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, description, created_by)
    VALUES (v_wallet.id, p_user_id, p_type, ABS(p_amount), v_wallet.balance, v_balance_after, p_description, v_admin_id);

    -- Audit log
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (v_admin_id, 'wallet_adjusted', 'wallet', v_wallet.id, jsonb_build_object('amount', p_amount, 'type', p_type, 'new_balance', v_balance_after));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_deposit(p_payment_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_payment RECORD;
    v_wallet RECORD;
    v_balance_after NUMERIC(14,2);
BEGIN
    v_admin_id := auth.uid();
    IF NOT is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND OR v_payment.status != 'pending' THEN RAISE EXCEPTION 'Invalid or already processed payment'; END IF;

    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_payment.user_id FOR UPDATE;

    v_balance_after := v_wallet.balance + v_payment.amount;

    UPDATE wallets SET balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet.id;

    INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description, created_by)
    VALUES (v_wallet.id, v_payment.user_id, 'deposit', v_payment.amount, v_wallet.balance, v_balance_after, 'payment', p_payment_id, 'Deposit via Payment #' || p_payment_id, v_admin_id);

    UPDATE payments SET status = 'verified', verified_by = v_admin_id, verified_at = NOW(), updated_at = NOW() WHERE id = p_payment_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 22. INDEXES
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_ws_status ON profiles(wholesale_status);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);


-- 17. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own basic info" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles" ON profiles FOR ALL USING (is_admin());

-- Service Categories Policies
CREATE POLICY "Anyone can view active categories" ON service_categories FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins full access categories" ON service_categories FOR ALL USING (is_admin());

-- Services Policies
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins full access services" ON services FOR ALL USING (is_admin());

-- Wholesale Applications Policies
CREATE POLICY "Users can read own wholesale apps" ON wholesale_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wholesale apps" ON wholesale_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access wholesale apps" ON wholesale_applications FOR ALL USING (is_admin());

-- Orders Policies
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update on orders happens via secure RPC functions for normal users to prevent price manipulation
CREATE POLICY "Admins full access orders" ON orders FOR ALL USING (is_admin());

-- Wallets Policies
CREATE POLICY "Users can read own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read access wallets" ON wallets FOR SELECT USING (is_admin());
-- Wallet updates strictly restricted to backend functions (no direct update policy)

-- Wallet Transactions Policies
CREATE POLICY "Users can read own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read access transactions" ON wallet_transactions FOR SELECT USING (is_admin());
-- Insert restricted to secure backend functions

-- Payment Methods Policies
CREATE POLICY "Anyone can view active payment methods" ON payment_methods FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins full access payment methods" ON payment_methods FOR ALL USING (is_admin());

-- Payments Policies
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access payments" ON payments FOR ALL USING (is_admin());

-- Notifications Policies
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins full access notifications" ON notifications FOR ALL USING (is_admin());

-- Support Tickets Policies
CREATE POLICY "Users can access own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access tickets" ON support_tickets FOR ALL USING (is_admin());

-- Support Messages Policies
CREATE POLICY "Users can access own ticket msgs" ON support_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own ticket msgs" ON support_messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins full access msgs" ON support_messages FOR ALL USING (is_admin());

-- Coupons Policies
CREATE POLICY "Coupons are admin only" ON coupons FOR ALL USING (is_admin());

-- Audit Logs Policies
CREATE POLICY "Audit logs admin read only" ON audit_logs FOR SELECT USING (is_admin());
-- No normal user access, inserts handled internally by functions

-- Site Settings Policies
CREATE POLICY "Anyone can view settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admins full access settings" ON site_settings FOR ALL USING (is_admin());

-- 23. STORAGE (Standard Supabase Storage Insert statements)
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('service-images', 'service-images', true),
('payment-proofs', 'payment-proofs', false),
('support-attachments', 'support-attachments', false),
('wholesale-documents', 'wholesale-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Assumes storage extension exists. Users can read public files, auth can upload, admins manage all)
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Public Read Service Images" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');
CREATE POLICY "Auth Upload Private Proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('payment-proofs', 'support-attachments', 'wholesale-documents') AND auth.role() = 'authenticated');
CREATE POLICY "Users Read Own Private Files" ON storage.objects FOR SELECT USING (
    bucket_id IN ('payment-proofs', 'support-attachments', 'wholesale-documents') AND owner = auth.uid()
);
CREATE POLICY "Admins Read All Private Files" ON storage.objects FOR SELECT USING (
    bucket_id IN ('payment-proofs', 'support-attachments', 'wholesale-documents') AND (SELECT is_admin() = true)
);
-- 11_analytics_views.sql

-- Helper to check if user is admin or super_admin
-- (Already exists from migration 10: is_admin())

-- 1. Dashboard Overview Stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    WITH user_stats AS (
        SELECT 
            COUNT(*) AS total_users,
            COUNT(*) FILTER (WHERE role = 'retail') AS retail_users,
            COUNT(*) FILTER (WHERE role = 'wholesale') AS wholesale_users
        FROM profiles
        WHERE (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    wholesale_app_stats AS (
        SELECT COUNT(*) AS pending_wholesale_apps
        FROM wholesale_applications
        WHERE status = 'pending'
    ),
    service_stats AS (
        SELECT 
            COUNT(*) AS total_services,
            COUNT(*) FILTER (WHERE is_active = true) AS active_services
        FROM services
    ),
    order_stats AS (
        SELECT 
            COUNT(*) AS total_orders,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
            COUNT(*) FILTER (WHERE status = 'processing') AS processing_orders,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders
        FROM orders
        WHERE (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    revenue_stats AS (
        SELECT 
            COALESCE(SUM(amount), 0) AS total_revenue,
            COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) AS today_revenue,
            COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)), 0) AS this_week_revenue,
            COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) AS this_month_revenue,
            COALESCE(SUM(amount) FILTER (WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = payments.user_id AND p.role = 'wholesale')), 0) AS wholesale_revenue,
            COALESCE(SUM(amount) FILTER (WHERE EXISTS (SELECT 1 FROM profiles p WHERE p.id = payments.user_id AND p.role = 'retail')), 0) AS retail_revenue
        FROM payments
        WHERE status = 'verified'
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    wallet_stats AS (
        SELECT 
            COALESCE(SUM(amount), 0) AS total_deposits,
            COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_deposits
        FROM wallet_transactions
        WHERE type = 'deposit'
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    )
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT * FROM user_stats, wholesale_app_stats, service_stats, order_stats, revenue_stats, wallet_stats
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Revenue Chart Data
CREATE OR REPLACE FUNCTION get_revenue_chart_data(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_interval TEXT -- 'day', 'week', 'month'
)
RETURNS TABLE (
    period TEXT,
    revenue NUMERIC,
    orders_count BIGINT
) AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        to_char(date_trunc(p_interval, created_at), 'YYYY-MM-DD') AS period,
        COALESCE(SUM(amount), 0) AS revenue,
        COUNT(order_id) AS orders_count
    FROM payments
    WHERE status = 'verified'
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY date_trunc(p_interval, created_at)
    ORDER BY date_trunc(p_interval, created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Service Analytics
CREATE OR REPLACE FUNCTION get_service_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    service_id UUID,
    service_name TEXT,
    category_name TEXT,
    total_orders BIGINT,
    completed_orders BIGINT,
    pending_orders BIGINT,
    revenue NUMERIC,
    completion_rate NUMERIC,
    avg_order_value NUMERIC
) AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        s.id AS service_id,
        s.name AS service_name,
        c.name AS category_name,
        COUNT(o.id) AS total_orders,
        COUNT(o.id) FILTER (WHERE o.status = 'completed') AS completed_orders,
        COUNT(o.id) FILTER (WHERE o.status = 'pending') AS pending_orders,
        COALESCE(SUM(o.total_price) FILTER (WHERE o.status != 'cancelled' AND o.status != 'rejected'), 0) AS revenue,
        CASE WHEN COUNT(o.id) > 0 THEN ROUND((COUNT(o.id) FILTER (WHERE o.status = 'completed')::NUMERIC / COUNT(o.id)::NUMERIC) * 100, 2) ELSE 0 END AS completion_rate,
        CASE WHEN COUNT(o.id) > 0 THEN ROUND((COALESCE(SUM(o.total_price), 0) / COUNT(o.id)), 2) ELSE 0 END AS avg_order_value
    FROM services s
    LEFT JOIN service_categories c ON s.category_id = c.id
    LEFT JOIN orders o ON s.id = o.service_id 
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    GROUP BY s.id, s.name, c.name
    ORDER BY total_orders DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. User Analytics Aggregation
CREATE OR REPLACE FUNCTION get_user_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    WITH u_stats AS (
        SELECT 
            COUNT(*) AS total_users,
            COUNT(*) FILTER (WHERE created_at >= COALESCE(p_start_date, '1970-01-01'::timestamptz)) AS new_users,
            COUNT(*) FILTER (WHERE role = 'retail') AS retail_users,
            COUNT(*) FILTER (WHERE role = 'wholesale') AS wholesale_users,
            COUNT(*) FILTER (WHERE account_status = 'suspended') AS suspended_users
        FROM profiles
        WHERE (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    u_orders AS (
        SELECT COUNT(DISTINCT user_id) AS users_with_orders
        FROM orders
        WHERE (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    u_wallets AS (
        SELECT COUNT(DISTINCT user_id) AS users_with_balance
        FROM wallets
        WHERE balance > 0
    )
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT * FROM u_stats, u_orders, u_wallets
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Wallet & Payment Analytics
CREATE OR REPLACE FUNCTION get_payment_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    WITH tx_stats AS (
        SELECT 
            COALESCE(SUM(amount) FILTER (WHERE type = 'deposit'), 0) AS total_deposits,
            COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'completed'), 0) AS approved_deposits,
            COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'pending'), 0) AS pending_deposits,
            COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'failed'), 0) AS rejected_deposits,
            COALESCE(SUM(amount) FILTER (WHERE type = 'payment' AND status = 'completed'), 0) AS wallet_payments,
            COALESCE(SUM(amount) FILTER (WHERE type = 'refund' AND status = 'completed'), 0) AS refunds,
            COALESCE(SUM(amount) FILTER (WHERE type = 'admin_adjustment' AND status = 'completed'), 0) AS admin_adjustments
        FROM wallet_transactions
        WHERE (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    ),
    manual_payments AS (
        SELECT 
            COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) AS manual_payments_total
        FROM payments
        WHERE payment_method_id IS NOT NULL 
          AND (p_start_date IS NULL OR created_at >= p_start_date)
          AND (p_end_date IS NULL OR created_at <= p_end_date)
    )
    SELECT row_to_json(t) INTO result
    FROM (
        SELECT * FROM tx_stats, manual_payments
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

