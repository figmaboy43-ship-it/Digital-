import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Plus, Trash2, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFooterSettings() {
  const [siteName, setSiteName] = useState('ডিজিটাল সেবা পোর্টাল');
  const [description, setDescription] = useState('এটি একটি ডেমো ডিজিটাল সেবা প্রদানকারী পোর্টাল। এখানে আপনি বিভিন্ন অনলাইন সেবা সহজে এবং নিরাপদে গ্রহণ করতে পারবেন।');
  const [phone, setPhone] = useState('+880 1234 567890');
  const [email, setEmail] = useState('support@digitalseba.com');
  const [workingHours, setWorkingHours] = useState('রবি-বৃহস্পতি, সকাল ৯টা - বিকাল ৫টা');
  const [copyright, setCopyright] = useState('ডিজিটাল সেবা পোর্টাল। সর্বস্বত্ব সংরক্ষিত।');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_content')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value) {
        if (data.value.siteName) setSiteName(data.value.siteName);
        if (data.value.description) setDescription(data.value.description);
        if (data.value.phone) setPhone(data.value.phone);
        if (data.value.email) setEmail(data.value.email);
        if (data.value.workingHours) setWorkingHours(data.value.workingHours);
        if (data.value.copyright) setCopyright(data.value.copyright);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        siteName,
        description,
        phone,
        email,
        workingHours,
        copyright
      };

      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'footer_content')
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: payload, updated_at: new Date().toISOString() })
          .eq('key', 'footer_content');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'footer_content', value: payload }]);
        if (error) throw error;
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex p-8 justify-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Website Footer Settings</h1>
        <p className="text-slate-500 mt-1">Customize the footer information displayed on the public website</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Site Name (সাইটের নাম)</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (বিবরণ)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (ফোন নম্বর)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address (ইমেইল)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Working Hours (কাজের সময়)</label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Copyright Text (কপিরাইট টেক্সট)</label>
            <input
              type="text"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Note: The current year will be prepended automatically.</p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="gov-button flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
