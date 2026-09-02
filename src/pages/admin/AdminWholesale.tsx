import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWholesale() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('wholesale_applications')
        .select(`
          *,
          user:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const isApproving = newStatus === 'approved';
    if (!window.confirm(`Are you sure you want to ${isApproving ? 'approve' : 'reject'} this wholesale application?`)) return;

    try {
      const { error } = await supabase
        .from('wholesale_applications')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Application ${newStatus} successfully`);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update application');
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wholesale Applications</h1>
        <p className="text-slate-500 mt-1">Review and manage wholesale access requests</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Business Info</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No wholesale applications found.
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{app.user?.full_name || 'N/A'}</div>
                      <div className="text-slate-500 text-xs">{app.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{app.business_name}</div>
                      <div className="text-xs">Est. Vol: {app.estimated_monthly_volume}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${app.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                        ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${app.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(app.id, 'approved')}
                            className="inline-flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
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
