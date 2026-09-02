import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit2, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    account_identifier: '',
    instructions: '',
    is_active: true,
    min_amount: '',
    max_amount: ''
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase.from('payment_methods').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        account_identifier: formData.account_identifier,
        instructions: formData.instructions,
        is_active: formData.is_active,
        min_amount: formData.min_amount ? Number(formData.min_amount) : null,
        max_amount: formData.max_amount ? Number(formData.max_amount) : null,
      };

      if (editingId) {
        const { error } = await supabase.from('payment_methods').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Payment method updated');
      } else {
        const { error } = await supabase.from('payment_methods').insert([payload]);
        if (error) throw error;
        toast.success('Payment method added');
      }

      setEditingId(null);
      setFormData({ name: '', account_identifier: '', instructions: '', is_active: true, min_amount: '', max_amount: '' });
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save payment method');
    }
  };

  const startEdit = (method: any) => {
    setEditingId(method.id);
    setFormData({
      name: method.name,
      account_identifier: method.account_identifier || '',
      instructions: method.instructions || '',
      is_active: method.is_active,
      min_amount: method.min_amount || '',
      max_amount: method.max_amount || ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Methods</h1>
        <p className="text-slate-500 mt-1">Manage manual deposit methods available to users</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{editingId ? 'Edit Method' : 'Add New Method'}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name (e.g. bKash)</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Number / Identifier</label>
              <input required value={formData.account_identifier} onChange={e => setFormData({...formData, account_identifier: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Amount (Optional)</label>
              <input type="number" value={formData.min_amount} onChange={e => setFormData({...formData, min_amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Amount (Optional)</label>
              <input type="number" value={formData.max_amount} onChange={e => setFormData({...formData, max_amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (Optional)</label>
              <textarea value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="mr-2 rounded text-emerald-600 focus:ring-emerald-500" />
              <label htmlFor="active" className="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({name:'', account_identifier:'', instructions:'', is_active:true, min_amount:'', max_amount:''}); }} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            )}
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
              {editingId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? 'Update Method' : 'Add Method'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Method</th>
              <th className="px-6 py-4 font-semibold">Account</th>
              <th className="px-6 py-4 font-semibold">Limits</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {methods.map((method) => (
              <tr key={method.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">{method.name}</td>
                <td className="px-6 py-4 font-mono text-slate-600">{method.account_identifier}</td>
                <td className="px-6 py-4 text-slate-500">
                  {method.min_amount ? `Min: ${method.min_amount}` : ''} 
                  {method.max_amount ? ` Max: ${method.max_amount}` : ''}
                </td>
                <td className="px-6 py-4">
                  {method.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"><XCircle className="w-3 h-3 mr-1" /> Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => startEdit(method)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
