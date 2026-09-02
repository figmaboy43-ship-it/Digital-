import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, HelpCircle } from 'lucide-react';

export function PaymentHistory() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id, amount, transaction_reference, status, created_at, order_id,
          method:payment_method_id (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'verified':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-2xl"></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment History</h1>
        <p className="text-slate-500 mt-1">Track your deposits and manual payments</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Payment ID</th>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-900 uppercase">
                    {payment.id.split('-')[0]}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">
                    {payment.order_id ? payment.order_id.split('-')[0] : 'N/A (Deposit)'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ৳{payment.amount}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {payment.method?.name || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {payment.transaction_reference}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(payment.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/dashboard/support/new?payment_id=${payment.id}`}
                      className="p-2 inline-flex items-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Report a problem with this payment"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-slate-900 font-medium mb-1">No payments found</h3>
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
