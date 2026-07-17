"use client";
import * as React from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const hasRetried = useRef(false);

  const fetchShopData = async () => {
    try {
      const res = await fetch(`/api/shops/${shopSlug}`);
      
      if (!res.ok) {
        // If 404 and we haven't retried yet, retry once after 3 seconds
        if (res.status === 404 && !hasRetried.current) {
          hasRetried.current = true;
          setTimeout(() => {
            fetchShopData();
          }, 3000);
          return;
        }
        throw new Error('Shop not found');
      }
      
      const data = await res.json();
      
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
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch shop:", error);
      setAccessDenied(true);
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