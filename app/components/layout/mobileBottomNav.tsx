"use client";

import { Heart, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";

export default function MobileBottomNav() {
  const { shop } = useShop();
  const router = useRouter();

  const handleSearchClick = () => {
    if (shop?.shopSlug) {
      router.push(`/${shop.shopSlug}?focusSearch=true`);
    }
  };

  return (
    <div className="fixed bottom-0 h-18 left-0 right-0 bg-white border-t border-gray-400 z-50 md:hidden shadow-lg flex items-center">
      <div className="flex items-center justify-around w-full">
        <Link 
          href={`/${shop?.shopSlug}`}
          className="flex flex-col items-center p-2 flex-1"
        >
          <ShoppingBag className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Shop</span>
        </Link>

        <button 
          onClick={handleSearchClick}
          className="flex flex-col items-center p-2 flex-1"
        >
          <Search className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Search</span>
        </button>

        <Link 
          href={`/${shop?.shopSlug}/wishlist`}
          className="flex flex-col items-center p-2 flex-1"
        >
          <Heart className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Wishlist</span>
        </Link>
      </div>
    </div>
  );
}