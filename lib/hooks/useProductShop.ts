// lib/hooks/useShopProducts.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '../types/product';

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';
type PriceRange = { min: number; max: number } | null;

interface ShopFilters {
  search: string;
  categories: string[];
  priceRange: PriceRange;
  sortBy: SortOption;
  inStock: boolean;
}

interface UseShopProductsProps {
  initialProducts: Product[];
  shopId: string;
  initialTotalCount?: number;
  initialSearch?: string;
  initialCategories?: string[];
  initialPriceRange?: PriceRange;
  initialSortBy?: SortOption;
  initialInStock?: boolean;
}

export function useShopProducts({
  initialProducts,
  shopId,
  initialTotalCount,
  initialSearch = '',
  initialCategories = [],
  initialPriceRange = null,
  initialSortBy = 'newest',
  initialInStock = false,
}: UseShopProductsProps) {
  console.log('🔄 useShopProducts hook render, filters:', {
    search: initialSearch,
    categories: initialCategories,
    priceRange: initialPriceRange,
    sortBy: initialSortBy,
    inStock: initialInStock,
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [hasMore, setHasMore] = useState(initialProducts.length < (initialTotalCount || 0));

  const [filters, setFilters] = useState<ShopFilters>({
    search: initialSearch,
    categories: initialCategories,
    priceRange: initialPriceRange,
    sortBy: initialSortBy,
    inStock: initialInStock,
  });

  const isFirstRender = useRef(true);

  // Sync filters to URL on change (shallow)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.categories.length) params.set('categories', filters.categories.join(','));
    if (filters.priceRange) {
      params.set('minPrice', filters.priceRange.min.toString());
      params.set('maxPrice', filters.priceRange.max.toString());
    }
    if (filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
    if (filters.inStock) params.set('inStock', 'true');

    console.log('🌐 Syncing filters to URL:', params.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const buildQueryParams = (page: number) => {
    const params = new URLSearchParams({
      shopId,
      page: page.toString(),
      limit: '20',
    });

    if (filters.search) params.append('search', filters.search);
    if (filters.categories.length) params.append('categories', filters.categories.join(','));
    if (filters.priceRange) {
      params.append('minPrice', filters.priceRange.min.toString());
      params.append('maxPrice', filters.priceRange.max.toString());
    }
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.inStock) params.append('inStock', 'true');

    return params;
  };

  const fetchProducts = useCallback(async (page: number, append: boolean = false) => {
    console.log('📦 fetchProducts called - page:', page, 'append:', append, 'current filters:', filters);
    setLoading(true);
    try {
      const params = buildQueryParams(page);
      console.log('🔗 Fetching with params:', params.toString());
      const res = await fetch(`/api/shopowner/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      console.log('✅ Fetch response received, products count:', data.products?.length);
      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      setCurrentPage(data.pagination.currentPage);
      setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, filters]); // filters included so the callback updates when filters change

  // Fetch when filters change
  useEffect(() => {
    console.log('🎯 Filters changed effect triggered, filters:', filters);
    fetchProducts(1, false);
  }, [filters, fetchProducts]);

  const searchProducts = async (term: string) => {
    console.log('🔍 searchProducts called with term:', term);
    setFilters(prev => ({ ...prev, search: term }));
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
    setFilters(prev => ({ ...prev, priceRange: { min, max } }));
  };

  const clearPriceRange = async () => {
    setFilters(prev => ({ ...prev, priceRange: null }));
  };

  const setSortBy = async (option: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy: option }));
  };

  const toggleInStock = async () => {
    setFilters(prev => ({ ...prev, inStock: !prev.inStock }));
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