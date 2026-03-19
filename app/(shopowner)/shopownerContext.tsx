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
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load
    if (isAuthenticated === undefined) return;

    // Not logged in – redirect to login with return URL
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Logged in but not a shop owner – redirect to shop front page
    if (user?.role !== 'shop_owner') {
      router.push(`/${shopSlug}`); // Go to shop home instead of global home
      return;
    }

    // If no shopSlug (should not happen), show error
    if (!shopSlug) {
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}`);
        if (res.status === 401 || res.status === 403) {
          // Unauthorized or forbidden – redirect to login
          router.push('/auth/login');
          return;
        }
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
  }, [shopSlug, isAuthenticated, user, router]);

  // Show loading while checking auth or fetching shop
  if (loading || isAuthenticated === undefined) {
    return <DashboardSkeleton />;
  }

  // If no shopSlug or shop not found, show error
  if (!shopSlug || !shopData) {
    return <div>Shop not found</div>;
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