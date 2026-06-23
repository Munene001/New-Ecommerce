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
  
  // Single Source of Truth States
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [appendMode, setAppendMode] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Core Fetch Definition
  const fetchProducts = useCallback(async (
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
        // Note: Make sure your /api/shopowner/products endpoint returns global counts 
        // for data.stats even when status parameter is passed!
        ...(status && status !== 'all' && { status })
      });

      const res = await fetch(`/api/shopowner/products?${params}`, {
        signal: abortController.signal
      });

      if (abortController.signal.aborted) return;
      if (!res.ok) throw new Error('Failed to fetch products');

      const data = await res.json();
      if (abortController.signal.aborted) return;

      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      
      if (data.stats) {
        setStats({
          totalProducts: Number(data.stats.totalProducts) || 0,
          totalInventoryItems: Number(data.stats.totalInventoryItems) || 0,
          totalInstock: Number(data.stats.totalInstock) || 0,
          totalOutOfStock: Number(data.stats.totalOutOfStock) || 0,
          totalDrafts: Number(data.stats.totalDrafts) || 0, // Enforce strict numeric rendering
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

  // 2. Action Handlers
 const refreshProducts = useCallback(() => {
  setAppendMode(false);
  // Force page 1 on background updates so it refreshes the view completely 
  
  fetchProducts(1, currentSearch, currentCategory, currentStatus, false);
}, [currentSearch, currentCategory, currentStatus, fetchProducts]);

  const searchProducts = useCallback((term: string) => {
    setAppendMode(false);
    setCurrentPage(1);
    setCurrentSearch(term);
  }, []);

  const filterByCategory = useCallback((categoryId: string) => {
    setAppendMode(false);
    setCurrentPage(1);
    setCurrentCategory(categoryId);
  }, []);

  const filterByStatus = useCallback((status: string) => {
    setAppendMode(false);
    setCurrentPage(1);
    setCurrentStatus(status);
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setAppendMode(false);
    setCurrentPage(page);
  }, [totalPages]);

  const hasMore = currentPage < totalPages;

  const loadMoreProducts = useCallback(() => {
    if (loading || !hasMore) return;
    setAppendMode(true);
    setCurrentPage(prev => prev + 1);
  }, [loading, hasMore]);

  const resetProducts = useCallback(() => {
    setAppendMode(false);
    setCurrentPage(1);
    setCurrentSearch('');
    setCurrentCategory('');
    setCurrentStatus('published');
  }, []);

  // 3. Master Sync Layer
  useEffect(() => {
    if (!shopId) return;
    fetchProducts(currentPage, currentSearch, currentCategory, currentStatus, appendMode);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [shopId, currentPage, currentSearch, currentCategory, currentStatus, appendMode, fetchProducts]);

  // 4. Background Poller Interval
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
  }, [shopId, refreshProducts]);

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