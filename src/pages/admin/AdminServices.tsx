import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DynamicIcon } from '../../components/DynamicIcon';
import { Plus, Edit2, Trash2, Power, PowerOff, X, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminServices() {
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Category Form
  const [catForm, setCatForm] = useState({ id: '', name: '', slug: '', description: '' });
  
  // Service Form
  const [srvForm, setSrvForm] = useState({
    id: '', name: '', slug: '', category_id: '', description: '',
    retail_price: '', wholesale_price: '', processing_time: '', icon: ''
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

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
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

  const toggleCategoryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(currentStatus ? 'ক্যাটাগরি নিষ্ক্রিয় করা হয়েছে' : 'ক্যাটাগরি সক্রিয় করা হয়েছে');
      fetchData();
    } catch (error) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('service_categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('ক্যাটাগরি মুছে ফেলা হয়েছে');
      fetchData();
    } catch (error: any) {
      toast.error('ক্যাটাগরি মুছতে ব্যর্থ হয়েছে। সম্ভবত এই ক্যাটাগরিতে সেবা যুক্ত আছে।');
    }
  };

  const deleteService = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই সেবাটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast.success('সেবা মুছে ফেলা হয়েছে');
      fetchData();
    } catch (error: any) {
      toast.error('সেবা মুছতে ব্যর্থ হয়েছে');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (catForm.id) {
        const { error } = await supabase.from('service_categories')
          .update({ name: catForm.name, slug: catForm.slug, description: catForm.description })
          .eq('id', catForm.id);
        if (error) throw error;
        toast.success('ক্যাটাগরি আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('service_categories').insert([
          { name: catForm.name, slug: catForm.slug, description: catForm.description }
        ]);
        if (error) throw error;
        toast.success('নতুন ক্যাটাগরি যুক্ত হয়েছে');
      }
      setIsCategoryModalOpen(false);
      setCatForm({ id: '', name: '', slug: '', description: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'ক্যাটাগরি সংরক্ষণ ব্যর্থ');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        name: srvForm.name,
        slug: srvForm.slug,
        category_id: srvForm.category_id || null,
        description: srvForm.description,
        retail_price: Number(srvForm.retail_price) || 0,
        wholesale_price: Number(srvForm.wholesale_price) || 0,
        processing_time: srvForm.processing_time, icon: srvForm.icon
      };

      if (srvForm.id) {
        const { error } = await supabase.from('services').update(dataToSave).eq('id', srvForm.id);
        if (error) throw error;
        toast.success('সেবা আপডেট হয়েছে');
      } else {
        const { error } = await supabase.from('services').insert([dataToSave]);
        if (error) throw error;
        toast.success('নতুন সেবা যুক্ত হয়েছে');
      }
      setIsServiceModalOpen(false);
      setSrvForm({ id: '', name: '', slug: '', category_id: '', description: '', retail_price: '', wholesale_price: '', processing_time: '', icon: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'সেবা সংরক্ষণ ব্যর্থ');
    }
  };

  const editCategory = (cat: any) => {
    setCatForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || '' });
    setIsCategoryModalOpen(true);
  };

  const editService = (srv: any) => {
    setSrvForm({
      id: srv.id,
      name: srv.name,
      slug: srv.slug,
      category_id: srv.category_id || '',
      description: srv.description || '',
      retail_price: srv.retail_price.toString(),
      wholesale_price: srv.wholesale_price.toString(),
      processing_time: srv.processing_time || '', icon: srv.icon || ''
    });
    setIsServiceModalOpen(true);
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">সেবা তালিকা ও ক্যাটাগরি</h1>
          <p className="text-slate-500 mt-1">সব ধরনের সেবা এবং ক্যাটাগরি ম্যানেজমেন্ট</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setCatForm({ id: '', name: '', slug: '', description: '' }); setIsCategoryModalOpen(true); }}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            নতুন ক্যাটাগরি
          </button>
          <button 
            onClick={() => { setSrvForm({ id: '', name: '', slug: '', category_id: '', description: '', retail_price: '', wholesale_price: '', processing_time: '', icon: '' }); setIsServiceModalOpen(true); }}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            নতুন সেবা
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            সেবা তালিকা
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            ক্যাটাগরি তালিকা
          </button>
        </nav>
      </div>

      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                {service.thumbnail_url ? (
                  <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400">ছবি নেই</span>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm
                    ${service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {service.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider">
                  {service.service_categories?.name || 'Uncategorized'}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">{service.icon && <DynamicIcon name={service.icon} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}<span>{service.name}</span></h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                  {service.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Retail</p>
                    <p className="text-sm font-bold text-slate-900">৳{service.retail_price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Wholesale</p>
                    <p className="text-sm font-bold text-slate-900">৳{service.wholesale_price}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4 mt-auto">
                  <button 
                    onClick={() => toggleServiceStatus(service.id, service.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      service.is_active 
                        ? 'text-amber-600 hover:bg-amber-50' 
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={service.is_active ? "Deactivate" : "Activate"}
                  >
                    {service.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                  </button>
                  <button onClick={() => editService(service)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteService(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">কোনো সেবা পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm
                  ${cat.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {cat.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-2"><span className="font-medium">URL Slug:</span> {cat.slug}</p>
              <p className="text-sm text-slate-600 flex-1 mb-4">{cat.description || 'কোনো বিবরণ নেই'}</p>
              
              <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4 mt-auto">
                <button 
                  onClick={() => toggleCategoryStatus(cat.id, cat.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    cat.is_active 
                      ? 'text-amber-600 hover:bg-amber-50' 
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={cat.is_active ? "Deactivate" : "Activate"}
                >
                  {cat.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                </button>
                <button onClick={() => editCategory(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">কোনো ক্যাটাগরি পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{catForm.id ? 'ক্যাটাগরি আপডেট করুন' : 'নতুন ক্যাটাগরি'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরির নাম *</label>
                <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">স্লাগ (URL) *</label>
                <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="ex: nid-service" value={catForm.slug} onChange={e => setCatForm({...catForm, slug: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বিবরণ</label>
                <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none" rows={3} value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-900">{srvForm.id ? 'সেবা আপডেট করুন' : 'নতুন সেবা'}</h2>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">সেবার নাম *</label>
                  <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" value={srvForm.name} onChange={e => setSrvForm({...srvForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">স্লাগ (URL) *</label>
                  <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="ex: new-voter" value={srvForm.slug} onChange={e => setSrvForm({...srvForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white" value={srvForm.category_id} onChange={e => setSrvForm({...srvForm, category_id: e.target.value})}>
                    <option value="">-- নির্বাচন করুন --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">আইকন (Icon Name)</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="ex: FileText" value={srvForm.icon || ''} onChange={e => setSrvForm({...srvForm, icon: e.target.value})} />
                </div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">প্রসেসিং সময়</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="ex: 2-3 Days" value={srvForm.processing_time} onChange={e => setSrvForm({...srvForm, processing_time: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">রিটেইল মূল্য (৳) *</label>
                  <input required type="number" min="0" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" value={srvForm.retail_price} onChange={e => setSrvForm({...srvForm, retail_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">হোলসেল মূল্য (৳) *</label>
                  <input required type="number" min="0" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" value={srvForm.wholesale_price} onChange={e => setSrvForm({...srvForm, wholesale_price: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বিবরণ</label>
                <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none" rows={3} value={srvForm.description} onChange={e => setSrvForm({...srvForm, description: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
