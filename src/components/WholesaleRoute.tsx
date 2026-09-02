import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export default function WholesaleRoute() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Strict check: must be wholesale role AND approved
  if (!profile || profile.role !== 'wholesale' || profile.wholesale_status !== 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
