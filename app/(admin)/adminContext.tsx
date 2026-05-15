"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/authcontext';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from '../components/layout/skeletonDash';

interface AdminContextType {
  isAdmin: boolean;
  adminLogout: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { profile, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const adminLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    if (loading) return;
    
    // Not logged in
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin/view');
      return;
    }
    
    // Logged in but not super_admin
    if (profile?.role !== 'super_admin') {
      router.push('/');
      return;
    }
    
    // Is super_admin
    setIsAdmin(true);
  }, [isAuthenticated, profile, loading, router]);

  // Still loading - show skeleton
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Not admin - don't render (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <AdminContext.Provider value={{ isAdmin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}