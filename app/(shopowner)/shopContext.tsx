"use client";

import { createContext, useContext, useState, useEffect } from "react";

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
    const fetchShopData = async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}`);
        const data = await res.json();
        setShopData({
          shopId: data.shop_id,
          shopType: data.shop_type,
          shopSlug: shopSlug
        });
      } catch (error) {
        console.error("Failed to fetch shop:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopSlug]);

  if (loading) {
    return <div>Loading shop...</div>;
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