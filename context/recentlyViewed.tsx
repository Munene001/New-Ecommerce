// context/recentlyViewedContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useShop } from "@/app/(shop)/ShopContext";

export interface RecentlyViewedItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
}

interface RecentlyViewedContextType {
  items: RecentlyViewedItem[];
  addViewedProduct: (product: RecentlyViewedItem) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return context;
};

export const RecentlyViewedProvider = ({ children }: { children: React.ReactNode }) => {
  const { shop } = useShop();
  const shopId = shop?.shopId;
  const storageKey = shopId ? `recentlyViewed-${shopId}` : null;

  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently viewed", e);
      }
    }
  }, [storageKey]);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addViewedProduct = (product: RecentlyViewedItem) => {
    setItems(prev => {
      // Remove if already exists (to avoid duplicates and to move it to front)
      const filtered = prev.filter(item => item.product_id !== product.product_id);
      // Add new item at the beginning
      const updated = [product, ...filtered];
      // Keep only first 5
      return updated.slice(0, 5);
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, addViewedProduct }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};