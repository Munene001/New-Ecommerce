"use client";

import { useShop, useActiveBanner } from "../../ShopContext";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import ShopHeader from "@/app/components/layout/shopHeader";
import ShopFooter from "@/app/components/layout/shopFooter";
import MobileBottomNav from "@/app/components/layout/mobileBottomNav";
import { ShopFilterProvider, useShopFilter } from "@/context/shopFilterContext";
import { Product } from "@/lib/types/product";
import { ToastProvider } from "@/context/toastContext";
import { CartProvider } from "@/context/shopCartContext";
import { RecentlyViewedProvider } from "@/context/recentlyViewed";
import FloatingWhatsApp from "@/app/components/layout/floatingWhatsapp";

type SortOption = "newest" | "oldest" | "price_low" | "price_high";
interface PriceRange {
  min: number;
  max: number;
}

interface ShopData {
  shopId: number;
  shopName: string;
  shopSlug: string;
  primaryColor: string;
  secondaryColor: string;
  categories: { id: string; name: string }[];
  maxPrice: number;
}

interface ShopLayoutClientProps {
  children: React.ReactNode;
  shopData: ShopData;
  initialProducts: Product[];
  initialTotalCount: number;
}

// Modal component
function BannerModal({ banner, shopSlug, onClose }: { banner: any; shopSlug: string; onClose: () => void }) {
  const { toggleCategory } = useShopFilter();
  const [isClosing, setIsClosing] = useState(false);

  const handleClick = () => {
    setIsClosing(true);
    if (banner.category_id) {
      toggleCategory(banner.category_id.toString());
    }
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] transition-all duration-300 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* X Button - Outside top-right */}
        <button
          onClick={handleClose}
          className="absolute -top-8 -right-2 sm:-top-10 sm:-right-4 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" />
        </button>
        
        {/* Banner Image */}
        <div className="relative md:aspect-[16/9] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
          <img
            src={`/api/shops/${shopSlug}/banner-image?bannerId=${banner.banner_id}&w=800`}
            alt="Banner"
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleClick}
          />
        </div>
      </div>
    </>
  );
}

export default function ShopLayoutClient({
  children,
  shopData,
  initialProducts,
  initialTotalCount,
}: ShopLayoutClientProps) {
  const { shop, loading } = useShop();
  const activeBanner = useActiveBanner();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [modalClosed, setModalClosed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseRef = useRef<NodeJS.Timeout | null>(null);

  // Parse initial filter values from URL
  const initialSearch = searchParams.get("search") || "";
  const initialCategories = searchParams.get("categories")?.split(",") || [];
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const initialPriceRange =
    minPrice && maxPrice
      ? { min: Number(minPrice), max: Number(maxPrice) }
      : null;
  const initialSortBy = (searchParams.get("sortBy") as SortOption) || "newest";
  const initialInStock = searchParams.get("inStock") === "true";

  // Check if banner was shown today
  const shouldShowBanner = () => {
    if (!activeBanner) return false;
    
    
    const isHomepage = pathname === `/${shopData.shopSlug}`;
    if (!isHomepage) return false;
    
    
    const lastShown = localStorage.getItem(`banner_${shopData.shopSlug}_date`);
    const today = new Date().toDateString();
    
    if (lastShown === today) return false;
    
    return true;
  };

  // Show banner after 5 seconds
  useEffect(() => {
    if (shouldShowBanner() && !modalClosed && !showBannerModal) {
      timeoutRef.current = setTimeout(() => {
        setShowBannerModal(true);
      }, 5000);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeBanner, pathname, modalClosed, showBannerModal]);

  // Auto-close after 3 minutes
  useEffect(() => {
    if (showBannerModal) {
      autoCloseRef.current = setTimeout(() => {
        handleCloseModal();
      }, 180000); 
    }
    
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, [showBannerModal]);

  const handleCloseModal = () => {
    setShowBannerModal(false);
    setModalClosed(true);
    // Save today's date to localStorage
    const today = new Date().toDateString();
    localStorage.setItem(`banner_${shopData.shopSlug}_date`, today);
  };

  // Apply CSS variables when shop data loads
  useEffect(() => {
    if (shopData) {
      document.documentElement.style.setProperty(
        "--primary",
        shopData.primaryColor
      );
      document.documentElement.style.setProperty(
        "--secondary",
        shopData.secondaryColor
      );
    }
  }, [shopData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <RecentlyViewedProvider>
      <ToastProvider>
        <CartProvider>
          <ShopFilterProvider
            shopSlug={shopData.shopSlug}
            initialProducts={initialProducts}
            initialTotalCount={initialTotalCount}
            initialSearch={initialSearch}
            initialCategories={initialCategories}
            initialPriceRange={initialPriceRange}
            initialSortBy={initialSortBy}
            initialInStock={initialInStock}
          >
            <div className="min-h-screen flex flex-col">
              <ShopHeader />

              {/* No inline banner - removed */}

              <main>{children}</main>
              <FloatingWhatsApp/>

              <ShopFooter />
              <MobileBottomNav />
            </div>

            {/* Banner Modal */}
            {showBannerModal && activeBanner && (
              <BannerModal
                banner={activeBanner}
                shopSlug={shopData.shopSlug}
                onClose={handleCloseModal}
              />
            )}
          </ShopFilterProvider>
        </CartProvider>
      </ToastProvider>
    </RecentlyViewedProvider>
  );
}