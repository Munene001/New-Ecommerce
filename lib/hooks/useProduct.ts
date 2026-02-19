// app/lib/hooks/useProducts.ts
'use client';

import { useState, useCallback } from 'react';

interface Product {
  product_id: number;
  product_name: string;
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  product_slug: string;
  primary_image: string | null;
  description?: string;
  created_at?: string;
}

interface UseProductsReturn {
  // State
  products: Product[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  
  // Actions
  searchProducts: (term: string) => Promise<void>;
  filterByCategory: (categoryId: string) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  resetProducts: () => void;
  refreshProducts: () => Promise<void>; // Add this
}

export function useProducts(
  initialProducts: Product[],
  shopId: string,
  initialTotalPages: number = 1
): UseProductsReturn {
  // State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Track current filters
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');

  // Computed
  const hasMore = currentPage < totalPages;

  // Core fetch function
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
      
      // Update state
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

  // Refresh - fetch current page with current filters
  const refreshProducts = useCallback(async () => {
    await fetchProducts(currentPage, currentSearch, currentCategory, false);
  }, [currentPage, currentSearch, currentCategory, fetchProducts]);

  // Search - replaces products
  const searchProducts = async (term: string) => {
    setCurrentSearch(term);
    setCurrentCategory('');
    await fetchProducts(1, term, undefined, false);
  };

  // Filter by category - replaces products
  const filterByCategory = async (categoryId: string) => {
    setCurrentCategory(categoryId);
    setCurrentSearch('');
    await fetchProducts(1, undefined, categoryId, false);
  };

  // Traditional pagination - replaces products
  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages) return;
    await fetchProducts(page, currentSearch, currentCategory, false);
  };

  // Infinite scroll - appends products
  const loadMoreProducts = async () => {
    if (loading || !hasMore) return;
    await fetchProducts(currentPage + 1, currentSearch, currentCategory, true);
  };

  // Reset to initial state
  const resetProducts = () => {
    setProducts(initialProducts);
    setCurrentPage(1);
    setCurrentSearch('');
    setCurrentCategory('');
  };

  return {
    // State
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
    refreshProducts 
  };
}