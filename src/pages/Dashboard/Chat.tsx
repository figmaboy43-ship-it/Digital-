import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Send, Image as ImageIcon, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Chat() {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    if (user) {
      initChat();
    }
  }, [user]);

  // Fallback Polling for robust real-time
  useEffect(() => {
    let pollInterval: any;
    if (conversation && user) {
      pollInterval = setInterval(async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
          
        if (!error && data) {
          setMessages(data);
          const unreadIds = data.filter(m => m.sender_id !== user.id && m.status !== 'read').map(m => m.id);
          if (unreadIds.length > 0) {
            await supabase.from('messages').update({ status: 'read' }).in('id', unreadIds);
          }
        }
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [conversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const initChat = async () => {
    try {
      let { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!conv) {
        const { data: newConv, error: newError } = await supabase
          .from('conversations')
          .insert([{ user_id: user?.id }])
          .select()
          .single();
        
        if (newError) throw newError;
        conv = newConv;
      }

      setConversation(conv);

      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs || []);

      const unreadIds = msgs?.filter(m => m.sender_id !== user?.id && m.status !== 'read').map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ status: 'read' }).in('id', unreadIds);
      }

      const subscription = supabase
        .channel(`chat_${conv.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender_id !== user?.id) {
             supabase.from('messages').update({ status: 'read' }).eq('id', payload.new.id);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (error: any) {
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !conversation || sending) return;

    setSending(true);
    let attachment_url = null;

    try {
      if (selectedFile) {
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);
          
        attachment_url = publicUrl;
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      const { data, error } = await supabase.from('messages').insert([{
        conversation_id: conversation.id,
        sender_id: user?.id,
        content: newMessage.trim() || null,
        attachment_url,
        status: 'sent'
      }]).select().single();

      if (error) throw error;
      
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Chat</h1>
        <p className="text-slate-500 mt-1">Chat directly with our support team</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-slate-400" />
              </div>
              <p>Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMine ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white text-slate-900 rounded-tl-sm border border-slate-200'
                  }`}>
                    {msg.attachment_url && (
                      <div className="mb-2">
                        {msg.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i) != null ? (
                          <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full h-auto max-h-60" />
                        ) : (
                          <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm">
                            <Paperclip className="w-4 h-4" /> View Attachment
                          </a>
                        )}
                      </div>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                      {isMine && (
                        msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                        msg.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
                        <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex items-end gap-2 relative">
            
            {selectedFile && (
              <div className="absolute -top-12 left-0 bg-emerald-100 text-emerald-800 text-xs px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm border border-emerald-200 z-10">
                <ImageIcon className="w-4 h-4" />
                <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                <button type="button" onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="ml-2 text-emerald-600 hover:text-emerald-900 font-bold p-1">&times;</button>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending || uploading || (!newMessage.trim() && !selectedFile)}
              className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
            >
              {sending || uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
