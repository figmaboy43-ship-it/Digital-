import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  PackageSearch, 
  ShoppingBag, 
  Wallet, 
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  Bell,
  ArrowLeft,
  LifeBuoy,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export function WholesaleLayout() {
  const { unreadCount, fetchUnreadCount, subscribeToMessages } = useChatStore();
  const { user } = useAuthStore();

  const { profile, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'ড্যাশবোর্ড', href: '/wholesale', icon: LayoutDashboard },
    { name: 'হোলসেল সেবাসমূহ', href: '/wholesale/services', icon: PackageSearch },
    { name: 'আমার অর্ডার', href: '/wholesale/orders', icon: ShoppingBag },
    { name: 'ওয়ালেট', href: '/wholesale/wallet', icon: Wallet },
    { name: 'ডিপোজিট', href: '/wholesale/deposit', icon: ArrowUpRight },
    { name: 'সাপোর্ট সেন্টার', href: '/wholesale/support', icon: LifeBuoy },
    { name: 'সরাসরি চ্যাট', href: '/wholesale/messages', icon: MessageSquare },
  ];

  React.useEffect(() => {
    if (user && profile) {
      fetchUnreadCount(user.id, profile.role);
      subscribeToMessages(user.id, profile.role);
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  const isActive = (path: string) => {
    if (path === '/wholesale' && location.pathname !== '/wholesale') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 bg-gray-950 border-b-4 border-primary">
            <Link to="/wholesale" className="flex items-center space-x-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="BD Gov Logo" className="w-8 h-8 opacity-90" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight leading-tight">ডিজিটাল সেবা</span>
                <span className="text-xs text-primary">হোলসেল পোর্টাল</span>
              </div>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/30">
                {profile?.full_name?.charAt(0) || 'W'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <p className="text-xs text-gray-400">অনুমোদিত পার্টনার</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-sm transition-all
                    ${active 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 mr-3 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  {item.name}
                  {item.name === 'সরাসরি চ্যাট' && unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <Link 
              to="/dashboard"
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-300 rounded-sm hover:bg-gray-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-3 text-gray-400" />
              নাগরিক পোর্টালে ফেরত যান
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gov-red rounded-sm hover:bg-gov-red/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              লগআউট করুন
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
