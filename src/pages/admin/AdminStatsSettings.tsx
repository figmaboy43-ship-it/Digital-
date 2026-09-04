import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, BarChart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStatsSettings() {
  const [stats, setStats] = useState([
    { id: 1, label: 'মোট সেবা প্রদান', value: '২,৮৪৫+' },
    { id: 2, label: 'নিবন্ধিত গ্রাহক', value: '১,২৫০+' },
    { id: 3, label: 'হোলসেল পার্টনার', value: '৩৪০+' },
    { id: 4, label: 'সক্রিয় সেবাসমূহ', value: '১০৫+' }
  ]);
  
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
        .eq('key', 'hero_stats')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value && Array.isArray(data.value)) {
        setStats(data.value);
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
      
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'hero_stats')
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: stats, updated_at: new Date().toISOString() })
          .eq('key', 'hero_stats');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'hero_stats', value: stats }]);
        if (error) throw error;
      }

      toast.success('Stats saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save stats');
    } finally {
      setSaving(false);
    }
  };

  const handleStatChange = (id: number, field: 'label' | 'value', newValue: string) => {
    setStats(stats.map(stat => stat.id === id ? { ...stat, [field]: newValue } : stat));
  };

  if (loading) {
    return <div className="animate-pulse flex p-8 justify-center">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Homepage Stats Settings</h1>
        <p className="text-slate-500 mt-1">Customize the statistics shown below the search box on the homepage.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={stat.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h3 className="font-semibold text-slate-700 mb-3">Stat Item {index + 1}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Label (e.g. Total Services)</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => handleStatChange(stat.id, 'label', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Value (e.g. 50,000+)</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => handleStatChange(stat.id, 'value', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-lg font-bold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="gov-button flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Stats'}
          </button>
        </div>
      </div>
    </div>
  );
}
