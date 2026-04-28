'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '../types/product';

interface DashboardStats {
  totalProducts: number;
  totalDiscounted: number;
  totalInstock: number;
  totalOutOfStock: number;
}

interface UseDashboardProductsReturn {
  products: Product[];
  stats: DashboardStats;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  searchProducts: (term: string) => Promise<void>;
  filterByCategory: (categoryId: string) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  resetProducts: () => void;
  refreshProducts: () => Promise<void>;
}

export function useDashboardProducts(
  shopId: string,
  initialTotalCount?: number,
  initialTotalPages: number = 1,
): UseDashboardProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalDiscounted: 0,
    totalInstock: 0,
    totalOutOfStock: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount || 0);
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');

  const initialFetchDone = useRef(false);

  const fetchProducts = useCallback(async (
    page: number,
    search?: string,
    category?: string,
    append: boolean = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        shopId,
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(category && { category })
      });

      const res = await fetch(`/api/shopowner/products?${params}`);

      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await res.json();

      const newProducts = append ? [...products, ...data.products] : data.products;
      setProducts(newProducts);
      
      // USE API STATS instead of calculating
      if (data.stats) {
        setStats(data.stats);
      }
      
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);

    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, products]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && shopId) {
      initialFetchDone.current = true;
      fetchProducts(1, currentSearch, currentCategory, false);
    }
  }, [fetchProducts, shopId, currentSearch, currentCategory]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!shopId) return;
    
    const interval = setInterval(() => {
      refreshProducts();
    }, 30000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshProducts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shopId]);

  const hasMore = currentPage < totalPages;

  const refreshProducts = useCallback(async () => {
    await fetchProducts(currentPage, currentSearch, currentCategory, false);
  }, [currentPage, currentSearch, currentCategory, fetchProducts]);

  const searchProducts = async (term: string) => {
    setCurrentSearch(term);
    setCurrentCategory('');
    await fetchProducts(1, term, undefined, false);
  };

  const filterByCategory = async (categoryId: string) => {
    setCurrentCategory(categoryId);
    setCurrentSearch('');
    await fetchProducts(1, undefined, categoryId, false);
  };

  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages) return;
    await fetchProducts(page, currentSearch, currentCategory, false);
  };

  const loadMoreProducts = async () => {
    if (loading || !hasMore) return;
    await fetchProducts(currentPage + 1, currentSearch, currentCategory, true);
  };

  const resetProducts = () => {
    setProducts([]);
    setCurrentPage(1);
    setCurrentSearch('');
    setCurrentCategory('');
    initialFetchDone.current = false;
    fetchProducts(1, '', '', false);
  };

  return {
    products,
    stats,
    loading,
    currentPage,
    totalPages,
    totalCount,
    hasMore,
    searchProducts,
    filterByCategory,
    goToPage,
    loadMoreProducts,
    resetProducts,
    refreshProducts,
  };
}