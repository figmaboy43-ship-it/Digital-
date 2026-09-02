import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function WholesaleDeposit() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingMethods, setFetchingMethods] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method_id: '',
    transaction_id: '',
    sender_number: '',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPaymentMethods(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, payment_method_id: data[0].id }));
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load payment methods');
    } finally {
      setFetchingMethods(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedMethod = paymentMethods.find(m => m.id === formData.payment_method_id);
    const amount = Number(formData.amount);
    
    if (amount <= 0) {
      return toast.error('Amount must be greater than zero');
    }

    if (selectedMethod) {
      if (selectedMethod.min_amount && amount < selectedMethod.min_amount) {
        return toast.error(`Minimum deposit amount is ৳${selectedMethod.min_amount}`);
      }
      if (selectedMethod.max_amount && amount > selectedMethod.max_amount) {
        return toast.error(`Maximum deposit amount is ৳${selectedMethod.max_amount}`);
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          payment_method_id: formData.payment_method_id,
          amount: amount,
          transaction_reference: formData.transaction_id,
          status: 'pending',
          admin_note: `Sender: ${formData.sender_number}`
        });

      if (error) throw error;

      toast.success('Wholesale deposit request submitted successfully.');
      navigate('/wholesale/wallet');
    } catch (error: any) {
      console.error('Deposit Error:', error);
      toast.error(error.message || 'Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === formData.payment_method_id);

  if (fetchingMethods) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wholesale Deposit</h1>
        <p className="text-slate-500 mt-1">Add funds to your B2B wallet for uninterrupted bulk ordering</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
            <div className="relative z-10 space-y-6">
              <h2 className="text-xl font-bold mb-4">Payment Instructions</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 mr-4 border border-emerald-500/30">1</div>
                  <div>
                    <h3 className="font-semibold text-white">Select Method & Send Money</h3>
                    <p className="text-slate-400 text-sm mt-1">Send the desired amount to our official numbers below.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 mr-4 border border-emerald-500/30">2</div>
                  <div>
                    <h3 className="font-semibold text-white">Save Transaction ID</h3>
                    <p className="text-slate-400 text-sm mt-1">Copy the TrxID from your payment confirmation SMS.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 mr-4 border border-emerald-500/30">3</div>
                  <div>
                    <h3 className="font-semibold text-white">Priority Verification</h3>
                    <p className="text-slate-400 text-sm mt-1">Wholesale deposits are prioritized in our system queue.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Corporate Accounts</h3>
                <div className="space-y-3">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center">
                        <span className="font-medium text-white">{method.name}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-medium text-sm">{method.account_identifier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mr-3 shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900 mb-1">Secure B2B Transactions</h4>
              <p className="text-emerald-800/80 text-sm">All wholesale deposits are verified with high priority. Large transfers may require additional verification.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Deposit Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setFormData({ ...formData, payment_method_id: method.id })}
                    className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all text-left ${
                      formData.payment_method_id === method.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{method.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedMethod && selectedMethod.instructions && (
               <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                  {selectedMethod.instructions}
               </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount Sent (৳) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-medium">৳</span>
                </div>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg font-medium"
                  placeholder="Min. 500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sender {selectedMethod?.name} Number / Acc *</label>
              <input
                type="text"
                required
                value={formData.sender_number}
                onChange={(e) => setFormData({ ...formData, sender_number: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID (TrxID) *</label>
              <input
                type="text"
                required
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono uppercase"
                placeholder="e.g. 9JA7B5KX"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70"
              >
                {loading ? 'Submitting...' : 'Submit Deposit Request'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
