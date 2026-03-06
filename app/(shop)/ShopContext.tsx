"use client";
import * as React from 'react'
import { createContext, useContext, useState, useEffect } from "react";

// Expanded interface with all shop data
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
  
  // Banners (array since shop can have multiple)
  banners: {
    bannerId: number;
    bannerUrl: string;
    bannerType: 'default' | 'category';
    categoryId?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }[];
}

interface ShopContextType {
  shop: ShopData | null;
  loading: boolean;
  error: string | null;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ 
  children, 
  shopSlug 
}: { 
  children: React.ReactNode;
  shopSlug: string;
}) {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopSlug) {
      setError('No shop slug provided');
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
        console.log('Shop data from API:', data);
        setShop(data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch shop:", error);
        setError('Shop not found');
        setShop(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopSlug]);

  // Simple loading state
  if (loading && shopSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Error state
  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
          <p className="text-gray-600">The shop you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <ShopContext.Provider value={{ shop, loading, error }}>
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

// Helper hooks for specific needs
export function useShopColors() {
  const { shop } = useShop();
  return {
    primary: shop?.primaryColor ,
    secondary: shop?.secondaryColor
  };
}

export function useActiveBanners() {
  const { shop } = useShop();
  const now = new Date().toISOString();
  
  return shop?.banners.filter(banner => 
    banner.isActive && 
    banner.startDate <= now && 
    banner.endDate >= now
  ) || [];
}