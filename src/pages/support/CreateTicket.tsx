import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateTicket() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialOrderId = queryParams.get('order_id');
  const initialPaymentId = queryParams.get('payment_id');
  
  const [formData, setFormData] = useState({
    subject: initialOrderId ? `Issue with Order ${initialOrderId.split('-')[0]}` : (initialPaymentId ? `Payment Issue ${initialPaymentId.split('-')[0]}` : ''),
    category: initialOrderId ? 'order' : (initialPaymentId ? 'payment' : 'service'),
    priority: 'normal',
    message: ''
  });

  const categories = [
    { id: 'order', label: 'Order Issue' },
    { id: 'payment', label: 'Payment Problem' },
    { id: 'wallet', label: 'Wallet/Balance' },
    { id: 'service', label: 'Service Inquiry' },
    { id: 'account', label: 'Account' },
    ...(user?.role === 'wholesale' ? [{ id: 'wholesale', label: 'Wholesale & Pricing' }] : []),
    { id: 'technical', label: 'Technical Support' },
    { id: 'other', label: 'Other' },
  ];

  const basePath = user?.role === 'admin' ? '/admin/support' : (user?.role === 'wholesale' ? '/wholesale/support' : '/dashboard/support');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          category: formData.category,
          priority: formData.priority,
          related_order_id: initialOrderId || null,
          related_payment_id: initialPaymentId || null,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add initial message
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message: formData.message,
          is_internal: false
        });

      if (msgError) throw msgError;
      
      toast.success('Support ticket created successfully');
      navigate(basePath);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Open Support Ticket</h1>
          <p className="text-slate-500 mt-1">We'll get back to you as soon as possible</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input 
              required
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Brief summary of your issue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="low">Low - General inquiry</option>
                <option value="normal">Normal - Standard issue</option>
                <option value="high">High - Blocking issue</option>
                <option value="urgent">Urgent - Critical failure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea 
              required
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={6}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              placeholder="Describe your issue in detail..."
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
              {!loading && <Send className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
