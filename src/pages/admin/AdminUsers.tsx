import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Shield, ShieldAlert, Check, X } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus} this user?`)) return;

    try {
      // Assuming RPC or direct update if allowed by RLS for admin
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`User account ${newStatus}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">Manage all retail and wholesale users</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.full_name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${user.role === 'admin' ? 'bg-slate-900 text-white' : ''}
                      ${user.role === 'wholesale' ? 'bg-purple-100 text-purple-700' : ''}
                      ${user.role === 'retail' ? 'bg-blue-100 text-blue-700' : ''}
                    `}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{user.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${user.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                    `}>
                      {user.account_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => toggleUserStatus(user.id, user.account_status)}
                        className={`text-sm font-medium transition-colors ${
                          user.account_status === 'active' 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        {user.account_status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
