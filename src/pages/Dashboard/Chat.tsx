import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Send, Image as ImageIcon, Paperclip, Check, CheckCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Chat() {
  const { user, profile } = useAuthStore();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      initChat();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initChat = async () => {
    try {
      // Find or create conversation
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

      // Fetch messages
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs || []);

      // Mark unread as read
      const unreadIds = msgs?.filter(m => m.sender_id !== user?.id && m.status !== 'read').map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ status: 'read' }).in('id', unreadIds);
      }

      // Subscribe to new messages
      const subscription = supabase
        .channel(`chat_${conv.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
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
    if ((!newMessage.trim() && !fileInputRef.current?.files?.length) || !conversation || sending) return;

    setSending(true);
    let attachment_url = null;

    try {
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);
          
        attachment_url = publicUrl;
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      const { error } = await supabase.from('messages').insert([{
        conversation_id: conversation.id,
        sender_id: user?.id,
        content: newMessage.trim() || null,
        attachment_url,
        status: 'sent'
      }]);

      if (error) throw error;
      setNewMessage('');
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
        {/* Messages Area */}
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
                        {msg.attachment_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
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

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={() => setNewMessage(prev => prev)} // trigger re-render to check file
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
              {fileInputRef.current?.files?.length ? (
                <div className="absolute -top-8 left-0 bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {fileInputRef.current.files[0].name}
                  <button type="button" onClick={() => {if(fileInputRef.current) fileInputRef.current.value = ''; setNewMessage(prev=>prev);}} className="ml-2 font-bold">&times;</button>
                </div>
              ) : null}
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
              disabled={sending || uploading || (!newMessage.trim() && !fileInputRef.current?.files?.length)}
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
