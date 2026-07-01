'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '../types/product';

export interface DashboardStats {
  totalProducts: number;
  totalInventoryItems: number;
  totalInstock: number;
  totalOutOfStock: number;
  totalDrafts: number;
}

interface UseDashboardProductsReturn {
  products: Product[];
  stats: DashboardStats;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  searchProducts: (term: string) => void;
  filterByCategory: (categoryId: string) => void;
  filterByStatus: (status: string) => void;
  goToPage: (page: number) => void;
  loadMoreProducts: () => void;
  resetProducts: () => void;
  refreshProducts: () => void;
}

export function useDashboardProducts(
  shopId: string,
  initialStatus: string = 'published'
): UseDashboardProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalInventoryItems: 0,
    totalInstock: 0,
    totalOutOfStock: 0,
    totalDrafts: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Search & Filter state
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Core Data Fetcher
  const fetchProductsData = useCallback(async (
    page: number,
    search: string,
    category: string,
    status: string,
    append: boolean
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        shopId,
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(category && { category }),
        ...(status && status !== 'all' && { status })
      });

      const res = await fetch(`/api/shopowner/products?${params}`, {
        signal: abortController.signal
      });

      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();

      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      
      if (data.stats) {
        setStats({
          totalProducts: Number(data.stats.totalProducts) || 0,
          totalInventoryItems: Number(data.stats.totalInventoryItems) || 0,
          totalInstock: Number(data.stats.totalInstock) || 0,
          totalOutOfStock: Number(data.stats.totalOutOfStock) || 0,
          totalDrafts: Number(data.stats.totalDrafts) || 0,
        });
      }
      
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Failed to fetch products:', error);
    } finally {
      if (abortControllerRef.current === abortController) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [shopId]);

  // Handle standard background refreshes cleanly (forces page 1 reset safely)
  const refreshProducts = useCallback(() => {
    setCurrentPage(1);
    fetchProductsData(1, currentSearch, currentCategory, currentStatus, false);
  }, [currentSearch, currentCategory, currentStatus, fetchProductsData]);

  // Action Handlers
  const searchProducts = useCallback((term: string) => {
    setCurrentSearch(term);
    setCurrentPage(1);
    setProducts([]); // Flush array to trigger Skeleton rows immediately
    fetchProductsData(1, term, currentCategory, currentStatus, false);
  }, [currentCategory, currentStatus, fetchProductsData]);

  const filterByCategory = useCallback((categoryId: string) => {
    setCurrentCategory(categoryId);
    setCurrentPage(1);
    setProducts([]); // Flush array to trigger Skeleton rows immediately
    fetchProductsData(1, currentSearch, categoryId, currentStatus, false);
  }, [currentSearch, currentStatus, fetchProductsData]);

  const filterByStatus = useCallback((status: string) => {
    setCurrentStatus(status);
    setCurrentPage(1);
    setProducts([]); // Flush array to trigger Skeleton rows immediately
    fetchProductsData(1, currentSearch, currentCategory, status, false);
  }, [currentSearch, currentCategory, fetchProductsData]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setProducts([]); // Flush on manual page turns if needed
    fetchProductsData(page, currentSearch, currentCategory, currentStatus, false);
  }, [totalPages, currentSearch, currentCategory, currentStatus, fetchProductsData]);

  const hasMore = currentPage < totalPages;

  const loadMoreProducts = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    // Note: Do NOT flush products here because we want to append to the end of the scroll list
    fetchProductsData(nextPage, currentSearch, currentCategory, currentStatus, true);
  }, [loading, hasMore, currentPage, currentSearch, currentCategory, currentStatus, fetchProductsData]);

  const resetProducts = useCallback(() => {
    setCurrentSearch('');
    setCurrentCategory('');
    setCurrentStatus('published');
    setCurrentPage(1);
    setProducts([]); // Flush array to reset views cleanly
    fetchProductsData(1, '', '', 'published', false);
  }, [fetchProductsData]);

  // Initial load effect only
  useEffect(() => {
    if (shopId) {
      fetchProductsData(1, currentSearch, currentCategory, currentStatus, false);
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  // Smart Poller: ONLY run background refreshes if user is on page 1
  useEffect(() => {
    if (!shopId || currentPage > 1) return;
    
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
  }, [shopId, currentPage, refreshProducts]);

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
    filterByStatus,
    goToPage,
    loadMoreProducts,
    resetProducts,
    refreshProducts,
  };
}