import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Megaphone, Send, Users, ShieldAlert, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ retail: 0, wholesale: 0, total: 0 });
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('role');
      if (error) throw error;
      
      const counts = data.reduce((acc: any, profile: any) => {
        if (profile.role === 'retail') acc.retail++;
        else if (profile.role === 'wholesale') acc.wholesale++;
        acc.total++;
        return acc;
      }, { retail: 0, wholesale: 0, total: 0 });
      
      // Don't count admins in total for announcements
      counts.total = counts.retail + counts.wholesale;
      setStats(counts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return toast.error('Fill in all fields');
    
    const audienceCount = formData.audience === 'all' ? stats.total : (formData.audience === 'wholesale' ? stats.wholesale : stats.retail);
    
    if (!window.confirm(`Are you sure you want to send this announcement to ${audienceCount} users?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_admin_announcement', {
        p_title: formData.title,
        p_message: formData.message,
        p_target_audience: formData.audience
      });

      if (error) throw error;
      
      toast.success(`Announcement sent to ${audienceCount} users successfully!`);
      setFormData({ title: '', message: '', audience: 'all' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Announcements</h1>
        <p className="text-slate-500 mt-1">Broadcast important notifications to users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'all', label: 'All Users', count: stats.total },
                  { id: 'retail', label: 'Retail Only', count: stats.retail },
                  { id: 'wholesale', label: 'Wholesale Only', count: stats.wholesale }
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, audience: aud.id })}
                    className={`p-3 border rounded-xl flex flex-col items-start transition-all ${
                      formData.audience === aud.id 
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-medium ${formData.audience === aud.id ? 'text-emerald-700' : 'text-slate-700'}`}>{aud.label}</span>
                    <span className="text-xs text-slate-500 mt-1">{aud.count} recipients</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Announcement Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Scheduled Maintenance this Friday"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message Content</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Cannot be undone once sent
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center disabled:opacity-70"
              >
                {loading ? 'Sending...' : 'Send Broadcast'}
                {!loading && <Send className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <h3 className="font-bold text-emerald-900 mb-4 flex items-center">
              <Megaphone className="w-5 h-5 mr-2" /> 
              How it works
            </h3>
            <ul className="space-y-3 text-sm text-emerald-800/80">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 shrink-0" />
                Notifications appear instantly for online users via WebSockets.
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 shrink-0" />
                They will be waiting in the unread tray for offline users.
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-emerald-600 shrink-0" />
                Admins and Super Admins are automatically excluded from broadcasts.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
