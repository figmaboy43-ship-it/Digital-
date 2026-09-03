import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Send, History, HelpCircle } from 'lucide-react';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoText, setInfoText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`*, service:service_id (name, processing_time)`)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
        
      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: eventsData, error: eventsError } = await supabase
        .from('order_events')
        .select(`*`)
        .eq('order_id', id)
        .order('created_at', { ascending: false });
        
      if (!eventsError) setEvents(eventsData || []);
      
    } catch (error: any) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) fetchOrder();
  }, [id, user]);

  const submitInfo = async () => {
    if (!infoText.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('submit_order_information', {
        p_order_id: id,
        p_message: infoText
      });
      if (error) throw error;
      toast.success('Information submitted successfully');
      setInfoText('');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit information');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading order...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/orders" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Order: {order.order_number || order.id.split('-')[0]}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800`}>
                {order.status.replace('_', ' ')}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Placed on {format(new Date(order.created_at), 'PPP at p')}</p>
          </div>
        </div>
        <Link 
          to={`/dashboard/support/new?order_id=${order.id}`}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors flex items-center shadow-sm"
        >
          <HelpCircle className="w-4 h-4 mr-2" /> Need Help?
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Service Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">Service</p>
            <p className="font-medium text-slate-900">{order.service?.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Paid</p>
            <p className="font-bold text-emerald-600">৳{order.total_amount}</p>
          </div>
        </div>
      </div>

      {order.status === 'need_information' && (
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
          <h2 className="text-lg font-bold text-orange-900 mb-2 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Action Required
          </h2>
          <p className="text-orange-800 text-sm mb-4">The admin has requested more information to process this order. Please provide it below.</p>
          <textarea
            value={infoText}
            onChange={(e) => setInfoText(e.target.value)}
            placeholder="Type your response here..."
            className="w-full px-4 py-2 border border-orange-200 rounded-lg bg-white focus:ring-orange-500 min-h-[100px] outline-none"
          />
          <button 
            onClick={submitInfo}
            disabled={submitting || !infoText.trim()}
            className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Sending...' : 'Submit Information'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider">
          <History className="w-4 h-4 mr-2 text-slate-400" />
          Order Timeline
        </h3>
        
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
              {index !== events.length - 1 && (
                <div className="absolute left-[9px] top-3 bottom-0 w-0.5 bg-slate-100"></div>
              )}
              <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
              <p className="text-sm font-bold text-slate-900">{event.event_type.replace('_', ' ')}</p>
              {event.message && (
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                  {event.message.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => 
                    part.match(/^https?:\/\//) ? (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors no-underline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Now
                      </a>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">{format(new Date(event.created_at), 'MMM d, h:mm a')}</p>
            </div>
          ))}
          {events.length === 0 && <p className="text-slate-500 text-sm">No events found.</p>}
        </div>
      </div>
    </div>
  );
}
