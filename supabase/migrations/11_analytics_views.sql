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

