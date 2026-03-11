// app/(shop)/[shopSlug]/ShopProductsClient.tsx
"use client";

import { useShopFilter } from "@/context/shopFilterContext";
import { useShop } from "../ShopContext";
import ProductCardStandard from "./components/cardStandard";
import PageBar from "@/app/components/layout/pageBar";
import { ListFilterPlus, X } from 'lucide-react';
import Button from "@/app/components/ui/button";
import Filter from "./components/filter";
import { useEffect, useRef, useState } from 'react';
import FilterChip from "@/app/components/ui/filterChip";

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';
interface PriceRange {
  min: number;
  max: number;
}

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

export default function ShopProductsClient() {
  const { shop } = useShop();
  const {
    products,
    loading,
    hasMore,
    totalCount,
    activeFilters,
    searchProducts,
    toggleCategory,
    setPriceRange,
    clearPriceRange,
    setSortBy,
    toggleInStock,
    clearFilters,
    loadMoreProducts,
  } = useShopFilter();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const productsTopRef = useRef<HTMLDivElement>(null);
  const prevFiltersRef = useRef(activeFilters);

  // Scroll to top when filters change
  useEffect(() => {
    if (prevFiltersRef.current === activeFilters) return;
    prevFiltersRef.current = activeFilters;
    productsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeFilters]);

  if (!shop) return null; // or a loader, but ShopContext should provide it

  return (
    <div>
      <PageBar breadcrumb="Shop" itemCount={totalCount} /> 
      
      {/* Mobile filter bar */}
      <div className="lg:hidden px-4 py-4 font-[Poppins] cursor-pointer" onClick={() => setIsFilterOpen(true)}>
        <div className="flex flex-row gap-2">
          <span style={{ color: shop.secondaryColor }}><ListFilterPlus/></span> 
          <span className="md:text-[16px] text-[18px] font-semibold">Filter</span>
        </div>
      </div>

      {/* Mobile filter modal */}
      {isFilterOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85%] bg-white z-50 lg:hidden shadow-2xl animate-slide-right transform transition-transform duration-300 ease-in-out">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="absolute top-4 right-4 hover:opacity-70 transition z-10"
            >
              <X className="w-6 h-6" style={{ color: shop.secondaryColor }} />
            </button>
            <div className="flex-1 overflow-y-auto pt-16 pb-6 px-4">
              <Filter
                shopData={shop}
                activeFilters={activeFilters}
                onToggleCategory={toggleCategory}
                onSetPriceRange={setPriceRange}
                onClearPriceRange={clearPriceRange}
                onSetSortBy={setSortBy}
                onClearFilters={clearFilters}
                categories={shop.categories || []}
                maxPrice={shop.maxPrice}
              />
            </div>
          </div>
        </>
      )}
      
      {/* Main content */}
      <div className="px-4 pb-8 mt-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Desktop filter aside */}
          <aside className="hidden lg:block lg:w-[260px] flex-shrink-0">
            <Filter 
              shopData={shop}
              activeFilters={activeFilters}
              onToggleCategory={toggleCategory}
              onSetPriceRange={setPriceRange}
              onClearPriceRange={clearPriceRange}
              onSetSortBy={setSortBy}
              maxPrice={shop.maxPrice}  
              onClearFilters={clearFilters}
              categories={shop.categories || []} 
            />
          </aside>
          
          {/* Products area */}
          <div className="flex-1 min-w-0">
            {/* Active filters chips and clear all */}
            <div ref={productsTopRef} className="mb-4 space-y-2">
              {(activeFilters.search || activeFilters.categories.length > 0 || activeFilters.priceRange || activeFilters.sortBy !== 'newest' || activeFilters.inStock) && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search chip */}
                  {activeFilters.search && (
                    <FilterChip
                      label={`"${activeFilters.search}"`}
                      onRemove={() => searchProducts('')}
                      color={shop.secondaryColor}
                    />
                  )}
                  {/* Category chips */}
                  {activeFilters.categories.map(catId => {
                    const cat = shop.categories.find(c => c.id === catId);
                    return cat ? (
                      <FilterChip
                        key={catId}
                        label={cat.name}
                        onRemove={() => toggleCategory(catId)}
                        color={shop.secondaryColor}
                      />
                    ) : null;
                  })}
                  {/* Price range chip */}
                  {activeFilters.priceRange && (
                    <FilterChip
                      label={`Ksh ${activeFilters.priceRange.min.toLocaleString()} – ${activeFilters.priceRange.max.toLocaleString()}`}
                      onRemove={clearPriceRange}
                      color={shop.secondaryColor}
                    />
                  )}
                  {/* Sort chip (only if not default) */}
                  {activeFilters.sortBy !== 'newest' && (
                    <FilterChip
                      label={`Sort: ${
                        activeFilters.sortBy === 'price_low' ? 'Price low' :
                        activeFilters.sortBy === 'price_high' ? 'Price high' :
                        activeFilters.sortBy === 'oldest' ? 'Oldest' : 'Newest'
                      }`}
                      onRemove={() => setSortBy('newest')}
                      color={shop.secondaryColor}
                    />
                  )}
                  {/* In stock chip */}
                  {activeFilters.inStock && (
                    <FilterChip
                      label="In stock"
                      onRemove={toggleInStock}
                      color={shop.secondaryColor}
                    />
                  )}
                  {/* Clear all button */}
                  {(activeFilters.search || activeFilters.categories.length > 0 || activeFilters.priceRange || activeFilters.sortBy !== 'newest' || activeFilters.inStock) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 ml-auto"
                    >
                      Clear all
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              {/* Result count */}
              <div className="text-sm text-gray-500">
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
              </div>
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-5 gap-4">
              {products.map((product) => (
                <ProductCardStandard
                  key={product.product_id}
                  product={product}
                  shopSlug={shop.shopSlug}
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
                  style={{ backgroundColor: shop.primaryColor }}
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