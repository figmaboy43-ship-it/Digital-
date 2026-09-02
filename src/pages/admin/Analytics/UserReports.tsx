import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../lib/exportUtils';
import { Users, UserPlus, UserCheck, UserX, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserReports() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchUserAnalytics();
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

  const fetchUserAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_analytics', {
        p_start_date: startDate + ' 00:00:00',
        p_end_date: endDate + ' 23:59:59'
      });
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('User Analytics Error:', error);
      toast.error('Failed to load user analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!stats) return toast.error('No data to export');
    const filename = `User_Analytics_${startDate}_to_${endDate}`;
    
    const exportData = [{
      'Total Users': stats.total_users,
      'New Users (Period)': stats.new_users,
      'Retail Users': stats.retail_users,
      'Wholesale Users': stats.wholesale_users,
      'Suspended Users': stats.suspended_users,
      'Users w/ Orders': stats.users_with_orders,
      'Users w/ Balance': stats.users_with_balance
    }];

    if (format === 'csv') exportToCSV(exportData, filename, 'user_analytics', { startDate, endDate });
    if (format === 'xlsx') exportToExcel(exportData, filename, 'user_analytics', { startDate, endDate });
    if (format === 'pdf') exportToPDF(exportData, filename, 'user_analytics', { startDate, endDate });
    toast.success(`${format.toUpperCase()} exported successfully`);
  };

  if (isLoading && !stats) {
    return <div className="flex justify-center items-center h-64"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Intelligence</h2>
          <p className="text-sm text-gray-500">Privacy-safe aggregated user statistics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
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
          
          <div className="flex gap-2">
             <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-100">CSV</button>
             <button onClick={() => handleExport('xlsx')} className="px-3 py-1.5 bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-100">Excel</button>
             <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-100">PDF</button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Registered Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_users || 0}</p>
              <div className="mt-1 flex gap-3 text-xs text-gray-500">
                <span>Retail: {stats.retail_users || 0}</span>
                <span>Wholesale: {stats.wholesale_users || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg"><UserPlus className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">New Users (Selected Period)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.new_users || 0}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg"><UserCheck className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Purchasers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.users_with_orders || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Users who placed an order in period</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-lg"><UserX className="w-6 h-6 text-red-600" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Suspended Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.suspended_users || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg"><AlertCircle className="w-6 h-6 text-orange-600" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Users with Balance</p>
              <p className="text-3xl font-bold text-gray-900">{stats.users_with_balance || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Users holding wallet funds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
