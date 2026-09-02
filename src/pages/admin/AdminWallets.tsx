import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, CheckCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          user:user_id (full_name, email, role)
        `)
        .order('balance', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdjustment = async (userId: string, currentBalance: number) => {
    const amountStr = window.prompt(`Enter amount to add/deduct for this user.\nUse negative for deduction. (Current Balance: ৳${currentBalance})`);
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) {
      toast.error('Invalid amount');
      return;
    }

    const reason = window.prompt('Enter reason for this adjustment (Required for audit log):');
    if (!reason) {
      toast.error('Reason is required');
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_wallet_adjustment', {
        p_user_id: userId,
        p_amount: amount,
        p_type: 'admin_adjustment',
        p_description: reason
      });

      if (error) throw error;
      
      toast.success('Wallet adjusted successfully');
      fetchWallets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust wallet');
    }
  };

  const handleFreezeToggle = async (userId: string, currentStatus: string) => {
    const isFrozen = currentStatus === 'frozen';
    const action = isFrozen ? 'unfreeze' : 'freeze';
    
    if (!window.confirm(`Are you sure you want to ${action} this wallet?`)) return;

    try {
      const { error } = await supabase.rpc('admin_freeze_wallet', { 
        p_user_id: userId, 
        p_freeze: !isFrozen 
      });

      if (error) throw error;
      toast.success(`Wallet ${action}d successfully`);
      fetchWallets();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} wallet`);
    }
  };

  const filteredWallets = wallets.filter(w => 
    w.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading wallets...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wallets</h1>
        <p className="text-slate-500 mt-1">Manage user balances, manual adjustments, and freezes.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex flex-col sm:flex-row justify-between p-4 bg-slate-50/50 gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{wallet.user?.full_name}</div>
                    <div className="text-xs text-slate-500">{wallet.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ৳{wallet.balance}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${wallet.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                    `}>
                      {wallet.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1"/> : <ShieldAlert className="w-3 h-3 mr-1"/>}
                      {wallet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(wallet.updated_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleManualAdjustment(wallet.user_id, wallet.balance)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Adjust Balance
                    </button>
                    <button 
                      onClick={() => handleFreezeToggle(wallet.user_id, wallet.status)}
                      className={`text-sm font-medium transition-colors ${wallet.status === 'frozen' ? 'text-emerald-600 hover:text-emerald-800' : 'text-red-600 hover:text-red-800'}`}
                    >
                      {wallet.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
