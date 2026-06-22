'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '../types/product';

// ✅ Added 'random' to SortOption
type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'random';
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
  shopSlug: string | null | undefined;
  initialTotalCount?: number;
  initialSearch?: string;
  initialCategories?: string[];
  initialPriceRange?: PriceRange;
  initialSortBy?: SortOption;
  initialInStock?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useShopProducts({
  initialProducts,
  shopSlug,
  initialTotalCount,
  initialSearch = '',
  initialCategories = [],
  initialPriceRange = null,
  initialSortBy = 'random', // ✅ changed default to 'random'
  initialInStock = false,
}: UseShopProductsProps) {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount || 0);
  const [hasMore, setHasMore] = useState(initialProducts.length < (initialTotalCount || 0));

  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [filters, setFilters] = useState<ShopFilters>({
    search: initialSearch,
    categories: initialCategories,
    priceRange: initialPriceRange,
    sortBy: initialSortBy,
    inStock: initialInStock,
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Sync filters to URL
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
    // ✅ Only add sortBy if it's NOT the default ('random')
    if (filters.sortBy !== 'random') params.set('sortBy', filters.sortBy);
    if (filters.inStock) params.set('inStock', 'true');

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const fetchProducts = useCallback(async (page: number, append: boolean = false) => {
    if (!shopSlug) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.categories.length) params.append('categories', filters.categories.join(','));
      if (filters.priceRange) {
        params.append('minPrice', filters.priceRange.min.toString());
        params.append('maxPrice', filters.priceRange.max.toString());
      }
      // ✅ Always include sortBy (even 'random') – the API will handle it
      params.append('sortBy', filters.sortBy);
      if (filters.inStock) params.append('inStock', 'true');

      const url = `/api/shops/${shopSlug}/products?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      setCurrentPage(data.pagination.currentPage);
      setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [shopSlug, filters]);

  useEffect(() => {
    if (shopSlug) {
      fetchProducts(1, false);
    }
  }, [filters, fetchProducts, shopSlug]);

  // --- Public actions ---
  const searchProducts = async (term: string) => setSearchInput(term);

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
    setSearchInput('');
    setFilters({
      search: '',
      categories: [],
      priceRange: null,
      sortBy: 'random', // ✅ default to random
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
    setSearchInput('');
    setFilters({
      search: '',
      categories: [],
      priceRange: null,
      sortBy: 'random', // ✅ default to random
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
    searchInput,
    setSearchInput,
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