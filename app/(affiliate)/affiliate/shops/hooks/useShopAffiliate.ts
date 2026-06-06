import { useState, useCallback, useEffect } from 'react';

interface Shop {
  shop_id: number;
  shop_name: string;
  shop_slug: string;
  shop_type: string;
  created_at: string;
  tenant_id: number;
  tenant_name: string;
  product_count: number;
}

interface ShopStats {
  most_popular_type: string;
  most_popular_count: number;
  least_popular_type: string;
  least_popular_count: number;
  total_shops: number;
  recently_created: number;
}

export function useAffiliateShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<ShopStats>({
    most_popular_type: 'N/A',
    most_popular_count: 0,
    least_popular_type: 'N/A',
    least_popular_count: 0,
    total_shops: 0,
    recently_created: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentTenant, setCurrentTenant] = useState('');
  const [currentShopType, setCurrentShopType] = useState('');

  const fetchShops = useCallback(
    async (page: number, search?: string, tenantId?: string, shopType?: string, append: boolean = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(search && { search }),
          ...(tenantId && { tenantId }),
          ...(shopType && { shopType }),
        });

        const res = await fetch(`/api/affiliate/shops?${params}`);
        if (!res.ok) throw new Error('Failed to fetch shops');
        const data = await res.json();

        const newShops = append ? [...shops, ...data.shops] : data.shops;
        setShops(newShops);
        setStats(data.stats);
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [shops]
  );

  const searchShops = async (term: string) => {
    setCurrentSearch(term);
    setCurrentTenant('');
    setCurrentShopType('');
    await fetchShops(1, term, undefined, undefined, false);
  };

  const filterByTenant = async (tenantId: string) => {
    setCurrentTenant(tenantId);
    setCurrentSearch('');
    setCurrentShopType('');
    await fetchShops(1, undefined, tenantId, undefined, false);
  };

  const filterByShopType = async (shopType: string) => {
    setCurrentShopType(shopType);
    setCurrentSearch('');
    setCurrentTenant('');
    await fetchShops(1, undefined, undefined, shopType, false);
  };

  const loadMore = async () => {
    if (loading || currentPage >= totalPages) return;
    await fetchShops(currentPage + 1, currentSearch, currentTenant, currentShopType, true);
  };

  const resetFilters = () => {
    setCurrentSearch('');
    setCurrentTenant('');
    setCurrentShopType('');
    fetchShops(1, '', '', '', false);
  };

  // Initial load
  useEffect(() => {
    fetchShops(1, '', '', '', false);
  }, []);

  return {
    shops,
    stats,
    loading,
    hasMore,
    searchShops,
    filterByTenant,
    filterByShopType,
    loadMore,
    resetFilters,
  };
}