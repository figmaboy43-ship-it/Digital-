import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, FileText, Bell, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function Home() {
  const { user, profile } = useAuthStore();
  const isApprovedWholesale = profile?.role === 'wholesale' && profile?.wholesale_status === 'approved';
  
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroStats, setHeroStats] = useState([
    { id: 1, label: 'মোট সেবা প্রদান', value: '২,৮৪৫+' },
    { id: 2, label: 'নিবন্ধিত গ্রাহক', value: '১,২৫০+' },
    { id: 3, label: 'হোলসেল পার্টনার', value: '৩৪০+' },
    { id: 4, label: 'সক্রিয় সেবাসমূহ', value: '১০৫+' }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch published/active services (assuming we just fetch all for now)
        const { data: svcData } = await supabase
          .from('services')
          .select('*, service_categories(name)')
          .limit(6);
          
        if (svcData) setServices(svcData);

        const { data: catData } = await supabase
          .from('service_categories')
          .select('*');
          
        if (catData) setCategories(catData);
        
        const { data: statsData } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_stats')
          .single();
          
        if (statsData && statsData.value) {
          setHeroStats(statsData.value);
        }
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Official Government Hero */}
      <div className="bg-white border-b border-gray-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="BD Gov Logo" className="w-20 h-20 mb-6 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">ডিজিটাল সেবা পোর্টাল</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            নাগরিক ও ব্যবসায়িক সকল গুরুত্বপূর্ণ অনলাইন সেবাসমূহ এক ঠিকানায়। দ্রুত, নিরাপদ এবং নির্ভরযোগ্য সেবা প্রদানের নিশ্চয়তা।
          </p>
          
          <div className="w-full max-w-2xl relative">
            <input 
              type="text" 
              placeholder="আপনার কাঙ্ক্ষিত সেবাটি খুঁজুন (যেমন: জন্ম নিবন্ধন, টিন সার্টিফিকেট)..." 
              className="w-full pl-5 pr-14 py-4 border-2 border-primary rounded-sm shadow-sm focus:outline-none focus:ring-0 focus:border-primary-dark text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary-dark text-white px-4 rounded-sm flex items-center justify-center transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          {/* Service Analysis / Stats */}
          <div className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroStats.map(stat => (
              <div key={stat.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-sm border border-gray-100 shadow-sm text-center transform transition-transform hover:-translate-y-1">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content Area - Services */}
        <div className="lg:col-span-3 space-y-8">
          
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6">
            <h2 className="text-xl font-bold text-primary mb-6 border-b-2 border-primary pb-2 inline-block">জনপ্রিয় সেবাসমূহ</h2>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-gray-200 p-4 rounded-sm hover:border-primary hover:shadow-md transition-all flex items-start group">
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-100 mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6 text-primary group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-primary">৳ {isApprovedWholesale ? service.wholesale_price : service.retail_price}</span>
                        <Link to={`/dashboard/services`} className="text-sm text-primary font-medium flex items-center hover:underline">
                          আবেদন করুন <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Link to="/dashboard/services" className="gov-button-outline inline-flex items-center">
                সকল সেবা দেখুন <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
          
          {/* Wholesale Info Block */}
          {!isApprovedWholesale && (
            <div className="bg-white border-l-4 border-primary border-t border-r border-b border-gray-200 rounded-sm p-6 flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">উদ্যোক্তাদের জন্য বিশেষ হোলসেল প্রোগ্রাম</h3>
                <p className="text-sm text-gray-600">আপনার সাইবার ক্যাফে বা ডিজিটাল সেন্টারের জন্য আকর্ষণীয় কমিশনে আমাদের সেবাগুলো গ্রহণ করুন।</p>
              </div>
              <Link to="/wholesale-program" className="gov-button mt-4 md:mt-0 whitespace-nowrap">
                নিবন্ধন করুন
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Notice Board */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-primary text-white p-3 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              <h3 className="font-semibold">নোটিশ বোর্ড</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-xs text-gov-red font-medium mb-1 block flex items-center"><Clock className="w-3 h-3 mr-1" /> ১০ সেপ্টেম্বর, ২০২৬</span>
                <a href="#" className="text-sm font-medium text-gray-800 hover:text-primary">সার্ভার রক্ষণাবেক্ষণের জন্য সাময়িক বিঘ্ন ঘটতে পারে</a>
              </div>
              <div className="border-b border-gray-100 pb-3">
                <span className="text-xs text-gray-500 font-medium mb-1 block flex items-center"><Clock className="w-3 h-3 mr-1" /> ০৫ সেপ্টেম্বর, ২০২৬</span>
                <a href="#" className="text-sm font-medium text-gray-800 hover:text-primary">জন্ম নিবন্ধন সংশোধনের নতুন নিয়মাবলী</a>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium mb-1 block flex items-center"><Clock className="w-3 h-3 mr-1" /> ০১ সেপ্টেম্বর, ২০২৬</span>
                <a href="#" className="text-sm font-medium text-gray-800 hover:text-primary">নতুন পেমেন্ট গেটওয়ে সংযুক্ত করা হয়েছে</a>
              </div>
              <a href="#" className="text-xs text-primary font-medium hover:underline block pt-2 text-right">সকল নোটিশ</a>
            </div>
          </div>

          {/* Quick Stats/Info */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">আমাদের বৈশিষ্ট্য</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">২৪/৭ অনলাইন সাপোর্ট ও হেল্পডেস্ক</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">নিরাপদ এবং ভেরিফাইড পেমেন্ট ব্যবস্থা</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-primary mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">উদ্যোক্তাদের জন্য হোলসেল সুবিধা</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
