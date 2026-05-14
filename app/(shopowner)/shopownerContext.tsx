"use client";
import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/authcontext';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from '../components/layout/skeletonDash';

interface ShopData {
  shopId: number;
  shopType: string;
  shopSlug: string;
}

const ShopContext = createContext<ShopData | null>(null);

export function ShopProvider({ 
  children, 
  shopSlug 
}: { 
  children: React.ReactNode;
  shopSlug: string;
}) {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();
  const router = useRouter();

  // Single fetch function to avoid code duplication
  const fetchShopData = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}`);
      
      if (!res.ok) {
        throw new Error('Shop not found');
      }
      
      const data = await res.json();
      
      // Check if user owns this shop OR is super_admin
      const isOwner = data.isOwner;
      const isSuperAdmin = profile?.role === 'super_admin';
      
      if (!isOwner && !isSuperAdmin) {
        console.log('User does not own this shop and is not super_admin, redirecting...');
        if (profile?.shopSlug) {
          router.replace(`/dashboard/${profile.shopSlug}`);
        } else {
          router.replace('/profile');
        }
        return;
      }
      
      // Allow access - either owner or super_admin
      setShopData({
        shopId: data.shopId,
        shopType: data.shopType,
        shopSlug: shopSlug
      });
    } catch (error) {
      console.error("Failed to fetch shop:", error);
      setShopData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth to load
    if (isAuthenticated === undefined) return;
    
    // Mark as initialized after first auth check
    if (!initialized) {
      setInitialized(true);
    }

    // If already on dashboard
    const currentPath = window.location.pathname;
    if (currentPath.includes('/dashboard')) {
      const isSuperAdmin = profile?.role === 'super_admin';
      const isShopOwner = profile?.role === 'shop_owner';
      
      if (!shopData && shopSlug && isAuthenticated && (isShopOwner || isSuperAdmin)) {
        fetchShopData();
      } else {
        setLoading(false);
      }
      return;
    }

    // Not logged in – redirect to login
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // If profile is not loaded yet, wait
    if (!profile) {
      return;
    }

    // Check if user is shop owner or super_admin
    const isShopOwner = profile.role === 'shop_owner';
    const isSuperAdmin = profile.role === 'super_admin';
    
    if (!isShopOwner && !isSuperAdmin) {
      // Regular customer trying to access dashboard - redirect to shop
      router.push(`/${shopSlug}`);
      return;
    }

    // If no shopSlug, show error
    if (!shopSlug) {
      setLoading(false);
      return;
    }

    // Fetch shop data with ownership verification
    fetchShopData();
  }, [shopSlug, isAuthenticated, profile, router, initialized, shopData]);

  // Show loading while checking auth or fetching shop
  if ((!initialized && isAuthenticated === undefined) || loading || !profile) {
    return <DashboardSkeleton />;
  }

  // If not authenticated or not shop owner/super_admin, don't render
  const isAuthorized = isAuthenticated && (profile?.role === 'shop_owner' || profile?.role === 'super_admin');
  
  if (!isAuthorized) {
    return <DashboardSkeleton />;
  }

  // If no shopSlug or shop not found, show error
  if (!shopSlug || !shopData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Shop not found</h2>
          <p className="text-gray-600 mt-2">The shop you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <ShopContext.Provider value={shopData}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}