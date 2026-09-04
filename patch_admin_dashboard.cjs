const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const fetchFunction = `  const fetchStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: retailUsers },
        { count: wholesaleUsers },
        { count: pendingApps },
        { count: totalOrders },
        { count: pendingOrders },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'retail'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'wholesale'),
        supabase.from('wholesale_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_payment'),
        supabase.from('orders').select('total_amount').eq('payment_status', 'verified')
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        retailUsers: retailUsers || 0,
        wholesaleUsers: wholesaleUsers || 0,
        pendingApps: pendingApps || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };`;

const newFetchFunction = `  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      
      if (error) {
        throw error;
      }

      if (data) {
        setStats({
          totalUsers: data.total_users || 0,
          retailUsers: data.retail_users || 0,
          wholesaleUsers: data.wholesale_users || 0,
          pendingApps: data.pending_wholesale_apps || 0,
          totalOrders: data.total_orders || 0,
          pendingOrders: data.pending_orders || 0,
          totalRevenue: data.total_revenue || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback for when RPC is missing or fails
      try {
        const [
          { count: totalUsers },
          { count: retailUsers },
          { count: wholesaleUsers },
          { count: pendingApps },
          { count: totalOrders },
          { count: pendingOrders },
          { data: revenueData }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'retail'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'wholesale'),
          supabase.from('wholesale_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'pending_payment']),
          supabase.from('payments').select('amount').eq('status', 'verified')
        ]);
  
        const totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  
        setStats({
          totalUsers: totalUsers || 0,
          retailUsers: retailUsers || 0,
          wholesaleUsers: wholesaleUsers || 0,
          pendingApps: pendingApps || 0,
          totalOrders: totalOrders || 0,
          pendingOrders: pendingOrders || 0,
          totalRevenue
        });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        toast.error('Failed to load dashboard statistics');
      }
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(fetchFunction, newFetchFunction);
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
