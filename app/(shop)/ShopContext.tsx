// app/(shop)/ShopContext.tsx
"use client";
import * as React from 'react'
import { createContext, useContext, useState, useEffect } from "react";
import { useLeadTracking } from '@/lib/hooks/useTracking';

interface ShopData {
  shopId: number;
  shopName: string;
  shopSlug: string;
  shopType: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  whatsappNumber?: string;
  headerMessage?: string;
  productCardStyle: 'standard' | 'minimal' | 'compact';
  cartIcon: 'cart' | 'bag' | 'basket';
  description?: string;        
  businessTown?: string;       
  businessAddress?: string;
  maxPrice: number;
  categories: { id: string; name: string }[];
  
  banner: {
    banner_id: number;
    banner_url: string;
    link_url?: string;
    category_id?: number;
    is_active: boolean;
  } | null;
}

interface ShopContextType {
  shop: ShopData | null;
  loading: boolean;
  error: string | null;
  trackEvent: (eventType: string, metadata?: Record<string, any>) => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ 
  children, 
  initialShopData 
}: { 
  children: React.ReactNode;
  initialShopData: ShopData;
}) {
  const [shop, setShop] = useState<ShopData | null>(initialShopData);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  
  const { track } = useLeadTracking();

  // Simple track function - just uses shopId from context
  const trackEvent = (eventType: string, metadata: Record<string, any> = {}) => {
    if (shop?.shopId) {
      track(shop.shopId, eventType, metadata);
    }
  };

  // Track shop view when page loads
  useEffect(() => {
    if (shop?.shopId) {
      trackEvent('shop_view');
    }
  }, [shop?.shopId]);

  // Optional: Fetch updates if needed (e.g., every 5 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/shops/${initialShopData.shopSlug}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        }
      } catch (error) {
        console.error('Failed to refresh shop data:', error);
      }
    }, 300000);
    
    return () => clearInterval(interval);
  }, [initialShopData.shopSlug]);

  return (
    <ShopContext.Provider value={{ shop, loading, error, trackEvent }}>
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

export function useShopColors() {
  const { shop } = useShop();
  return {
    primary: shop?.primaryColor,
    secondary: shop?.secondaryColor
  };
}

export function useActiveBanner() {
  const { shop } = useShop();
  const banner = shop?.banner;
  return banner?.is_active ? banner : null;
}