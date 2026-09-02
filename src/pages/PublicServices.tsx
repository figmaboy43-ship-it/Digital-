import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, ArrowRight, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function PublicServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { profile } = useAuthStore();
  const isWholesale = profile?.role === 'wholesale' && profile?.wholesale_status === 'approved';

  useEffect(() => {
    async function fetchServices() {
      try {
        const [{ data: svcs }, { data: cats }] = await Promise.all([
          supabase.from('services').select('*, service_categories(name)'),
          supabase.from('service_categories').select('*')
        ]);
        if (svcs) setServices(svcs);
        if (cats) setCategories(cats);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, []);

  const filteredServices = services.filter(s => {
    const matchesCategory = activeCategory === 'all' || s.category_id === activeCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="bg-primary text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-4">সকল সেবাসমূহ</h1>
          <p className="text-primary-light max-w-2xl mx-auto">নাগরিক এবং ব্যবসায়িক সকল গুরুত্বপূর্ণ সেবাসমূহের তালিকা</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-1/3 relative">
            <input 
              type="text" 
              placeholder="সেবা খুঁজুন..." 
              className="gov-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <div className="w-full md:w-2/3 flex overflow-x-auto pb-2 no-scrollbar gap-2">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              সকল সেবা
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <div key={service.id} className="gov-card flex flex-col h-full hover:border-primary transition-colors group">
                <div className="p-6 flex-grow">
                  <div className="flex items-start mb-4">
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-100 mr-4 group-hover:bg-primary transition-colors">
                      <FileText className="w-6 h-6 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{service.name}</h3>
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-sm mt-1 inline-block">
                        {service.service_categories?.name || 'সাধারণ'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">{service.description}</p>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-500">সার্ভিস চার্জ:</span>
                      <span className="font-bold text-gray-900">৳ {isWholesale ? service.wholesale_price : service.retail_price}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-gray-500">প্রসেসিং সময়:</span>
                      <span className="text-gray-900">{service.processing_time || 'সাধারণ'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <Link to="/dashboard/services" className="w-full gov-button-outline flex items-center justify-center">
                    বিস্তারিত ও আবেদন <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
