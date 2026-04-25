"use client";

import { Store, Search, ShoppingBag, ShoppingCart, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useCart } from "@/context/shopCartContext";
import { useState } from "react";
import PreCheckoutModal from "./precheckout";

// Cart icon component
const CartIcon = ({ cartIcon }: { cartIcon?: string }) => {
  switch (cartIcon) {
    case "bag":
      return <ShoppingBag className="w-6 h-6" />;
    case "basket":
      return <ShoppingBasket className="w-6 h-6" />;
    default:
      return <ShoppingCart className="w-6 h-6" />;
  }
};

export default function MobileBottomNav() {
  const { shop } = useShop();
  const router = useRouter();
  const { totalItems } = useCart();
  const [isPreCheckoutOpen, setIsPreCheckoutOpen] = useState(false);

  const handleSearchClick = () => {
    if (shop?.shopSlug) {
      router.push(`/${shop.shopSlug}?focusSearch=true`);
    }
  };

  const handleCartClick = () => {
    setIsPreCheckoutOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-0 h-18 left-0 right-0 bg-[url('/assets/maze-special.svg')] bg-white border-t border-gray-400 z-50 md:hidden shadow-lg flex items-center">
        <div className="flex items-center justify-around w-full">
          <Link 
            href={`/${shop?.shopSlug}`}
            className="flex flex-col items-center p-2 flex-1"
          >
            <Store className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Shop</span>
          </Link>

          <button 
            onClick={handleSearchClick}
            className="flex flex-col items-center p-2 flex-1"
          >
            <Search className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Search</span>
          </button>

          <button 
            onClick={handleCartClick}
            className="flex flex-col items-center p-2 flex-1 relative"
          >
            <div className="relative">
              <CartIcon cartIcon={shop?.cartIcon} />
              {totalItems > 0 && (
                <span 
                  className="absolute -top-2 -right-3 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: shop?.secondaryColor || "var(--secondary)" }}
                >
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-xs mt-1" style={{ color: 'var(--primary)' }}>Cart</span>
          </button>

        
        </div>
      </div>

      {/* Pre-Checkout Modal */}
      <PreCheckoutModal 
        isOpen={isPreCheckoutOpen}
        onClose={() => setIsPreCheckoutOpen(false)}
      />
    </>
  );
}