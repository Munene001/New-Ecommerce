// app/(shop)/[shopSlug]/layout.tsx
"use client";

import { ShopProvider,useShop, useActiveBanners } from "../ShopContext";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import ShopHeader from "@/app/components/layout/shopHeader";
import ShopFooter from "@/app/components/layout/shopFooter";
import MobileBottomNav from "@/app/components/layout/mobileBottomNav";



// Inner component that has access to shop context
function ShopLayoutContent({ children }: { children: React.ReactNode }) {
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
    return <div>Loading shop...</div>;
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

     
      <main className=" ">
        {children}
      </main>

     
      <ShopFooter/>
      <MobileBottomNav/>
    </div>
  );
}

// Main layout with provider
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;

  return (
    <ShopProvider shopSlug={shopSlug}>
      <ShopLayoutContent>
        {children}
      </ShopLayoutContent>
    </ShopProvider>
  );
}


