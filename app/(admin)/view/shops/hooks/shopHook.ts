// lib/hooks/useShops.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface Shop {
  shop_id: number;
  shop_name: string;
  shop_slug: string;
  shop_type: string;
  created_at: string;
  tenant_id: number;
  tenant_name: string;
  tenant_status: string;
  owner_email: string;
  owner_name: string;
  product_count: number;
}

interface ShopStats {
  most_popular_type: string;
  most_popular_count: number;
  least_popular_type: string;
  least_popular_count: number;
  empty_shops: number;
  recently_created: number;
}

interface UseShopsReturn {
  shops: Shop[];
  stats: ShopStats;
  loading: boolean;
  hasMore: boolean;
  searchShops: (term: string) => Promise<void>;
  filterByTenant: (tenantId: string) => Promise<void>;
  filterByShopType: (shopType: string) => Promise<void>;
  loadMoreShops: () => Promise<void>;
  refreshShops: () => Promise<void>;
  resetFilters: () => void;
}

export function useShops(
  initialShops: Shop[],
  initialStats: ShopStats
): UseShopsReturn {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [stats, setStats] = useState<ShopStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentTenant, setCurrentTenant] = useState('');
  const [currentShopType, setCurrentShopType] = useState('');
  
  const initialFetchDone = useRef(true);

  const fetchShops = useCallback(async (page: number, search?: string, tenantId?: string, shopType?: string, append: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(tenantId && { tenantId }),
        ...(shopType && { shopType })
      });

      const res = await fetch(`/api/admin/shops?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch shops');
      }

      const data = await res.json();
      
      const newShops = append ? [...shops, ...data.shops] : data.shops;
      setShops(newShops);
      
      if (data.stats) {
        setStats(data.stats);
      }
      
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  }, [shops]);

  const refreshShops = useCallback(async () => {
    await fetchShops(1, currentSearch, currentTenant, currentShopType, false);
  }, [currentSearch, currentTenant, currentShopType, fetchShops]);

  const searchShops = async (term: string) => {
    setCurrentSearch(term);
    setCurrentTenant('');
    setCurrentShopType('');
    setCurrentPage(1);
    await fetchShops(1, term, undefined, undefined, false);
  };

  const filterByTenant = async (tenantId: string) => {
    setCurrentTenant(tenantId);
    setCurrentSearch('');
    setCurrentShopType('');
    setCurrentPage(1);
    await fetchShops(1, undefined, tenantId, undefined, false);
  };

  const filterByShopType = async (shopType: string) => {
    setCurrentShopType(shopType);
    setCurrentSearch('');
    setCurrentTenant('');
    setCurrentPage(1);
    await fetchShops(1, undefined, undefined, shopType, false);
  };

  const loadMoreShops = async () => {
    if (loading || currentPage >= totalPages) return;
    await fetchShops(currentPage + 1, currentSearch, currentTenant, currentShopType, true);
  };

  const resetFilters = () => {
    setCurrentSearch('');
    setCurrentTenant('');
    setCurrentShopType('');
    setCurrentPage(1);
    fetchShops(1, '', '', '', false);
  };

  const hasMore = currentPage < totalPages;

  useEffect(() => {
    if (initialFetchDone.current) {
      initialFetchDone.current = false;
    }
  }, []);

  return {
    shops,
    stats,
    loading,
    hasMore,
    searchShops,
    filterByTenant,
    filterByShopType,
    loadMoreShops,
    refreshShops,
    resetFilters,
  };
}