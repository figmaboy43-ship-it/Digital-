import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWholesaleSettings() {
  const [benefits, setBenefits] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string>('');
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
        .eq('key', 'wholesale_content')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBenefits(data.value?.benefits || []);
        setConditions(data.value?.conditions || '');
      } else {
        // Defaults
        setBenefits([
          'সেবার মূল্যে বিশেষ ছাড় (Up to 40%)',
          'অগ্রাধিকার ভিত্তিতে দ্রুত সার্ভিস প্রসেসিং',
          'হোলসেল পার্টনারদের জন্য ডেডিকেটেড হেল্পডেস্ক',
          'সহজ ওয়ালেট সিস্টেম ও লেনদেনের পূর্ণাঙ্গ হিসাব'
        ]);
        setConditions('সঠিক তথ্য প্রদান করে আবেদন করুন। কর্তৃপক্ষ যাচাই শেষে অনুমোদন প্রদান করবেন। ভুয়া তথ্যের প্রমাণ পেলে আবেদন বাতিল করা হবে।');
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
        benefits,
        conditions
      };

      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'wholesale_content')
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: payload, updated_at: new Date().toISOString() })
          .eq('key', 'wholesale_content');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'wholesale_content', value: payload }]);
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

  const addBenefit = () => {
    setBenefits([...benefits, '']);
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  const removeBenefit = (index: number) => {
    const newBenefits = benefits.filter((_, i) => i !== index);
    setBenefits(newBenefits);
  };

  if (loading) {
    return <div className="animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Wholesale Benefits (হোলসেল সুবিধা)</h2>
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={benefit}
                onChange={(e) => updateBenefit(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Enter benefit description"
              />
              <button
                onClick={() => removeBenefit(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove benefit"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            onClick={addBenefit}
            className="inline-flex items-center px-4 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-medium text-sm transition-colors mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Benefit
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Terms and Conditions (শর্তাবলী)</h2>
        <textarea
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
          placeholder="Enter terms and conditions text"
        />
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
