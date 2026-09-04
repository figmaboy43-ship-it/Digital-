import { ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, Globe, HelpCircle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const { user, profile } = useAuthStore();
  const [footerSettings, setFooterSettings] = useState({
    siteName: 'ডিজিটাল সেবা পোর্টাল',
    description: 'এটি একটি ডেমো ডিজিটাল সেবা প্রদানকারী পোর্টাল। এখানে আপনি বিভিন্ন অনলাইন সেবা সহজে এবং নিরাপদে গ্রহণ করতে পারবেন।',
    phone: '+880 1234 567890',
    email: 'support@digitalseba.com',
    workingHours: 'রবি-বৃহস্পতি, সকাল ৯টা - বিকাল ৫টা',
    copyright: 'ডিজিটাল সেবা পোর্টাল। সর্বস্বত্ব সংরক্ষিত।'
  });

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer_content')
        .single();
        
      if (!error && data && data.value) {
        setFooterSettings(prev => ({ ...prev, ...data.value }));
      }
    } catch (error) {
      console.error('Failed to load footer settings:', error);
    }
  };

  const toggleLang = () => setLang(lang === 'bn' ? 'en' : 'bn');

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      
      {/* Top Government Strip */}
      <div className="bg-primary text-white py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium hidden sm:inline">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
            <span className="font-medium sm:hidden">বাংলাদেশ সরকার</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleLang} className="flex items-center hover:text-gray-200 transition-colors">
              <Globe className="w-3 h-3 mr-1" />
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
            <a href="#" className="hidden sm:flex items-center hover:text-gray-200 transition-colors">
              <HelpCircle className="w-3 h-3 mr-1" />
              {lang === 'bn' ? 'হেল্প' : 'Help'}
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex flex-col">
                <span className="text-2xl font-bold text-primary leading-tight">{footerSettings.siteName}</span>
                <span className="text-sm text-gray-500 font-medium hidden sm:block">নিরাপদ ও সহজে অনলাইন সেবা গ্রহণ করুন</span>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden sm:flex sm:items-center sm:space-x-6">
              <Link to="/" className="text-gray-700 hover:text-primary px-2 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors">{lang === 'bn' ? 'হোম' : 'Home'}</Link>
              <Link to="/services" className="text-gray-700 hover:text-primary px-2 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors">{lang === 'bn' ? 'সেবাসমূহ' : 'Services'}</Link>
              <Link to="/pricing" className="text-gray-700 hover:text-primary px-2 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors">{lang === 'bn' ? 'ফি/চার্জ' : 'Charges'}</Link>
              <Link to="/wholesale-program" className="text-gray-700 hover:text-primary px-2 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors">{lang === 'bn' ? 'হোলসেল' : 'Wholesale'}</Link>
              
              {user ? (
                <Link to="/dashboard" className="gov-button ml-4">
                  {lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
                </Link>
              ) : (
                <div className="flex items-center space-x-2 ml-4">
                  <Link to="/login" className="text-gray-700 hover:text-primary flex items-center px-3 py-2 text-sm font-medium transition-colors">
                    <LogIn className="h-4 w-4 mr-1" /> {lang === 'bn' ? 'লগইন' : 'Login'}
                  </Link>
                  <Link to="/register" className="gov-button flex items-center">
                    <UserPlus className="h-4 w-4 mr-1" /> {lang === 'bn' ? 'নিবন্ধন' : 'Register'}
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-sm text-gray-600 hover:text-primary hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-200 shadow-md absolute w-full">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">{lang === 'bn' ? 'হোম' : 'Home'}</Link>
              <Link to="/services" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">{lang === 'bn' ? 'সেবাসমূহ' : 'Services'}</Link>
              <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">{lang === 'bn' ? 'ফি/চার্জ' : 'Charges'}</Link>
              <Link to="/wholesale-program" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">{lang === 'bn' ? 'হোলসেল' : 'Wholesale'}</Link>
              
              <div className="border-t border-gray-100 my-2"></div>
              {user ? (
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-primary hover:bg-gray-50">{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">লগইন</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-primary hover:bg-gray-50">নিবন্ধন</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Official Style Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-primary mb-4">{footerSettings.siteName}</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md">
                {footerSettings.description}
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary"><ShieldAlert className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">প্রয়োজনীয় লিংক</h4>
              <ul className="space-y-2">
                <li><Link to="/services" className="text-sm text-gray-600 hover:text-primary">সেবাসমূহ</Link></li>
                <li><Link to="/pricing" className="text-sm text-gray-600 hover:text-primary">ফি/চার্জ</Link></li>
                <li><Link to="/wholesale-program" className="text-sm text-gray-600 hover:text-primary">হোলসেল প্রোগ্রাম</Link></li>
                <li><Link to="/support" className="text-sm text-gray-600 hover:text-primary">সাপোর্ট সেন্টার</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">যোগাযোগ</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>ফোন: {footerSettings.phone}</li>
                <li>ইমেইল: {footerSettings.email}</li>
                <li>সময়: {footerSettings.workingHours}</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} {footerSettings.copyright}</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary">শর্তাবলী</a>
              <a href="#" className="hover:text-primary">গোপনীয়তা নীতি</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
