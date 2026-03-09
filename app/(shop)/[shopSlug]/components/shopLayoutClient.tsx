// app/(shop)/[shopSlug]/ShopLayoutClient.tsx
"use client";

import { useShop, useActiveBanners } from "../../ShopContext";
import { useEffect } from "react";
import ShopHeader from "@/app/components/layout/shopHeader";
import ShopFooter from "@/app/components/layout/shopFooter";
import MobileBottomNav from "@/app/components/layout/mobileBottomNav";

export default function ShopLayoutClient({ children }: { children: React.ReactNode }) {
  const { shop, loading } = useShop();
  const activeBanners = useActiveBanners();
  
  // Apply CSS variables when shop data loads
  useEffect(() => {
    if (shop) {
      document.documentElement.style.setProperty('--primary', shop.primaryColor);
      document.documentElement.style.setProperty('--secondary', shop.secondaryColor);
    }
  }, [shop]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShopHeader/>
      
      {activeBanners.length > 0 && (
        <div className="container mx-auto px-4 py-4">
          {activeBanners.map((banner) => (
            <a
              key={banner.bannerId}
              href={banner.bannerType === 'default' 
                ? `/shop/${shop?.shopSlug}/products?discounted=true`
                : `/shop/${shop?.shopSlug}/categories/${banner.categoryId}`
              }
              className="block"
            >
              <img src={banner.bannerUrl} alt="Banner" className="w-full rounded-lg" />
            </a>
          ))}
        </div>
      )}

      <main>
        {children}
      </main>

      <ShopFooter/>
      <MobileBottomNav/>
    </div>
  );
}