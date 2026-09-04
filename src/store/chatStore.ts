import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface ChatState {
  unreadCount: number;
  fetchUnreadCount: (userId: string, role: string) => Promise<void>;
  subscribeToMessages: (userId: string, role: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  unreadCount: 0,
  fetchUnreadCount: async (userId, role) => {
    try {
      let count = 0;
      if (role === 'admin' || role === 'super_admin') {
        const { count: adminCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', userId)
          .neq('status', 'read');
        count = adminCount || 0;
      } else {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (conv) {
          const { count: userCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .neq('status', 'read');
          count = userCount || 0;
        }
      }
      set({ unreadCount: count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },
  subscribeToMessages: (userId, role) => {
    supabase
      .channel('global_messages_status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        useChatStore.getState().fetchUnreadCount(userId, role);
      })
      .subscribe();
  }
}));
