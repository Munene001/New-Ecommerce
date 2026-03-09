// app/(shop)/[shopSlug]/ShopProductsClient.tsx
"use client";

import { useShopProducts } from "@/lib/hooks/useProductShop";
import ProductCardStandard from "./components/cardStandard";
import PageBar from "@/app/components/layout/pageBar";
import { ListFilterPlus } from 'lucide-react';
import Button from "@/app/components/ui/button";
import { Product } from "@/lib/types/product";
import Filter from "./components/filter";

// Simple skeleton component
const ProductCardSkeleton = () => (
  <div className="w-full font-[Poppins] animate-pulse">
    <div className="relative w-full aspect-[245/266] max-w-[260px] bg-gray-200 rounded-sm"></div>
    <div className="mt-2 px-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-end mt-5">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

interface ShopData {
  shopId: number;
  shopName: string;
  shopSlug: string;
  shopType: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  whatsappNumber?: string;
  headerMessage?: string;
  productCardStyle: 'standard' | 'minimal' | 'compact';
  cartIcon: 'cart' | 'bag' | 'basket';
  banners: any[];
}

interface ShopProductsClientProps {
  initialProducts: Product[];
  initialTotalCount: number;
  shopSlug: string;
  shopId: string;
  shopData: ShopData;
}

export default function ShopProductsClient({ 
  initialProducts, 
  initialTotalCount,
  shopSlug,
  shopId,
  shopData
}: ShopProductsClientProps) {
  const {
    products,
    loading,
    hasMore,
    totalCount,
    activeFilters, // Get active filters from hook
    searchProducts,
    toggleCategory, // Use toggleCategory instead of filterByCategory
    setPriceRange,
    clearPriceRange,
    setSortBy,
    toggleInStock,
    clearFilters,
    loadMoreProducts,
  } = useShopProducts(
    initialProducts, 
    shopId,
    initialTotalCount
  );
  
  return (
    <div>
      <PageBar breadcrumb="Shop" itemCount={totalCount} /> 
      
      {/* Filter bar - mobile only */}
      <div className="lg:hidden px-4 py-4 font-[Poppins] bg-gray-200">
        <div className="flex flex-row gap-2">
          <span style={{ color: shopData.secondaryColor }}><ListFilterPlus/></span> 
          <span className="md:text-[16px] text-[18px] font-semibold">Filter</span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="px-4 pb-8 mt-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Aside Filter - Pass all props to Filter component */}
          <aside className="hidden lg:block lg:w-[260px] flex-shrink-0">
            <Filter 
              shopData={shopData}
              activeFilters={activeFilters}
              onToggleCategory={toggleCategory}
              onSetPriceRange={setPriceRange}
              onClearPriceRange={clearPriceRange}
              onSetSortBy={setSortBy}
              
              onClearFilters={clearFilters}
              categories={[]} 
            />
          </aside>
          
          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-5 gap-4">
              {products.map((product) => (
                <ProductCardStandard
                  key={product.product_id}
                  product={product}
                  shopSlug={shopData.shopSlug}
                />
              ))}
              
              {loading && (
                Array(4).fill(0).map((_, index) => (
                  <ProductCardSkeleton key={`loading-more-${index}`} />
                ))
              )}
            </div>
            
            {hasMore && !loading && (
              <div className="text-center py-4 mt-8">
                <Button 
                  onClick={loadMoreProducts}
                  style={{ backgroundColor: shopData.primaryColor }}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}