import { ReactNode, useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown';
import { 
  MessageSquare, LayoutDashboard, 
  ShoppingBag, 
  List, 
  Wallet, 
  History, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  User, 
  Shield, 
  LogOut,
  Menu,
  X,
  Search,
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: ('retail' | 'wholesale')[];
}

const navItems: NavItem[] = [
  { name: 'ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard, roles: ['retail', 'wholesale'] },
  { name: 'সেবাসমূহ', href: '/dashboard/services', icon: ShoppingBag, roles: ['retail', 'wholesale'] },
  { name: 'আমার অর্ডার', href: '/dashboard/orders', icon: List, roles: ['retail', 'wholesale'] },
  { name: 'ওয়ালেট', href: '/dashboard/wallet', icon: Wallet, roles: ['retail', 'wholesale'] },
  { name: 'ডিপোজিট করুন', href: '/dashboard/deposit', icon: CreditCard, roles: ['retail', 'wholesale'] },
  { name: 'লেনদেনের হিসেব', href: '/dashboard/transactions', icon: History, roles: ['retail', 'wholesale'] },
  { name: 'সাপোর্ট চ্যাট', href: '/dashboard/messages', icon: MessageSquare, roles: ['retail', 'wholesale'] },
  { name: 'হোলসেল প্রোগ্রাম', href: '/dashboard/wholesale', icon: Briefcase, roles: ['retail', 'wholesale'] },
  { name: 'নোটিফিকেশন', href: '/dashboard/notifications', icon: Bell, roles: ['retail', 'wholesale'] },
  { name: 'সাপোর্ট সেন্টার', href: '/dashboard/support', icon: HelpCircle, roles: ['retail', 'wholesale'] },
  { name: 'প্রোফাইল', href: '/dashboard/profile', icon: User, roles: ['retail', 'wholesale'] },
  { name: 'নিরাপত্তা', href: '/dashboard/security', icon: Shield, roles: ['retail', 'wholesale'] },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { unreadCount, fetchUnreadCount, subscribeToMessages } = useChatStore();
  const { user, profile, isLoading, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      
      // Subscribe to wallet changes
      const subscription = supabase
        .channel('wallet_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchWalletBalance();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();
      
      if (!error && data) {
        setWalletBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchUnreadCount(user.id, profile.role);
      subscribeToMessages(user.id, profile.role);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('সফলভাবে লগআউট হয়েছে');
    } catch (error) {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const filteredNavItems = navItems.filter(item => item.roles.includes(profile.role as any));

  return (
    <div className="min-h-screen flex bg-background font-sans">
      {/* Mobile sidebar overlay */}
      <div 
        className={cn("fixed inset-0 z-40 bg-gray-900/50 transition-opacity lg:hidden", sidebarOpen ? "block" : "hidden")}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col shadow-sm",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b-2 border-primary bg-white">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="BD Gov Logo" className="w-8 h-8 opacity-90" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-primary leading-tight">ডিজিটাল সেবা</span>
              <span className="text-xs text-gray-500">পোর্টাল প্যানেল</span>
            </div>
          </Link>
          <button className="lg:hidden text-gray-500 hover:text-primary" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/dashboard');
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-sm transition-colors",
                    isActive 
                      ? "bg-primary text-white shadow-sm" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  )}
                >
                  <item.icon className={cn("mr-3 flex-shrink-0 h-5 w-5 transition-colors", isActive ? "text-white" : "text-gray-500 group-hover:text-primary")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            লগআউট করুন
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white border-b border-gray-200 h-20 z-30 sticky top-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="খুঁজুন..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-green-50 text-primary rounded-sm border border-primary/20">
              <Wallet className="w-4 h-4 mr-2" />
              <span className="font-bold text-sm">৳ {walletBalance.toFixed(2)}</span>
            </div>
            
            <NotificationDropdown />
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role === 'wholesale' ? 'হোলসেল পার্টনার' : 'নাগরিক'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer border-2 border-white outline outline-1 outline-primary/20">
                {profile.full_name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
