// app/(shop)/ShopContext.tsx
"use client";
import * as React from 'react'
import { createContext, useContext, useState, useEffect } from "react";

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
  
  // Single active banner (no date fields)
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [initialShopData.shopSlug]);

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
    primary: shop?.primaryColor,
    secondary: shop?.secondaryColor
  };
}

// Helper hook to get the active banner (no date checks)
export function useActiveBanner() {
  const { shop } = useShop();
  const banner = shop?.banner;
  
  if (!banner) return null;
  
  // Only check if banner is active (no date conditions)
  return banner.is_active ? banner : null;
}