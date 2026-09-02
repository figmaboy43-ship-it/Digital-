import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Wallet, CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchPaymentStats();
  }, [startDate, endDate]);

  const handleDateRangeChange = (val: string) => {
    setDateRange(val);
    const end = new Date();
    let start = new Date();
    
    if (val === 'today') start = new Date();
    if (val === '7d') start = subDays(end, 7);
    if (val === '30d') start = subDays(end, 30);
    if (val === 'month') {
      start = startOfMonth(end);
      end.setTime(endOfMonth(end).getTime());
    }
    
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const fetchPaymentStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_payment_analytics', {
        p_start_date: startDate + ' 00:00:00',
        p_end_date: endDate + ' 23:59:59'
      });
      if (error) throw error;
      setStats(data);
    } catch (err) {
      toast.error('Failed to load payment analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !stats) return <div className="flex justify-center p-12"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Payment & Wallet Intelligence</h2>
          <p className="text-sm text-gray-500">Immutable ledger statistics</p>
        </div>
        <select 
          value={dateRange}
          onChange={(e) => handleDateRangeChange(e.target.value)}
          className="border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg"><CreditCard className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Manual Payments</p>
            <p className="text-3xl font-bold text-gray-900">৳ {stats?.manual_payments_total?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg"><Wallet className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Deposits</p>
            <p className="text-3xl font-bold text-gray-900">৳ {stats?.total_deposits?.toLocaleString() || 0}</p>
            <p className="text-xs text-green-600 mt-1">Approved: ৳ {stats?.approved_deposits || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg"><RefreshCw className="w-6 h-6 text-yellow-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Deposits</p>
            <p className="text-3xl font-bold text-gray-900">৳ {stats?.pending_deposits?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-lg"><Wallet className="w-6 h-6 text-red-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Refunds Processed</p>
            <p className="text-3xl font-bold text-gray-900">৳ {stats?.refunds?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
