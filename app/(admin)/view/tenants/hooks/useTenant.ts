// lib/hooks/useTenants.ts
import { useState, useCallback, useEffect, useRef } from 'react';

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

interface UseTenantsReturn {
  tenants: Tenant[];
  stats: TenantStats;
  loading: boolean;
  hasMore: boolean;
  searchTenants: (term: string) => Promise<void>;
  filterByStatus: (status: string) => Promise<void>;
  loadMoreTenants: () => Promise<void>;
  changeStatus: (tenantId: number, newStatus: string) => Promise<void>;
  updateTenant: (tenantId: number, data: any) => Promise<void>;
  deleteTenant: (tenantId: number) => Promise<void>;
  refreshTenants: () => Promise<void>;
  resetFilters: () => void;
}

export function useTenants(
  initialTenants: Tenant[],
  initialStats: TenantStats
): UseTenantsReturn {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [stats, setStats] = useState<TenantStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  
  const initialFetchDone = useRef(true);

  const fetchTenants = useCallback(async (page: number, search?: string, status?: string, append: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status })
      });

      const res = await fetch(`/api/admin/tenants?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch tenants');
      }

      const data = await res.json();
      
      const newTenants = append ? [...tenants, ...data.tenants] : data.tenants;
      setTenants(newTenants);
      
      if (data.stats) {
        setStats(data.stats);
      }
      
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  }, [tenants]);

  const refreshTenants = useCallback(async () => {
    await fetchTenants(1, currentSearch, currentStatus, false);
  }, [currentSearch, currentStatus, fetchTenants]);

  const searchTenants = async (term: string) => {
    setCurrentSearch(term);
    setCurrentStatus('');
    setCurrentPage(1);
    await fetchTenants(1, term, undefined, false);
  };

  const filterByStatus = async (status: string) => {
    setCurrentStatus(status);
    setCurrentSearch('');
    setCurrentPage(1);
    await fetchTenants(1, undefined, status, false);
  };

  const loadMoreTenants = async () => {
    if (loading || currentPage >= totalPages) return;
    await fetchTenants(currentPage + 1, currentSearch, currentStatus, true);
  };

  const changeStatus = async (tenantId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: newStatus })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update status');
      }

      await refreshTenants();
      
    } catch (error) {
      console.error('Change status error:', error);
      throw error;
    }
  };

  const updateTenant = async (tenantId: number, data: any) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update tenant');
      }

      await refreshTenants();
      
    } catch (error) {
      console.error('Update tenant error:', error);
      throw error;
    }
  };

  const deleteTenant = async (tenantId: number) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete tenant');
      }

      await refreshTenants();
      
    } catch (error) {
      console.error('Delete tenant error:', error);
      throw error;
    }
  };

  const resetFilters = () => {
    setCurrentSearch('');
    setCurrentStatus('');
    setCurrentPage(1);
    fetchTenants(1, '', '', false);
  };

  const hasMore = currentPage < totalPages;

  useEffect(() => {
    if (initialFetchDone.current) {
      initialFetchDone.current = false;
    }
  }, []);

  return {
    tenants,
    stats,
    loading,
    hasMore,
    searchTenants,
    filterByStatus,
    loadMoreTenants,
    changeStatus,
    updateTenant,
    deleteTenant,
    refreshTenants,
    resetFilters,
  };
}