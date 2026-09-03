cat << 'INNER_EOF' > src/pages/admin/AdminServices.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Power, PowerOff, X, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Category Form
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '' });
  
  // Service Form
  const [srvForm, setSrvForm] = useState({
    name: '', slug: '', category_id: '', description: '',
    retail_price: '', wholesale_price: '', processing_time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [srvRes, catRes] = await Promise.all([
        supabase.from('services').select('*, service_categories(name)').order('created_at', { ascending: false }),
        supabase.from('service_categories').select('*').order('name', { ascending: true })
      ]);

      if (srvRes.error) throw srvRes.error;
      if (catRes.error) throw catRes.error;

      setServices(srvRes.data || []);
      setCategories(catRes.data || []);
    } catch (error: any) {
      toast.error('ডেটা লোড করতে সমস্যা হয়েছে');
      console.error(error);
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
      toast.success(currentStatus ? 'সেবাটি নিষ্ক্রিয় করা হয়েছে' : 'সেবাটি সক্রিয় করা হয়েছে');
      fetchData();
    } catch (error) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('service_categories').insert([
        { 
          name: catForm.name, 
          slug: catForm.slug, 
          description: catForm.description 
        }
      ]);
      if (error) throw error;
      toast.success('নতুন ক্যাটাগরি যুক্ত হয়েছে');
      setIsCategoryModalOpen(false);
      setCatForm({ name: '', slug: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'ক্যাটাগরি যুক্ত করতে ব্যর্থ');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('services').insert([
        {
          name: srvForm.name,
          slug: srvForm.slug,
          category_id: srvForm.category_id || null,
          description: srvForm.description,
          retail_price: Number(srvForm.retail_price) || 0,
          wholesale_price: Number(srvForm.wholesale_price) || 0,
          processing_time: srvForm.processing_time
        }
      ]);
      if (error) throw error;
      toast.success('নতুন সেবা যুক্ত হয়েছে');
      setIsServiceModalOpen(false);
      setSrvForm({ name: '', slug: '', category_id: '', description: '', retail_price: '', wholesale_price: '', processing_time: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'সেবা যুক্ত করতে ব্যর্থ');
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-gray-500">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">সেবা তালিকা</h1>
          <p className="text-gray-600 mt-1">সব ধরনের সেবা এবং ক্যাটাগরি ম্যানেজমেন্ট</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="gov-button-outline flex items-center"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            নতুন ক্যাটাগরি
          </button>
          <button 
            onClick={() => setIsServiceModalOpen(true)}
            className="gov-button flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            নতুন সেবা
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="gov-card flex flex-col">
            <div className="h-32 bg-gray-100 flex items-center justify-center relative border-b border-gray-200">
              {service.thumbnail_url ? (
                <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">ছবি নেই</span>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-sm shadow-sm
                  ${service.is_active ? 'bg-green-100 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                  {service.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                {service.service_categories?.name || 'কোনো ক্যাটাগরি নেই'}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                {service.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-gray-50 rounded-sm border border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 font-medium">রিটেইল মূল্য</p>
                  <p className="text-sm font-bold text-gray-900">৳{service.retail_price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">হোলসেল মূল্য</p>
                  <p className="text-sm font-bold text-gray-900">৳{service.wholesale_price}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-2 border-t border-gray-200 pt-4 mt-auto">
                <button 
                  onClick={() => toggleStatus(service.id, service.is_active)}
                  className={`p-2 rounded-sm transition-colors ${
                    service.is_active 
                      ? 'text-amber-600 hover:bg-amber-50' 
                      : 'text-primary hover:bg-green-50'
                  }`}
                  title={service.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                >
                  {service.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="col-span-full text-center p-12 bg-white rounded-sm border border-gray-200">
            <p className="text-gray-500">কোনো সেবা পাওয়া যায়নি। নতুন সেবা যুক্ত করুন।</p>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-md shadow-xl border-t-4 border-t-primary">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">নতুন ক্যাটাগরি</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরির নাম *</label>
                <input required type="text" className="gov-input w-full" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">স্লাগ (URL) *</label>
                <input required type="text" className="gov-input w-full" placeholder="ex: nid-service" value={catForm.slug} onChange={e => setCatForm({...catForm, slug: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
                <textarea className="gov-input w-full" rows={3} value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="gov-button-outline">বাতিল</button>
                <button type="submit" className="gov-button">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border-t-4 border-t-primary">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">নতুন সেবা</h2>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সেবার নাম *</label>
                  <input required type="text" className="gov-input w-full" value={srvForm.name} onChange={e => setSrvForm({...srvForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">স্লাগ (URL) *</label>
                  <input required type="text" className="gov-input w-full" placeholder="ex: new-voter" value={srvForm.slug} onChange={e => setSrvForm({...srvForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
                  <select className="gov-input w-full" value={srvForm.category_id} onChange={e => setSrvForm({...srvForm, category_id: e.target.value})}>
                    <option value="">-- নির্বাচন করুন --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রসেসিং সময়</label>
                  <input type="text" className="gov-input w-full" placeholder="ex: 2-3 Days" value={srvForm.processing_time} onChange={e => setSrvForm({...srvForm, processing_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রিটেইল মূল্য (৳) *</label>
                  <input required type="number" min="0" className="gov-input w-full" value={srvForm.retail_price} onChange={e => setSrvForm({...srvForm, retail_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">হোলসেল মূল্য (৳) *</label>
                  <input required type="number" min="0" className="gov-input w-full" value={srvForm.wholesale_price} onChange={e => setSrvForm({...srvForm, wholesale_price: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
                <textarea className="gov-input w-full" rows={3} value={srvForm.description} onChange={e => setSrvForm({...srvForm, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="gov-button-outline">বাতিল</button>
                <button type="submit" className="gov-button">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
INNER_EOF
sh update_admin_services.sh