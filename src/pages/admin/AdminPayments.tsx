import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    todayDeposits: 0,
    totalBalance: 0,
    todayOrderPayments: 0,
    todayRefunds: 0
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // We could use an RPC for stats, but fetching some basics here
      const { data: walletData } = await supabase.from('wallets').select('balance');
      const totalBalance = walletData?.reduce((acc, w) => acc + Number(w.balance), 0) || 0;

      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount, status, order_id')
        .gte('created_at', today.toISOString());
      
      let todayDeposits = 0;
      let todayOrderPayments = 0;
      
      todayPayments?.forEach(p => {
        if (p.status === 'verified') {
            if (!p.order_id) todayDeposits += Number(p.amount);
            else todayOrderPayments += Number(p.amount);
        }
      });

      setStats({
        todayDeposits,
        totalBalance,
        todayOrderPayments,
        todayRefunds: 0 // Mock refund stat, could fetch from wallet_transactions
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:user_id (full_name, email, role),
          method:payment_method_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!window.confirm('Verify this payment? This will update the order or wallet balance.')) return;
    
    try {
      const { error } = await supabase.rpc('admin_verify_payment', { p_payment_id: id });
      if (error) throw error;
      toast.success('Payment verified successfully');
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify payment');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason === null) return;
    
    try {
      const { error } = await supabase.rpc('admin_reject_payment', { p_payment_id: id, p_reason: reason || 'Invalid payment proof' });
      if (error) throw error;
      toast.success('Payment rejected');
      fetchPayments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject payment');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.status === activeTab &&
    (p.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Dashboard</h1>
        <p className="text-slate-500 mt-1">Review manual transactions, verify deposits, and track platform liquidity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-slate-500 text-sm font-medium mb-2">
            <ArrowDownRight className="w-4 h-4 mr-1.5 text-emerald-500" /> Today's Deposits (Verified)
          </div>
          <div className="text-2xl font-bold text-slate-900">৳{stats.todayDeposits.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-slate-500 text-sm font-medium mb-2">
            <Activity className="w-4 h-4 mr-1.5 text-blue-500" /> Today's Order Payments
          </div>
          <div className="text-2xl font-bold text-slate-900">৳{stats.todayOrderPayments.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center text-slate-500 text-sm font-medium mb-2">
            <ArrowUpRight className="w-4 h-4 mr-1.5 text-red-500" /> Today's Refunds
          </div>
          <div className="text-2xl font-bold text-slate-900">৳{stats.todayRefunds.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/50">
          <div className="flex items-center text-emerald-700 text-sm font-medium mb-2">
            <Wallet className="w-4 h-4 mr-1.5" /> Total System Wallet Balance
          </div>
          <div className="text-2xl font-bold text-emerald-900">৳{stats.totalBalance.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex flex-col sm:flex-row justify-between p-4 bg-slate-50/50 gap-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setActiveTab('verified')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Verified
            </button>
            <button 
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'rejected' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Rejected
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by TrxID or User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Trx Reference</th>
                <th className="px-6 py-4 font-semibold">Method & Amount</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{payment.user?.full_name}</div>
                    <div className="text-xs text-slate-500">{payment.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-medium text-slate-900 uppercase">
                    {payment.transaction_reference || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">৳{payment.amount}</div>
                    <div className="text-xs text-slate-500">{payment.method?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {payment.order_id ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Order Payment</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Wallet Deposit</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(payment.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {payment.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleVerify(payment.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Verify
                        </button>
                        <button 
                          onClick={() => handleReject(payment.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </button>
                      </>
                    )}
                    {payment.status === 'rejected' && payment.admin_note && (
                       <span className="text-xs text-red-500">Note: {payment.admin_note}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-slate-900 font-medium mb-1">No payments found</h3>
                    <p className="text-slate-500 text-sm">There are no {activeTab} payments matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
