import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, ShoppingCart, DollarSign, Wallet, 
  TrendingUp, Activity, Package, Briefcase
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  retailUsers: number;
  wholesaleUsers: number;
  pendingApps: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
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
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-500" />
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white h-32 rounded-2xl shadow-sm border border-slate-100"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your platform's performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600"
          subtitle="From verified payments"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders}
          icon={ShoppingCart}
          colorClass="bg-blue-100 text-blue-600"
          subtitle={`${stats.pendingOrders} pending payment`}
        />
        <StatCard 
          title="Active Users" 
          value={stats.totalUsers}
          icon={Users}
          colorClass="bg-purple-100 text-purple-600"
          subtitle={`${stats.wholesaleUsers} wholesale accounts`}
        />
        <StatCard 
          title="Pending Apps" 
          value={stats.pendingApps}
          icon={Briefcase}
          colorClass="bg-amber-100 text-amber-600"
          subtitle="Wholesale applications to review"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity (Placeholder Chart)</h3>
        <div className="h-80 w-full bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 border-dashed">
          <p className="text-slate-400">Add historical time-series data queries here</p>
        </div>
      </div>
    </div>
  );
}
