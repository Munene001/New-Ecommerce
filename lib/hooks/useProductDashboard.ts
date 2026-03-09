// lib/hooks/useDashboardProducts.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '../types/product';

interface UseDashboardProductsReturn {
  products: Product[];
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
  initialTotalPages: number = 1
): UseDashboardProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
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
      
      setProducts(prev => append ? [...prev, ...data.products] : data.products);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // Initial fetch - with proper dependencies and mount protection
  useEffect(() => {
    // Only fetch once
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchProducts(1, currentSearch, currentCategory, false);
    }
  }, [fetchProducts, currentSearch, currentCategory]); 

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