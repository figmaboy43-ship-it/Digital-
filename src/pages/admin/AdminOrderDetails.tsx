import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Clock, CheckCircle, AlertCircle, Shield, 
  MessageSquare, History, FileText, User, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          user:user_id (full_name, email, phone, role, account_status),
          service:service_id (name, processing_time_hours)
        `)
        .eq('id', id)
        .single();
        
      if (orderError) throw orderError;
      setOrder(orderData);
      setAdminNote(orderData.admin_note || '');

      const { data: eventsData, error: eventsError } = await supabase
        .from('order_events')
        .select(`*, actor:actor_id(full_name, role)`)
        .eq('order_id', id)
        .order('created_at', { ascending: false });
        
      if (!eventsError) setEvents(eventsData || []);
      
    } catch (error: any) {
      toast.error('Failed to load order details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_order_status', {
        p_order_id: order.id,
        p_new_status: newStatus,
        p_message: `Order status changed to ${newStatus.replace('_', ' ')}`,
        p_admin_note: adminNote
      });
      if (error) throw error;
      toast.success('Order status updated');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const processRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Refund reason is required');
      return;
    }
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_process_refund', {
        p_order_id: order.id,
        p_reason: refundReason
      });
      if (error) throw error;
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading order workspace...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/orders" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Workspace: {order.order_number || order.id.split('-')[0]}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
              ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                order.status === 'refunded' ? 'bg-red-100 text-red-800' :
                'bg-slate-100 text-slate-800'}
            `}>
              {order.status.replace('_', ' ')}
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Placed on {format(new Date(order.created_at), 'PPP at p')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-slate-400" />
              Service & Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Service Requested</p>
                <p className="font-medium text-slate-900">{order.service?.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Customer Type</p>
                <p className="font-medium capitalize text-slate-900">{order.customer_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Unit Price × Quantity</p>
                <p className="font-medium text-slate-900">৳{order.unit_price} × {order.order_data?.price_snapshot?.quantity || 1}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Paid</p>
                <p className="text-xl font-bold text-emerald-600">৳{order.total_amount}</p>
                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{order.payment_status}</p>
              </div>
            </div>
          </div>

          {/* User Submitted Data */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Submitted Information</h2>
            
            {order.customer_note && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm font-bold text-amber-900 mb-1">Customer Note:</p>
                <p className="text-amber-800 text-sm whitespace-pre-wrap">{order.customer_note}</p>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(order.order_data || {}).map(([key, value]) => {
                if (key === 'price_snapshot' || key === 'quantity') return null;
                return (
                  <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-slate-900 font-medium whitespace-pre-wrap">
                      {String(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-slate-400" />
              Processing Controls
            </h2>
            
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-slate-700">Internal Admin Note (Not visible to customer)</label>
              <textarea 
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Leave notes for other admins..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {order.status === 'pending_payment' && (
                <button 
                  onClick={() => updateStatus('processing')}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Mark as Processing
                </button>
              )}
              {['pending_payment', 'processing', 'need_information'].includes(order.status) && (
                <>
                  <button 
                    onClick={() => updateStatus('need_information')}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    Request Information
                  </button>
                  <button 
                    onClick={() => updateStatus('completed')}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors"
                  >
                    Complete Order
                  </button>
                </>
              )}
              
              {['pending_payment', 'processing', 'need_information'].includes(order.status) && order.payment_status === 'paid' && (
                <button 
                  onClick={() => setShowRefundModal(true)}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors ml-auto"
                >
                  Process Refund
                </button>
              )}

              {/* Just save note */}
              {adminNote !== order.admin_note && (
                 <button 
                 onClick={() => updateStatus(order.status)}
                 disabled={statusLoading}
                 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-colors"
               >
                 Save Note
               </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Timeline */}
        <div className="space-y-6">
          
          {/* Customer Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider">
              <User className="w-4 h-4 mr-2 text-slate-400" />
              Customer Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{order.user?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{order.user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{order.user?.phone || 'N/A'}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Account Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${order.user?.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {order.user?.account_status}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider">
              <History className="w-4 h-4 mr-2 text-slate-400" />
              Order Timeline
            </h3>
            
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
                  {/* Line */}
                  {index !== events.length - 1 && (
                    <div className="absolute left-[9px] top-3 bottom-0 w-0.5 bg-slate-100"></div>
                  )}
                  {/* Dot */}
                  <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                  
                  <p className="text-sm font-bold text-slate-900">{event.event_type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                      {format(new Date(event.created_at), 'MMM d, h:mm a')}
                    </span>
                    <span className="text-[10px] text-slate-400">by {event.actor?.full_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Process Refund</h2>
            <p className="text-slate-500 text-sm mb-6">
              This will return <span className="font-bold text-slate-900">৳{order.total_amount}</span> to the user's wallet and cancel the order. This action cannot be undone.
            </p>
            
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-slate-700">Reason for Refund</label>
              <textarea 
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Out of stock, customer requested cancellation..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500 min-h-[100px] outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={processRefund}
                disabled={statusLoading || !refundReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {statusLoading ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
