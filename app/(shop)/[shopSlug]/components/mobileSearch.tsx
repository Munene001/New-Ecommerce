"use client";

import { X, Search, ArrowLeft, Loader2, Clock, Trash2, ListFilterPlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useShopFilter } from "@/context/shopFilterContext";
import ActiveFiltersChips from "@/app/(shop)/[shopSlug]/components/activeFiltersChip";
import ProductCardStandard from "@/app/(shop)/[shopSlug]/components/cardStandard";
import Filter from "@/app/(shop)/[shopSlug]/components/filter"; // reuse filter component

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const { shop } = useShop();
  const {
    products,
    loading,
    totalCount,
    activeFilters,
    searchProducts,
    toggleCategory,
    setPriceRange,
    clearPriceRange,
    setSortBy,
    toggleInStock,
    clearFilters,
  } = useShopFilter();

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchInput, setSearchInput] = useState(activeFilters.search);
  const debouncedSearch = useDebounce(searchInput, 500);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // for filter modal

  // Recent searches (local)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const shopId = shop?.shopId?.toString();
  const shopSlug = shop?.shopSlug;
  const secondaryColor = shop?.secondaryColor || "#10B981";

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (!shopId) return;
    const stored = localStorage.getItem(`recentSearches_${shopId}`);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [shopId]);

  // Save recent searches to localStorage
  useEffect(() => {
    if (!shopId) return;
    localStorage.setItem(`recentSearches_${shopId}`, JSON.stringify(recentSearches));
  }, [recentSearches, shopId]);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Sync search input with global filter when overlay opens or filter changes
  useEffect(() => {
    setSearchInput(activeFilters.search);
  }, [activeFilters.search, isOpen]);

  // Update global search filter when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== activeFilters.search) {
      searchProducts(debouncedSearch);
    }
  }, [debouncedSearch, searchProducts, activeFilters.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    searchProducts("");
  };

  const handleResultClick = (product: any) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [product.product_name, ...prev.filter(s => s !== product.product_name)].slice(0, 5);
      return updated;
    });
    router.push(`/shop/${shopSlug}/product/${product.product_slug}`);
    onClose();
  };

  const handleRecentClick = (term: string) => {
    setSearchInput(term);
    // debounce will trigger searchProducts
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(s => s !== term));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[60] md:hidden backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search panel sliding from right */}
      <div className="fixed inset-y-0 right-0 w-full bg-white font-[Poppins] z-[70] md:hidden shadow-2xl animate-slide-left flex flex-col h-full">
        {/* Header with back arrow */}
        <div className="flex items-center px-4 h-16 border-b border-gray-100">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="ml-2 text-lg font-medium text-gray-900">Search & Filter</span>
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              placeholder="Search products..."
              className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              style={{ 
                '--tw-ring-color': secondaryColor,
                '--tw-ring-opacity': 0.3,
                borderColor: secondaryColor
              } as React.CSSProperties}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {/* Filter trigger and active chips */}
        <div className="px-4 space-y-3">
          {/* Filter button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 w-full bg-gray-50 rounded-xl text-sm font-medium border border-gray-200"
            style={{ color: secondaryColor }}
          >
            <ListFilterPlus size={18} />
            <span>All filters</span>
            {activeFilters.categories.length > 0 && (
              <span className="ml-auto bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                {activeFilters.categories.length} selected
              </span>
            )}
          </button>

          {/* Active Filters Chips - only render if shop exists */}
          {shop && (
            <ActiveFiltersChips
              activeFilters={activeFilters}
              shop={shop}
              onRemoveSearch={handleClearSearch}
              onRemoveCategory={toggleCategory}
              onRemovePriceRange={clearPriceRange}
              onRemoveSort={() => setSortBy("newest")}
              onRemoveInStock={toggleInStock}
              onClearAll={clearFilters}
              totalCount={totalCount}
            />
          )}
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 mt-4">
          {/* Recent searches (only shown when no filters active and no search input) */}
          {!searchInput && !activeFilters.categories.length && !activeFilters.priceRange && activeFilters.sortBy === 'newest' && !activeFilters.inStock && recentSearches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent</h3>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <div key={index} className="flex items-center group">
                    <button
                      onClick={() => handleRecentClick(term)}
                      className="flex items-center gap-3 flex-1 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 text-sm">{term}</span>
                    </button>
                    <button
                      onClick={(e) => handleRemoveRecent(term, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity"
                      aria-label="Remove from recent"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product results - using ProductCardStandard */}
          {products.length === 0 && !loading ? (
            <p className="text-center text-gray-400 py-12 text-sm">No products found</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.product_id}
                  onClick={() => handleResultClick(product)}
                  className="cursor-pointer"
                >
                  <ProductCardStandard
                    product={product}
                    shopSlug={shopSlug || ""}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal (mobile) */}
      {isFilterModalOpen && shop && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[80] md:hidden"
            onClick={() => setIsFilterModalOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85%] bg-white z-[90] md:hidden shadow-2xl animate-slide-right overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center z-10">
              <h3 className="font-medium text-lg">Filters</h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 pb-8">
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

    
    </>
  );
}