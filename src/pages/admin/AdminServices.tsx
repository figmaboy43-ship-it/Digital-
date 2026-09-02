import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, service_categories(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchServices();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services Catalog</h1>
          <p className="text-slate-500 mt-1">Manage available digital services and pricing</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="h-32 bg-slate-100 flex items-center justify-center relative">
              {service.thumbnail_url ? (
                <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400">No Image</span>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm
                  ${service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider">
                {service.service_categories?.name || 'Uncategorized'}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{service.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                {service.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Retail</p>
                  <p className="text-sm font-bold text-slate-900">${service.retail_price}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Wholesale</p>
                  <p className="text-sm font-bold text-slate-900">${service.wholesale_price}</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4 mt-auto">
                <button 
                  onClick={() => toggleStatus(service.id, service.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    service.is_active 
                      ? 'text-amber-600 hover:bg-amber-50' 
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={service.is_active ? "Deactivate" : "Activate"}
                >
                  {service.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                </button>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
