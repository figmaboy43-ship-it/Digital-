import { useAuthStore } from '../../store/authStore';
import { RetailDashboard } from './RetailDashboard';
import { WholesaleDashboard } from './WholesaleDashboard';
import { AdminDashboard } from './AdminDashboard';

export function Dashboard() {
  const { profile } = useAuthStore();

  if (!profile) return null;

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'wholesale':
      return <WholesaleDashboard />;
    case 'retail':
    default:
      return <RetailDashboard />;
  }
}
