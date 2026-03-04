// app/(shop)/[shopSlug]/layout.tsx
"use client";

import { ShopProvider,useShop, useActiveBanners } from "../ShopContext";
import { useParams } from "next/navigation";
import { useEffect } from "react";

// Import your actual header/footer when ready
// import ShopHeader from "@/app/components/shop/ShopHeader";
// import ShopFooter from "@/app/components/shop/ShopFooter";

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
      {/* Header - Logo, cart, etc will live here */}
      <ShopHeader shop={shop} />
      
      {/* Banners Section - separate from header */}
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <ShopFooter shop={shop} />
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

// ShopHeader component (you can move to its own file later)
function ShopHeader({ shop }: { shop: any }) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - now properly in header */}
          <div className="flex items-center gap-2">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.shopName} className="h-12" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                {shop?.shopName}
              </span>
            )}
          </div>
          
          {/* Navigation & Cart */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6">
              <a href={`/shop/${shop.shopSlug}`}>Home</a>
              <a href={`/shop/${shop.shopSlug}/products`}>Products</a>
            </nav>
            
            {/* Cart icon - uses shop.cartIcon preference */}
            <button className="relative" style={{ color: 'var(--primary)' }}>
              {shop?.cartIcon === 'bag' ? '👜' : shop?.cartIcon === 'basket' ? '🧺' : '🛒'}
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
        
        {/* Header Message - still in header as you wanted */}
        {shop?.headerMessage && (
          <div className="mt-4 text-center text-sm bg-gray-100 p-2 rounded">
            {shop.headerMessage}
          </div>
        )}
      </div>
    </header>
  );
}

// ShopFooter component
function ShopFooter({ shop }: { shop: any }) {
  return (
    <footer className="border-t mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Shop Info */}
          <div>
            <h3 className="font-bold mb-2" style={{ color: 'var(--primary)' }}>
              {shop?.shopName}
            </h3>
            <p className="text-sm text-gray-600">
              {shop?.contactEmail}<br />
              {shop?.contactPhone}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><a href={`/shop/${shop.shopSlug}/products`}>Products</a></li>
              <li><a href={`/shop/${shop.shopSlug}/cart`}>Cart</a></li>
            </ul>
          </div>
          
          {/* WhatsApp */}
          {shop?.whatsappNumber && (
            <div>
              <h4 className="font-semibold mb-2">Contact Us</h4>
              <a 
                href={`https://wa.me/${shop.whatsappNumber}`}
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: 'var(--primary)' }}
              >
                <span>💬</span> Chat on WhatsApp
              </a>
            </div>
          )}
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t">
          &copy; {new Date().getFullYear()} {shop?.shopName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}