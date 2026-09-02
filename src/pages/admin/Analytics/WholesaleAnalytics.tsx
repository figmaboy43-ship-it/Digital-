import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { exportToCSV, exportToExcel, exportToPDF } from '../../../lib/exportUtils';
import { Users, ShoppingBag, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WholesaleAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWholesaleStats();
  }, []);

  const fetchWholesaleStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (error) throw error;
      setStats(data);
    } catch (err) {
      toast.error('Failed to load wholesale stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Wholesale Business Overview</h2>
          <p className="text-gray-500 text-sm">Aggregated B2B insights</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Wholesale Accounts</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.wholesale_users || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg"><ShoppingBag className="w-6 h-6 text-purple-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Applications</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.pending_wholesale_apps || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total B2B Revenue</p>
            <p className="text-3xl font-bold text-gray-900">৳ {stats?.wholesale_revenue?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
