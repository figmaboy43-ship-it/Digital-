import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Eye, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const tabs = ['All', 'Paid', 'Processing', 'Need Information', 'Completed', 'Cancelled', 'Refunded'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:user_id (full_name, email, role),
          service:service_id (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">Processing</span>;
      case 'need_information': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Need Info</span>;
      case 'completed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">Completed</span>;
      case 'cancelled': 
      case 'refunded': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium capitalize">{status}</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium capitalize">{status.replace('_', ' ')}</span>;
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.order_number || o.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.service?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'Paid') matchesTab = o.payment_status === 'paid' && o.status === 'pending_payment';
    else if (activeTab === 'Processing') matchesTab = o.status === 'processing';
    else if (activeTab === 'Need Information') matchesTab = o.status === 'need_information';
    else if (activeTab === 'Completed') matchesTab = o.status === 'completed';
    else if (activeTab === 'Cancelled') matchesTab = o.status === 'cancelled';
    else if (activeTab === 'Refunded') matchesTab = o.status === 'refunded';

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Order Queue</h1>
          <p className="text-slate-500 mt-1">Manage and fulfill all customer orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID / Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-slate-900">{order.order_number || order.id.split('-')[0]}</div>
                    <div className="text-xs text-slate-500 mt-1">{format(new Date(order.created_at), 'MMM d, h:mm a')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{order.user?.full_name}</div>
                    <div className="text-xs text-slate-500">
                      {order.customer_type === 'wholesale' ? (
                        <span className="text-emerald-600 font-medium">Wholesale</span>
                      ) : 'Retail'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{order.service?.name}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">৳{order.total_amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize
                      ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                        order.priority === 'high' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-700'}
                    `}>
                      {order.priority || 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(order.status)}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                        ${order.payment_status === 'paid' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}
                      `}>
                        {order.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/admin/orders/${order.id}`} className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors">
                      <Eye className="w-4 h-4 mr-1.5" />
                      Workspace
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
