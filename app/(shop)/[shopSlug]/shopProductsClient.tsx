// app/(shop)/[shopSlug]/ShopProductsClient.tsx
"use client";

import { useShopFilter } from "@/context/shopFilterContext";
import { useShop } from "../ShopContext";
import ProductCardStandard from "./components/cardStandard";
import PageBar from "@/app/components/layout/pageBar";
import { ListFilterPlus, X } from "lucide-react";
import Button from "@/app/components/ui/button";
import Filter from "./components/filter";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ActiveFilterChips from "./components/activeFiltersChip";
import SearchBar from "@/app/components/ui/searchBar";

type SortOption = "newest" | "oldest" | "price_low" | "price_high";
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
    searchInput,
    setSearchInput,
  } = useShopFilter();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const prevFiltersRef = useRef(activeFilters);

  // Check for focusSearch param on mount
  useEffect(() => {
    if (searchParams.get("focusSearch") === "true") {
      setShowMobileSearch(true);
      // Remove the param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("focusSearch");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  // Scroll to top of page when filters change
  useEffect(() => {
    if (prevFiltersRef.current === activeFilters) return;
    prevFiltersRef.current = activeFilters;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeFilters]);

  if (!shop) return null;

  // Handlers for the mobile search bar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchClear = () => {
    setSearchInput("");
    setShowMobileSearch(false); // Hide the bar when cleared
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Debounced effect handles actual search
  };

  return (
    <div>
     
      <PageBar breadcrumb="Shop" itemCount={totalCount} />

     

      {/* Mobile filter bar */}
      <div
        className="lg:hidden px-4 py-4 font-[Poppins] cursor-pointer"
        onClick={() => setIsFilterOpen(true)}
      >
        <div className="flex flex-row gap-2">
         
            <ListFilterPlus />
          
          <span className="md:text-[16px] text-[18px] font-semibold">
            Filter
          </span>
        </div>
      </div>
      {showMobileSearch && (
        <div className="lg:hidden mb-4">
          <SearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
            onClear={handleSearchClear}
            loading={loading}
            secondaryColor={shop.secondaryColor}
            shopSlug={shop.shopSlug}
            variant="mobile"
            placeholder="What are you looking for?"
          />
        </div>
      )}

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
            <div className="flex-1 overflow-y-auto  pb-6 ">
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
            {/* Mobile Search Bar - only visible when toggled */}

            {/* Active Filters Chips Component */}
            <ActiveFilterChips
              activeFilters={activeFilters}
              categories={shop.categories || []}
              totalCount={totalCount}
              onRemoveSearch={() => searchProducts("")}
              onRemoveCategory={toggleCategory}
              onRemovePriceRange={clearPriceRange}
              onRemoveSort={() => setSortBy("newest")}
              onRemoveInStock={toggleInStock}
              onClearAll={clearFilters}
              secondaryColor={shop.secondaryColor}
            />

            {/* Products grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-5 gap-4">
              {products.map((product) => (
                <ProductCardStandard
                  key={product.product_id}
                  product={product}
                  shopSlug={shop.shopSlug}
                />
              ))}

              {loading &&
                Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <ProductCardSkeleton key={`loading-more-${index}`} />
                  ))}
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
