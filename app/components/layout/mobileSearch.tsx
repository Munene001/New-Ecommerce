// app/components/layout/MobileSearchOverlay.tsx
"use client";

import { X, Search, ArrowLeft, Loader2, Clock, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";

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

interface Product {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price?: number;
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format price with commas, no decimals
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// Image component with skeleton loader
function ProductImage({ productId, productName }: { productId: number; productName: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {!error && (
        <img
          src={`/api/shopowner/products/${productId}/images/primary?w=200`}
          alt={productName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {error && (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-400">No image</span>
        </div>
      )}
    </div>
  );
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const { shop } = useShop();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 300);
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

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || !shopId) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/shopowner/products?shopId=${shopId}&search=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setResults(data.products || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, shopId]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  const handleResultClick = (product: Product) => {
    // Add to recent searches (avoid duplicates, keep last 5)
    setRecentSearches(prev => {
      const updated = [product.product_name, ...prev.filter(s => s !== product.product_name)].slice(0, 5);
      return updated;
    });
    router.push(`/shop/${shopSlug}/product/${product.product_slug}`);
    onClose();
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
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
        {/* Header with back arrow - minimal */}
        <div className="flex items-center px-4 h-16 border-b border-gray-100">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="ml-2 text-lg font-medium text-gray-900">Search</span>
        </div>

        {/* Search input - clean design */}
        <div className="p-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
              style={{ 
                '--tw-ring-color': secondaryColor,
                '--tw-ring-opacity': 0.3,
                borderColor: secondaryColor
              } as React.CSSProperties}
            />
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
            />
            {query && (
              <button
                onClick={handleClear}
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

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
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

          {/* Search results */}
          {query && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </h3>
              {results.length === 0 && !loading ? (
                <p className="text-center text-gray-400 py-12 text-sm">No products found</p>
              ) : (
                <div className="space-y-2">
                  {results.map((product) => (
                    <button
                      key={product.product_id}
                      onClick={() => handleResultClick(product)}
                      className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
                    >
                      <ProductImage productId={product.product_id} productName={product.product_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-lg truncate">{product.product_name}</p>
                        <div className="flex items-center gap-2">
                          {product.discount_price ? (
                            <>
                              <p className="text-[16px] font-medium" style={{ color: secondaryColor }}>
                                Ksh {formatPrice(product.discount_price)}
                              </p>
                              <p className="text-sm text-gray-400 line-through">
                                Ksh {formatPrice(product.price)}
                              </p>
                            </>
                          ) : (
                            <p className="text-[16px] font-medium" style={{ color: secondaryColor }}>
                              Ksh {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
      `}</style>
    </>
  );
}