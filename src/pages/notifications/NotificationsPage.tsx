import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Bell, Check, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, referenceType?: string, referenceId?: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      
      if (referenceType === 'order' && referenceId) {
        if (user?.role === 'admin') navigate(`/admin/orders/${referenceId}`);
        else if (user?.role === 'wholesale') navigate(`/wholesale/orders`);
        else navigate(`/dashboard/orders`);
      } else if (referenceType === 'ticket' && referenceId) {
        if (user?.role === 'admin') navigate(`/admin/support/${referenceId}`);
        else if (user?.role === 'wholesale') navigate(`/wholesale/support/${referenceId}`);
        else navigate(`/dashboard/support/${referenceId}`);
      }
    } catch (error) {
      toast.error('Error marking as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Error marking all as read');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your account activity</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="order">Orders</option>
              <option value="payment">Payments</option>
              <option value="wallet">Wallet</option>
              <option value="wholesale">Wholesale</option>
              <option value="support">Support</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>
          
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No notifications found</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                onClick={() => markAsRead(notification.id, notification.reference_type, notification.reference_id)}
                className={`p-6 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!notification.is_read ? 'bg-emerald-50/20' : ''}`}
              >
                <div className="shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <p className={`text-base font-medium ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-slate-400 whitespace-nowrap">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {notification.message}
                  </p>
                  
                  {notification.type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 mt-3 capitalize">
                      {notification.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
