import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Wallet, PackageSearch, Clock, CheckCircle, TrendingUp, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WholesaleDashboard() {
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState({
    balance: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    monthlySpending: 0,
    totalSavings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const [walletRes, ordersRes] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', user?.id).single(),
        supabase.from('orders').select('*, services(retail_price, wholesale_price)').eq('user_id', user?.id)
      ]);

      const orders = ordersRes.data || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let monthlySpending = 0;
      let totalSavings = 0;

      orders.forEach(order => {
        if (order.status === 'completed') {
          const orderDate = new Date(order.created_at);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            monthlySpending += Number(order.total_amount);
          }
          
          // Assuming qty exists in order_data or is 1 for now if we haven't updated it
          const qty = order.order_data?.quantity ? Number(order.order_data.quantity) : 1;
          const retail = Number(order.services?.retail_price || 0) * qty;
          const wholesale = Number(order.services?.wholesale_price || 0) * qty;
          const savings = retail - wholesale;
          if (savings > 0) totalSavings += savings;
        }
      });

      setStats({
        balance: walletRes.data?.balance || 0,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending_payment').length,
        processingOrders: orders.filter(o => ['processing', 'need_information'].includes(o.status)).length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        monthlySpending,
        totalSavings
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-white rounded-2xl"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wholesale Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, {profile?.business_name || profile?.full_name}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/wholesale/deposit" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium text-sm transition-colors shadow-sm">
            Deposit
          </Link>
          <Link to="/wholesale/services" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm">
            New Bulk Order
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-medium">Available Balance</h3>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold">৳{stats.balance.toFixed(2)}</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-600 font-medium">Monthly Spending</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">৳{stats.monthlySpending.toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-2">This month</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-600 font-medium">Total Savings</h3>
              <Download className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">৳{stats.totalSavings.toFixed(2)}</p>
            <p className="text-sm text-emerald-600/70 mt-2">Compared to retail</p>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-50 rounded-tl-full -mr-4 -mb-4"></div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-600 font-medium">Active Orders</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.processingOrders}</p>
          <p className="text-sm text-slate-500 mt-2">Processing right now</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <Link to="/wholesale/orders" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all</Link>
          </div>
          <div className="text-center py-12 text-slate-500">
            <PackageSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>Your recent bulk orders will appear here.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Order Status Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                  <PackageSearch className="w-4 h-4 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">Total Orders</span>
              </div>
              <span className="font-bold text-slate-900">{stats.totalOrders}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center mr-3">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <span className="font-medium text-amber-900">Processing</span>
              </div>
              <span className="font-bold text-amber-900">{stats.processingOrders}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="font-medium text-emerald-900">Completed</span>
              </div>
              <span className="font-bold text-emerald-900">{stats.completedOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
