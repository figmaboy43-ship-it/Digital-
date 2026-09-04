import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Send, Image as ImageIcon, Paperclip, Check, CheckCheck, Loader2, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminChat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    fetchConversations();
    
    // Fallback polling to guarantee delivery
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 3000);

    const subscription = supabase
      .channel('admin_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        fetchConversations();
        if (activeConv && payload.new.conversation_id === activeConv.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender_id !== user?.id) {
            supabase.from('messages').update({ status: 'read' }).eq('id', payload.new.id);
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(subscription);
    };
  }, [activeConv]);

  // Polling active conversation messages independently for faster response
  useEffect(() => {
    let msgInterval: any;
    if (activeConv) {
      msgInterval = setInterval(async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', activeConv.id)
          .order('created_at', { ascending: true });
          
        if (data) {
          setMessages(data);
          const unreadIds = data.filter(m => m.sender_id !== user?.id && m.status !== 'read').map(m => m.id);
          if (unreadIds.length > 0) {
            await supabase.from('messages').update({ status: 'read' }).in('id', unreadIds);
          }
        }
      }, 2000);
    }
    return () => clearInterval(msgInterval);
  }, [activeConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, profiles:user_id(full_name, email, role)')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id, status')
        .neq('sender_id', user?.id)
        .neq('status', 'read');
        
      const counts: any = {};
      unreadData?.forEach(m => {
        counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
      });

      const enhancedConvs = data?.map(c => ({
        ...c,
        unread_count: counts[c.id] || 0
      })) || [];

      // only update if stringified length changes to avoid unnecessary re-renders
      setConversations(prev => JSON.stringify(prev) !== JSON.stringify(enhancedConvs) ? enhancedConvs : prev);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: any) => {
    setActiveConv(conv);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      const unreadIds = data?.filter(m => m.sender_id !== user?.id && m.status !== 'read').map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ status: 'read' }).in('id', unreadIds);
        fetchConversations();
      }
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeConv || sending) return;

    setSending(true);
    let attachment_url = null;

    try {
      if (selectedFile) {
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `admin/${fileName}`;
        
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
        conversation_id: activeConv.id,
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
      fetchConversations(); // Trigger sidebar update
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const filteredConvs = conversations.filter(c => 
    c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-200 flex-col bg-slate-50`}>
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500">Loading...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No conversations found</div>
          ) : (
            filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                  activeConv?.id === conv.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-900 truncate pr-2">
                      {conv.profiles?.full_name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(conv.updated_at), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <span className="truncate">{conv.profiles?.email}</span>
                  </div>
                </div>
                {conv.unread_count > 0 && (
                  <span className="ml-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`${!activeConv ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>
        {activeConv ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
              <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setActiveConv(null)}>
                &larr; Back
              </button>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{activeConv.profiles?.full_name}</h3>
                <p className="text-xs text-slate-500">{activeConv.profiles?.email}</p>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
              {messages.map((msg) => {
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
              })}
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
                    placeholder="Type your reply..."
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
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-medium text-slate-600">Select a conversation</p>
            <p className="text-sm">Choose a user from the left to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
