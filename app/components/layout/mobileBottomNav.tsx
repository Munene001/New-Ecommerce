// app/components/layout/MobileBottomNav.tsx
"use client";

import { Heart, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useShop } from "@/app/(shop)/ShopContext";
import { useState } from "react";

import MobileSearchOverlay from "@/app/(shop)/[shopSlug]/components/mobileSearch";

export default function MobileBottomNav() {
  const { shop } = useShop();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-400 z-50 md:hidden shadow-lg">
        <div className="flex items-center justify-around py-2">
          <Link 
            href={`/shop/${shop?.shopSlug}`}
            className="flex flex-col items-center p-2 flex-1"
          >
            <ShoppingBag className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Shop</span>
          </Link>

          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center p-2 flex-1"
          >
            <Search className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Search</span>
          </button>

          <Link 
            href={`/shop/${shop?.shopSlug}/wishlist`}
            className="flex flex-col items-center p-2 flex-1"
          >
            <Heart className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Wishlist</span>
          </Link>
        </div>
      </div>

      <MobileSearchOverlay 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}