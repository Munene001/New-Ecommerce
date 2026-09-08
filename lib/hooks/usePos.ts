// lib/hooks/usePos.ts
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useShop } from '@/app/(shopowner)/shopownerContext'; 

// Types
interface ProductImage {
  image_id: number;
  image_path: string;
  is_primary: boolean;
  created_at: string;
  updated_at?: number;
}

interface ProductVariant {
  variant_id: number;
  attributes: Record<string, any>;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

interface DisplayPrice {
  min: number;
  max: number;
  formatted: string;
  isRange: boolean;
}

interface StockInfo {
  type: 'simple' | 'varies';
  quantity?: number;
  total?: number;
  variants?: Array<{ stock: number; attributes: Record<string, any> }>;
}

export interface POSProduct {
  product_id: number;
  shop_id: number;
  shop_type: string;
  product_name: string;
  product_slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  product_type: 'simple' | 'variable';
  status: 'draft' | 'published';
  attributes: string;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  images: ProductImage[];
  display_price: DisplayPrice;
  stock_info: StockInfo;
  in_stock: boolean;
  can_publish: boolean;
}

interface POSStats {
  totalProducts: number;
  totalInventoryItems: number;
  totalInstock: number;
  totalOutOfStock: number;
  totalDrafts: number;
}

interface UsePOSReturn {
  // Data
  products: POSProduct[];
  filteredProducts: POSProduct[];
  stats: POSStats | null;
  loading: boolean;
  isRefreshing: boolean;
  
  // Filters (from URL)
  search: string;
  category: string;
  sortBy: string;
  inStockOnly: boolean;
  
  // Actions
  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  setSortBy: (value: string) => void;
  setInStockOnly: (value: boolean) => void;
  refreshProducts: () => Promise<void>;
  clearFilters: () => void;
}

export function usePOS(): UsePOSReturn {
  const { shopId, shopSlug } = useShop(); // ✅ Get shopId and shopSlug from dashboard context
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read filters from URL on init
  const [search, setSearchState] = useState(searchParams.get('search') || '');
  const [category, setCategoryState] = useState(searchParams.get('category') || '');
  const [sortBy, setSortByState] = useState(searchParams.get('sort') || 'name');
  const [inStockOnly, setInStockOnlyState] = useState(searchParams.get('inStock') === 'true');
  
  // Products state
  const [allProducts, setAllProducts] = useState<POSProduct[]>([]);
  const [stats, setStats] = useState<POSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Ref to prevent double-fetch
  const initialFetchDone = useRef(false);
  
  // Update URL when filters change
  const updateURL = useCallback((key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== '') {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
    
    router.replace(`/dashboard/${shopSlug}/pos?${params.toString()}`, { scroll: false });
  }, [router, searchParams, shopSlug]);
  
  // Filter setters that also update URL
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    updateURL('search', value);
  }, [updateURL]);
  
  const setCategory = useCallback((value: string) => {
    setCategoryState(value);
    updateURL('category', value);
  }, [updateURL]);
  
  const setSortBy = useCallback((value: string) => {
    setSortByState(value);
    updateURL('sort', value);
  }, [updateURL]);
  
  const setInStockOnly = useCallback((value: boolean) => {
    setInStockOnlyState(value);
    updateURL('inStock', value);
  }, [updateURL]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchState('');
    setCategoryState('');
    setSortByState('name');
    setInStockOnlyState(false);
    router.replace(`/dashboard/${shopSlug}/pos`, { scroll: false });
  }, [router, shopSlug]);
  
  // Fetch products from API
  const fetchProducts = useCallback(async (showRefresh = false) => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        shopId: shopId.toString(),
        limit: '500',
        status: 'published',
      });
      
      const res = await fetch(`/api/shopowner/products?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await res.json();
      
      if (data.success) {
        setAllProducts(data.products || []);
        setStats(data.stats || null);
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ POS fetch error:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [shopId]);
  
  // Client-side filtering (INSTANT - no API calls)
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.product_name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.product_slug?.toLowerCase().includes(searchLower)
      );
    }
    
    // Category filter - handle both category_id and categories array
    if (category) {
      result = result.filter(p => {
        // If product has category_id
        if ((p as any).category_id) {
          return String((p as any).category_id) === category;
        }
        // If product has categories array
        if ((p as any).categories && Array.isArray((p as any).categories)) {
          return (p as any).categories.some((c: any) => 
            String(c.id || c.category_id) === category
          );
        }
        return true;
      });
    }
    
    // In-stock filter
    if (inStockOnly) {
      result = result.filter(p => p.in_stock === true);
    }
    
    // Client-side sorting (INSTANT)
    switch (sortBy) {
      case 'price_low':
        result = [...result].sort((a, b) => {
          const priceA = a.discount_price ?? a.price;
          const priceB = b.discount_price ?? b.price;
          return priceA - priceB;
        });
        break;
      case 'price_high':
        result = [...result].sort((a, b) => {
          const priceA = a.discount_price ?? a.price;
          const priceB = b.discount_price ?? b.price;
          return priceB - priceA;
        });
        break;
      case 'name':
        result = [...result].sort((a, b) => 
          a.product_name.localeCompare(b.product_name)
        );
        break;
      case 'newest':
        result = [...result].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      default:
        result = [...result].sort((a, b) => 
          a.product_name.localeCompare(b.product_name)
        );
    }
    
    return result;
  }, [allProducts, search, category, sortBy, inStockOnly]);
  
  // Refresh products (manual)
  const refreshProducts = useCallback(async () => {
    await fetchProducts(true);
  }, [fetchProducts]);
  
  // Initial load
  useEffect(() => {
    if (shopId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchProducts(false);
    }
  }, [shopId, fetchProducts]);
  
  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && allProducts.length > 0) {
        refreshProducts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProducts, allProducts.length]);
  
  return {
    // Data
    products: allProducts,
    filteredProducts,
    stats,
    loading,
    isRefreshing,
    
    // Filters
    search,
    category,
    sortBy,
    inStockOnly,
    
    // Actions
    setSearch,
    setCategory,
    setSortBy,
    setInStockOnly,
    refreshProducts,
    clearFilters,
  };
}