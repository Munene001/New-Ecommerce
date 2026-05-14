"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/authcontext';
import { useRouter } from 'next/navigation';

interface AdminContextType {
  // Nothing complex yet - just basic admin info
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { profile, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Still loading
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not admin - don't render (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <AdminContext.Provider value={{ isAdmin }}>
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