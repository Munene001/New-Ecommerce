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

  useEffect(() => {
    // Wait for auth to load
    if (isAuthenticated === undefined) return;
    
    // Mark as initialized after first auth check
    if (!initialized) {
      setInitialized(true);
    }

    // If already on dashboard, don't redirect
    const currentPath = window.location.pathname;
    if (currentPath.includes('/dashboard')) {
      // Still need to fetch shop data if not loaded
      if (!shopData && shopSlug && isAuthenticated && profile?.role === 'shop_owner') {
        const fetchShopData = async () => {
          try {
            const res = await fetch(`/api/shops/${shopSlug}`);
            if (!res.ok) throw new Error('Shop not found');
            const data = await res.json();
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

    // Check if user is shop owner
    if (profile.role !== 'shop_owner') {
      router.push(`/${shopSlug}`);
      return;
    }

    // If no shopSlug, show error
    if (!shopSlug) {
      setLoading(false);
      return;
    }

    // Fetch shop data
    const fetchShopData = async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}`);
        
        if (!res.ok) {
          throw new Error('Shop not found');
        }
        
        const data = await res.json();
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

    fetchShopData();
  }, [shopSlug, isAuthenticated, user, profile, router, initialized, shopData]);

  // Show loading while checking auth or fetching shop
  if ((!initialized && isAuthenticated === undefined) || loading || !profile) {
    return <DashboardSkeleton />;
  }

  // If not authenticated or not shop owner, don't render
  if (!isAuthenticated || profile?.role !== 'shop_owner') {
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