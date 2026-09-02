import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, DollarSign, Wallet } from 'lucide-react';

export default function AnalyticsLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard Overview', path: '/admin/analytics', icon: LayoutDashboard, exact: true },
    { name: 'Service Performance', path: '/admin/analytics/services', icon: ShoppingBag },
    { name: 'Wholesale Analytics', path: '/admin/analytics/wholesale', icon: Users },
    { name: 'Payments & Wallets', path: '/admin/analytics/payments', icon: Wallet },
    { name: 'User Reports', path: '/admin/analytics/users', icon: Users }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </div>
      
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
