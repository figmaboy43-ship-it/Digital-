import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../lib/exportUtils';
import { Search, ArrowUpDown, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceAnalytics() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('total_orders');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetchServiceAnalytics();
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

  const fetchServiceAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_service_analytics', {
        p_start_date: startDate + ' 00:00:00',
        p_end_date: endDate + ' 23:59:59'
      });
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Service Analytics Error:', error);
      toast.error('Failed to load service analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const filteredAndSortedServices = services
    .filter(s => s.service_name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.category_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!filteredAndSortedServices.length) return toast.error('No data to export');
    const filename = `Service_Analytics_${startDate}_to_${endDate}`;
    
    const exportData = filteredAndSortedServices.map(s => ({
      'Service Name': s.service_name,
      'Category': s.category_name || 'Uncategorized',
      'Total Orders': s.total_orders,
      'Completed': s.completed_orders,
      'Pending': s.pending_orders,
      'Revenue (৳)': s.revenue,
      'Completion Rate (%)': s.completion_rate,
      'Avg Order Value (৳)': s.avg_order_value
    }));

    if (format === 'csv') exportToCSV(exportData, filename, 'service_analytics', { startDate, endDate });
    if (format === 'xlsx') exportToExcel(exportData, filename, 'service_analytics', { startDate, endDate });
    if (format === 'pdf') exportToPDF(exportData, filename, 'service_analytics', { startDate, endDate });
    toast.success(`${format.toUpperCase()} exported successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search services or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('service_name')}>
                  <div className="flex items-center gap-1">Service <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('category_name')}>
                  <div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_orders')}>
                  <div className="flex items-center justify-end gap-1">Total Orders <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('completed_orders')}>
                  <div className="flex items-center justify-end gap-1">Completed <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('revenue')}>
                  <div className="flex items-center justify-end gap-1">Revenue (৳) <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('completion_rate')}>
                  <div className="flex items-center justify-end gap-1">Completion Rate <ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center mb-2"><span className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent"></span></div>
                    Loading service analytics...
                  </td>
                </tr>
              ) : filteredAndSortedServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No service data found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredAndSortedServices.map((service, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.service_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.category_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {service.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      <span className="text-green-600">{service.completed_orders}</span>
                      <span className="text-gray-300 mx-1">|</span>
                      <span className="text-yellow-600">{service.pending_orders}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ৳ {service.revenue?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${service.completion_rate >= 80 ? 'bg-green-500' : service.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${service.completion_rate}%` }}></div>
                        </div>
                        <span className="w-8">{service.completion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
