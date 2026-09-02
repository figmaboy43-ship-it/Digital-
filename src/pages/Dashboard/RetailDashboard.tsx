import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Wallet, ShoppingCart, Clock, CheckCircle, ArrowRight, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RetailDashboard() {
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState({
    balance: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [walletRes, ordersRes] = await Promise.all([
        supabase.from('wallets').select('balance').eq('user_id', user?.id).single(),
        supabase.from('orders').select('status, total_amount').eq('user_id', user?.id)
      ]);

      const orders = ordersRes.data || [];
      const completed = orders.filter(o => o.status === 'completed');
      const totalSpent = completed.reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        balance: walletRes.data?.balance || 0,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => ['pending_payment', 'processing', 'need_information'].includes(o.status)).length,
        completedOrders: completed.length,
        totalSpent
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-20 bg-white rounded-sm border border-gray-200"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-white rounded-sm border border-gray-200"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">স্বাগতম, {profile?.full_name}</h1>
          <p className="text-gray-600 mt-1">এটি আপনার ড্যাশবোর্ড ওভারভিউ</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/deposit" className="gov-button-outline">
            ডিপোজিট করুন
          </Link>
          <Link to="/dashboard/services" className="gov-button">
            নতুন সেবা অনুরোধ
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="gov-card p-5 border-t-4 border-t-primary">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-sm bg-green-50 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">বর্তমান ব্যালেন্স</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">৳{stats.balance.toFixed(2)}</p>
        </div>
        <div className="gov-card p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">মোট আবেদন</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>
        <div className="gov-card p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">অপেক্ষমান</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
        </div>
        <div className="gov-card p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">সম্পন্ন</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
        </div>
        <div className="gov-card p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium">মোট খরচ</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">৳{stats.totalSpent.toFixed(2)}</p>
        </div>
      </div>

      <div className="gov-card bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">আপনি কি একজন রিসেলার বা এজেন্ট?</h2>
          </div>
          <p className="text-gray-600 text-sm max-w-lg leading-relaxed">
            হোলসেল প্রোগ্রামে যুক্ত হয়ে বিশেষ মূল্য ছাড় এবং অগ্রাধিকার সেবা গ্রহণ করুন। সাইবার ক্যাফে বা ব্যবসায়িক প্রতিষ্ঠানের জন্য প্রযোজ্য।
          </p>
        </div>
        <Link to="/dashboard/wholesale" className="shrink-0 inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-green-700 text-white font-medium rounded-sm transition-colors shadow-sm">
          আবেদন করুন
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}
