// lib/hooks/useShopProducts.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Product } from '../types/product';

// Define filter types
type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';
type PriceRange = { min: number; max: number } | null;

interface ShopFilters {
  search: string;
  categories: string[]; // Multiple categories
  priceRange: PriceRange;
  sortBy: SortOption;
  inStock: boolean;
}

interface UseShopProductsReturn {
  products: Product[];
  loading: boolean;
  totalCount: number;
  hasMore: boolean;
  activeFilters: ShopFilters;
  
  // Filter actions
  searchProducts: (term: string) => Promise<void>;
  toggleCategory: (categoryId: string) => Promise<void>;
  setPriceRange: (min: number, max: number) => Promise<void>;
  clearPriceRange: () => Promise<void>;
  setSortBy: (option: SortOption) => Promise<void>;
  toggleInStock: () => Promise<void>;
  clearFilters: () => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  resetProducts: () => void;
}

export function useShopProducts(
  initialProducts: Product[],
  shopId: string,
  initialTotalCount?: number
): UseShopProductsReturn {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount || 0);
  const [hasMore, setHasMore] = useState<boolean>(initialProducts.length < (initialTotalCount || 0));
  
  // Enhanced filters state
  const [filters, setFilters] = useState<ShopFilters>({
    search: '',
    categories: [],
    priceRange: null,
    sortBy: 'newest',
    inStock: false,
  });

  // Sync with initial products (for SSR)
  useEffect(() => {
    if (products.length === 0 && initialProducts.length > 0) {
      setProducts(initialProducts);
      setHasMore(initialProducts.length < (initialTotalCount || 0));
    }
  }, [initialProducts, products.length, initialTotalCount]);

  // Build query params from filters
  const buildQueryParams = (page: number): URLSearchParams => {
    const params = new URLSearchParams({
      shopId,
      page: page.toString(),
      limit: '20',
    });

    // Add search
    if (filters.search) {
      params.append('search', filters.search);
    }

    // Add multiple categories (comma-separated)
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }

    // Add price range
    if (filters.priceRange) {
      params.append('minPrice', filters.priceRange.min.toString());
      params.append('maxPrice', filters.priceRange.max.toString());
    }

    // Add sorting
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }

    // Add stock filter
    if (filters.inStock) {
      params.append('inStock', 'true');
    }

    return params;
  };

  const fetchProducts = useCallback(async (
    page: number,
    append: boolean = false
  ) => {
    setLoading(true);
    
    try {
      const params = buildQueryParams(page);
      const url = `/api/shopowner/products?${params}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await res.json();
      
      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      setCurrentPage(data.pagination.currentPage);
      setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, filters]);

  // Fetch when filters change
  useEffect(() => {
    fetchProducts(1, false);
  }, [filters]);

  // Filter actions
  const searchProducts = async (term: string) => {
    setFilters(prev => ({ 
      ...prev, 
      search: term,
    }));
  };

  const toggleCategory = async (categoryId: string) => {
    setFilters(prev => {
      const isSelected = prev.categories.includes(categoryId);
      return {
        ...prev,
        categories: isSelected 
          ? prev.categories.filter(id => id !== categoryId)
          : [...prev.categories, categoryId]
      };
    });
  };

  const setPriceRange = async (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max }
    }));
  };

  const clearPriceRange = async () => {
    setFilters(prev => ({
      ...prev,
      priceRange: null
    }));
  };

  const setSortBy = async (option: SortOption) => {
    setFilters(prev => ({
      ...prev,
      sortBy: option
    }));
  };

  const toggleInStock = async () => {
    setFilters(prev => ({
      ...prev,
      inStock: !prev.inStock
    }));
  };

  const clearFilters = async () => {
    setFilters({
      search: '',
      categories: [],
      priceRange: null,
      sortBy: 'newest',
      inStock: false,
    });
  };

  const loadMoreProducts = async () => {
    if (loading || !hasMore) return;
    await fetchProducts(currentPage + 1, true);
  };

  const resetProducts = () => {
    setProducts(initialProducts);
    setCurrentPage(1);
    setFilters({
      search: '',
      categories: [],
      priceRange: null,
      sortBy: 'newest',
      inStock: false,
    });
    setHasMore(initialProducts.length < (initialTotalCount || 0));
  };

  return {
    products,
    loading,
    totalCount,
    hasMore,
    activeFilters: filters,
    
    // Filter actions
    searchProducts,
    toggleCategory,
    setPriceRange,
    clearPriceRange,
    setSortBy,
    toggleInStock,
    clearFilters,
    loadMoreProducts,
    resetProducts,
  };
}