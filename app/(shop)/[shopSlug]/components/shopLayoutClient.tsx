// app/(shop)/[shopSlug]/ShopLayoutClient.tsx
"use client";

import { useShop, useActiveBanners } from "../../ShopContext";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ShopHeader from "@/app/components/layout/shopHeader";
import ShopFooter from "@/app/components/layout/shopFooter";
import MobileBottomNav from "@/app/components/layout/mobileBottomNav";
import { ShopFilterProvider } from "@/context/shopFilterContext";
import { Product } from "@/lib/types/product";
import { ToastProvider } from "@/context/toastContext";
import { CartProvider } from "@/context/shopCartContext";
import { RecentlyViewedProvider } from "@/context/recentlyViewed";

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
  // ... include other fields as needed
}

interface ShopLayoutClientProps {
  children: React.ReactNode;
  shopData: ShopData;
  initialProducts: Product[];
  initialTotalCount: number;
}

export default function ShopLayoutClient({
  children,
  shopData,
  initialProducts,
  initialTotalCount,
}: ShopLayoutClientProps) {
  const { shop, loading } = useShop(); // from your existing ShopContext
  const activeBanners = useActiveBanners();
  const searchParams = useSearchParams();

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

  // Apply CSS variables when shop data loads (shopData is from props)
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

        {activeBanners.length > 0 && (
          <div className="container mx-auto px-4 py-4">
            {activeBanners.map((banner) => (
              <a
                key={banner.bannerId}
                href={
                  banner.bannerType === "default"
                    ? `/shop/${shopData.shopSlug}/products?discounted=true`
                    : `/shop/${shopData.shopSlug}/categories/${banner.categoryId}`
                }
                className="block"
              >
                <img
                  src={banner.bannerUrl}
                  alt="Banner"
                  className="w-full rounded-lg"
                />
              </a>
            ))}
          </div>
        )}

        <main>{children}</main>

        <ShopFooter />
        <MobileBottomNav />
      </div>
    </ShopFilterProvider>
    </CartProvider>
    </ToastProvider>
    </RecentlyViewedProvider>
  );
}
