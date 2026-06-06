// lib/hooks/useAffiliateTenants.ts
import { useState, useCallback, useEffect } from 'react'; // added useEffect

interface Tenant {
  tenant_id: number;
  business_name: string;
  business_slug: string;
  account_status: string;
  created_at: string;
  owner_email: string;
  owner_name: string;
  total_shops: number;
}

interface TenantStats {
  total_tenants: number;
  free_trial: number;
  active: number;
  expired_suspended: number;
}

export function useAffiliateTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats>({
    total_tenants: 0,
    free_trial: 0,
    active: 0,
    expired_suspended: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  const fetchTenants = useCallback(
    async (page: number, search?: string, status?: string, append: boolean = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(search && { search }),
          ...(status && { status }),
        });

        const res = await fetch(`/api/affiliate/tenants?${params}`);
        if (!res.ok) throw new Error('Failed to fetch tenants');
        const data = await res.json();

        const newTenants = append ? [...tenants, ...data.tenants] : data.tenants;
        setTenants(newTenants);
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
    [tenants]
  );

  const searchTenants = async (term: string) => {
    setCurrentSearch(term);
    setCurrentStatus('');
    await fetchTenants(1, term, undefined, false);
  };

  const filterByStatus = async (status: string) => {
    setCurrentStatus(status);
    setCurrentSearch('');
    await fetchTenants(1, undefined, status, false);
  };

  const loadMore = async () => {
    if (loading || currentPage >= totalPages) return;
    await fetchTenants(currentPage + 1, currentSearch, currentStatus, true);
  };

  const resetFilters = () => {
    setCurrentSearch('');
    setCurrentStatus('');
    fetchTenants(1, '', '', false);
  };

  const refresh = useCallback(() => {
    fetchTenants(1, currentSearch, currentStatus, false);
  }, [currentSearch, currentStatus, fetchTenants]);

  // Initial load on mount
  useEffect(() => {
    fetchTenants(1, '', '', false);
  }, []); // empty dependency array ensures it runs once

  return {
    tenants,
    stats,
    loading,
    hasMore,
    searchTenants,
    filterByStatus,
    loadMore,
    resetFilters,
    refresh,
  };
}