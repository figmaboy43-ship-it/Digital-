import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { Clock, Search, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ServicesList() {
  const { profile } = useAuthStore();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, service_categories(name, slug)')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isWholesale = profile?.role === 'wholesale' && profile?.wholesale_status === 'approved';

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-white rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Available Services</h1>
        <p className="text-slate-500 mt-1">Select a service to place a new order</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search services..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div key={service.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
            <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
              {service.thumbnail_url ? (
                <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image</span>
                </div>
              )}
              <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-slate-700 shadow-sm border border-white/20">
                {service.service_categories?.name}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{service.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                {service.description}
              </p>
              
              <div className="flex flex-col gap-3 mb-5 p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-600">
                    <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                    <span>{service.processing_time_hours}h Avg.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Retail</span>
                    <span className={`text-lg font-bold ${isWholesale ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                      ৳{service.retail_price}
                    </span>
                  </div>
                </div>

                {isWholesale && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                    <div className="flex items-center text-purple-600 font-medium">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Wholesale Active
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-purple-600/70 block font-medium uppercase tracking-wider">Your Price</span>
                      <span className="text-xl font-bold text-purple-700">
                        ৳{service.wholesale_price}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <Link 
                to={`/dashboard/services/${service.slug}`} 
                className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors mt-auto shadow-sm"
              >
                Order Now
                <ChevronRight className="w-4 h-4 ml-1.5 opacity-70" />
              </Link>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-semibold">No services found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
