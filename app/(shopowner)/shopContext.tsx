"use client";
import * as React from 'react'
import { createContext, useContext, useState, useEffect } from "react";
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

  useEffect(() => {
    // Don't fetch if shopSlug is undefined or empty
    if (!shopSlug) {
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}`);
        if (!res.ok) {
          throw new Error('Shop not found');
        }
        const data = await res.json();
        setShopData({
          shopId: data.shop_id,
          shopType: data.shop_type,
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
  }, [shopSlug]);

  // Show loading only when we have a shopSlug and are fetching
  if (loading && shopSlug) {
    return <DashboardSkeleton />;
  }

  // If no shopSlug or shop not found, show error or redirect
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