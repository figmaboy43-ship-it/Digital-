import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Download, Users, ShoppingBag, DollarSign, Wallet, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../lib/exportUtils';
import toast from 'react-hot-toast';

export default function AdminAnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  useEffect(() => {
    fetchAnalytics();
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

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Dashboard Stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_dashboard_stats', {
        p_start_date: startDate + ' 00:00:00',
        p_end_date: endDate + ' 23:59:59'
      });
      if (statsError) throw statsError;
      setStats(statsData);

      // 2. Fetch Chart Data
      const interval = dateRange === 'today' ? 'hour' : 'day';
      const { data: chartResponse, error: chartError } = await supabase.rpc('get_revenue_chart_data', {
        p_start_date: startDate + ' 00:00:00',
        p_end_date: endDate + ' 23:59:59',
        p_interval: interval
      });
      if (chartError) throw chartError;
      
      setChartData(chartResponse || []);
    } catch (error) {
      console.error('Analytics Error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!chartData.length) return toast.error('No data to export');
    const filename = `Revenue_Report_${startDate}_to_${endDate}`;
    
    // Map chart data for cleaner export
    const exportData = chartData.map(d => ({
      Date: d.period,
      Revenue: d.revenue,
      Orders: d.orders_count
    }));

    if (format === 'csv') exportToCSV(exportData, filename, 'revenue_overview', { startDate, endDate });
    if (format === 'xlsx') exportToExcel(exportData, filename, 'revenue_overview', { startDate, endDate });
    if (format === 'pdf') exportToPDF(exportData, filename, 'revenue_overview', { startDate, endDate });
    toast.success(`${format.toUpperCase()} exported successfully`);
  };

  if (isLoading && !stats) {
    return <div className="flex justify-center items-center h-64"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Intelligence</h1>
          <p className="text-sm text-gray-500">Real-time business performance metrics</p>
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
            <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 flex items-center gap-1">
              CSV
            </button>
            <button onClick={() => handleExport('xlsx')} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 flex items-center gap-1">
              Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 flex items-center gap-1">
              PDF
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Overview */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Total Revenue (Selected Period)</h3>
                <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="w-5 h-5 text-primary" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">৳ {stats.total_revenue?.toLocaleString() || 0}</p>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Retail: ৳ {stats.retail_revenue || 0}</span>
                <span>Wholesale: ৳ {stats.wholesale_revenue || 0}</span>
              </div>
            </div>

            {/* Orders Overview */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                <div className="p-2 bg-blue-100 rounded-lg"><ShoppingBag className="w-5 h-5 text-blue-600" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_orders || 0}</p>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className="text-green-600">Completed: {stats.completed_orders || 0}</span>
                <span className="text-yellow-600">Pending: {stats.pending_orders || 0}</span>
              </div>
            </div>

            {/* Users Overview */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">New Users</h3>
                <div className="p-2 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users || 0}</p>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Retail: {stats.retail_users || 0}</span>
                <span>Wholesale: {stats.wholesale_users || 0}</span>
              </div>
            </div>

            {/* Wallets Overview */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Wallet Deposits</h3>
                <div className="p-2 bg-orange-100 rounded-lg"><Wallet className="w-5 h-5 text-orange-600" /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">৳ {stats.total_deposits?.toLocaleString() || 0}</p>
              <div className="text-xs text-gray-500 mt-2">
                <span className="text-orange-600">Pending: ৳ {stats.pending_deposits || 0}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Trend Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-gray-900">Orders Volume</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [value, 'Orders']}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="orders_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
