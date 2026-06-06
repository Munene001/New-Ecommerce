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
  const [accessDenied, setAccessDenied] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchShopData = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}`);
      if (!res.ok) throw new Error('Shop not found');
      
      const data = await res.json();
      
      // API determines ownership (includes affiliates via is_owner)
      if (!data.isOwner && profile?.role !== 'super_admin') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      setShopData({
        shopId: data.shopId,
        shopType: data.shopType,
        shopSlug: shopSlug
      });
    } catch (error) {
      console.error("Failed to fetch shop:", error);
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!profile) return;
    if (!shopSlug) {
      setLoading(false);
      return;
    }
    fetchShopData();
  }, [isAuthenticated, profile, shopSlug]);

  if (loading || !profile) return <DashboardSkeleton />;
  if (accessDenied) {
    // Redirect to home or profile
    router.replace(profile.shopSlug ? `/dashboard/${profile.shopSlug}` : '/');
    return null;
  }
  if (!shopData) return null;

  return (
    <ShopContext.Provider value={shopData}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within ShopProvider");
  return context;
}