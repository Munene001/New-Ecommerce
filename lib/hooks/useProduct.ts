// app/lib/hooks/useProducts.ts
'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Product {
  product_id: number;
  product_name: string;
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  product_slug: string;
  primary_image?: string | null;
  images?: {
    image_id: number;
    image_path: string;
    is_primary: boolean;
    created_at: string;
  }[];
  description?: string;
  created_at?: string;
}

interface UseProductsReturn {
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

export function useProducts(
  initialProducts: Product[],
  shopId: string,
  initialTotalCount?: number,
  initialTotalPages: number = 1,
  shouldFetchOnMount: boolean = true
): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount || 0);
  
  const [currentSearch, setCurrentSearch] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');

  // Sync with initial products when provided (for shop page)
  useEffect(() => {
    if (products.length === 0 && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts, products.length]);

  // Fetch initial data on mount for dashboard (when shouldFetchOnMount is true)
  useEffect(() => {
    if (shopId && shouldFetchOnMount) {
      fetchProducts(1, currentSearch, currentCategory, false);
    }
  }, [shopId, shouldFetchOnMount]);

  const hasMore = currentPage < totalPages;

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
    setProducts(initialProducts);
    setCurrentPage(1);
    setCurrentSearch('');
    setCurrentCategory('');
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
    refreshProducts 
  };
}