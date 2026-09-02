import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Clock, Plus, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function Wallet() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();
      
      if (walletData) {
        setBalance(walletData.balance);
      }

      // Fetch transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (txData) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</span>;
      case 'failed':
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />{status === 'rejected' ? 'Rejected' : 'Failed'}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6"><div className="h-40 bg-white rounded-2xl"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Wallet</h1>
          <p className="text-slate-500 mt-1">Manage your funds and view transaction history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-slate-800">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <WalletIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-slate-300 font-medium">Available Balance</h2>
              </div>
              <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-8">
                ৳{balance.toFixed(2)}
              </p>
              
              <div className="flex gap-3">
                <Link to="/dashboard/deposit" className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors shadow-sm">
                  <Plus className="w-5 h-5 mr-2" />
                  Deposit Funds
                </Link>
              </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
              
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 uppercase text-xs">
                        {tx.id.split('-')[0]}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'admin_adjustment' ? (
                            <ArrowDownRight className="w-4 h-4 mr-2 text-emerald-500" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 mr-2 text-red-500" />
                          )}
                          <span className="font-medium text-slate-700 capitalize">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'admin_adjustment' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'admin_adjustment' ? '+' : '-'}৳{tx.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tx.status)}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                          <WalletIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 font-medium mb-1">No transactions yet</h3>
                        <p className="text-slate-500 text-sm mb-4">Your transaction history will appear here.</p>
                        <Link to="/dashboard/deposit" className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-colors">
                          Deposit Funds Now
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
