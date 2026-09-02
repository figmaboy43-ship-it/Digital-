import { Wallet, ShoppingBag, Clock, CheckCircle, TrendingUp, Award } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function WholesaleDashboard() {
  const { profile } = useAuthStore();
  
  const stats = [
    { name: 'Wholesale Balance', value: '৳5,200', icon: Wallet, color: 'text-primary', bg: 'bg-primary-light/20' },
    { name: 'Total Orders', value: '145', icon: ShoppingBag, color: 'text-gray-600', bg: 'bg-gray-100' },
    { name: 'Pending Orders', value: '5', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Completed Orders', value: '138', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Monthly Spending', value: '৳12,500', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wholesale Dashboard</h1>
        <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
          <Award className="h-5 w-5 text-yellow-500 mr-2" />
          <span className="text-sm font-medium text-yellow-800">Gold Tier Partner</span>
        </div>
      </div>
      
      {profile?.wholesale_status === 'pending' || profile?.wholesale_status === 'under_review' ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your wholesale application is currently <strong>{profile.wholesale_status.replace('_', ' ')}</strong>. You will gain access to wholesale features once approved.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-bold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Rest of wholesale dashboard similar to retail but with bulk options */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 p-6 flex flex-col justify-center items-center text-center min-h-[300px]">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Ready for bulk orders?</h3>
        <p className="mt-1 text-sm text-gray-500">Access exclusive wholesale services and pricing.</p>
        <div className="mt-6 flex space-x-4">
          <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark">
            Browse Wholesale Services
          </button>
        </div>
      </div>
    </div>
  );
}
