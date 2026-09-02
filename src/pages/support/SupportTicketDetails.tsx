import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportTicketDetails() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && id) {
      fetchTicketData();
      
      const channel = supabase
        .channel(`ticket_${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${id}` },
          (payload) => {
            fetchTicketData(); // refresh to get sender details
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, id]);

  const fetchTicketData = async () => {
    try {
      // Get ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:user_id (full_name, email, role),
          assigned_admin:assigned_admin_id (full_name)
        `)
        .eq('id', id)
        .single();
        
      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:sender_id (full_name, role)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      toast.error('Failed to load ticket details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: id,
          sender_id: user?.id,
          message: replyText,
          is_internal: isInternal
        });

      if (error) throw error;
      
      // Update ticket status automatically
      const newStatus = user?.role === 'admin' ? (isInternal ? ticket.status : 'waiting_user') : 'in_progress';
      
      if (ticket.status !== newStatus) {
         await supabase.from('support_tickets').update({ status: newStatus, updated_at: new Date() }).eq('id', id);
      }
      
      setReplyText('');
      setIsInternal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase.from('support_tickets').update({ status: newStatus, updated_at: new Date() }).eq('id', id);
      if (error) throw error;
      setTicket({ ...ticket, status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (!ticket) return <div>Ticket not found</div>;

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{ticket.subject}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 font-mono">
                {ticket.ticket_number}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {isAdmin ? `From: ${ticket.user?.full_name}` : `Category: ${ticket.category}`} • Status: <span className="capitalize font-medium text-slate-700">{ticket.status.replace('_', ' ')}</span>
            </p>
            {(ticket.related_order_id || ticket.related_payment_id) && (
              <p className="text-xs text-slate-400 mt-1">
                {ticket.related_order_id ? `Related Order: ${ticket.related_order_id.split('-')[0]}` : `Related Payment: ${ticket.related_payment_id.split('-')[0]}`}
              </p>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <select 
            value={ticket.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium capitalize bg-slate-50"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_user">Waiting on User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-slate-50 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const isStaff = msg.sender?.role === 'admin' || msg.sender?.role === 'super_admin';
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.is_internal 
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm' 
                  : isMe 
                    ? 'bg-emerald-600 text-white rounded-br-sm shadow-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.is_internal && (
                  <div className="flex items-center text-xs font-bold text-amber-700 mb-1 uppercase tracking-wider">
                    <Shield className="w-3 h-3 mr-1" /> Internal Note (Hidden from User)
                  </div>
                )}
                <div className={`text-xs mb-1 font-medium ${isMe ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {msg.sender?.full_name} {isStaff && !isMe && !msg.is_internal && ' (Support)'}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.message}
                </div>
                <div className={`text-[10px] mt-2 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Area */}
      {ticket.status !== 'closed' ? (
        <div className="bg-white border-t border-slate-200 p-4 shrink-0 rounded-b-2xl">
          <form onSubmit={handleSendReply} className="flex flex-col gap-3">
            {isAdmin && (
              <div className="flex items-center px-2">
                <input 
                  type="checkbox" 
                  id="internal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 mr-2"
                />
                <label htmlFor="internal" className="text-sm font-medium text-amber-700 flex items-center">
                  <Shield className="w-4 h-4 mr-1" /> Send as Internal Note
                </label>
              </div>
            )}
            <div className="flex items-end gap-3">
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternal ? "Type a private internal note..." : "Type your reply..."}
                className={`flex-1 max-h-32 min-h-[56px] resize-none border rounded-xl py-3 px-4 focus:ring-2 focus:outline-none transition-colors ${
                  isInternal 
                    ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500 bg-amber-50/30' 
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || sending}
                className={`p-4 rounded-xl text-white shadow-sm transition-all disabled:opacity-50 flex-shrink-0 ${
                  isInternal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-100 border-t border-slate-200 p-6 text-center text-slate-500 rounded-b-2xl">
          This ticket has been closed. If you need further assistance, please open a new ticket.
        </div>
      )}
    </div>
  );
}
