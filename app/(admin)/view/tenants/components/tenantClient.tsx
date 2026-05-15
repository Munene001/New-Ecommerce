// app/admin/tenants/components/tenantsClient.tsx
'use client';

import { useState, useRef, useEffect } from "react";
import { useTenants } from "../hooks/useTenant";
import TenantStatsCards from "./tenantCards";
import TenantsTable from "./tenantTable";
import Button from "@/app/components/ui/button";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";

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

interface TenantsClientProps {
  initialTenants: Tenant[];
  initialStats: TenantStats;
}

export default function TenantsClient({
  initialTenants,
  initialStats,
}: TenantsClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [statusSelect, setStatusSelect] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
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
  } = useTenants(initialTenants, initialStats);

  useEffect(() => {
    if (message) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        setMessage(null);
      }, 5000);
      
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchTenants(value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusSelect(value);
    filterByStatus(value);
  };

  const handleReset = () => {
    setSearchInput("");
    setStatusSelect("");
    setMessage(null);
    resetFilters();
  };

  const handleChangeStatus = async (tenantId: number, newStatus: string) => {
    try {
      await changeStatus(tenantId, newStatus);
      setMessage({
        type: 'success',
        text: 'Status updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  const handleUpdateTenant = async (tenantId: number, data: any) => {
    try {
      await updateTenant(tenantId, data);
      setMessage({
        type: 'success',
        text: 'Tenant updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    try {
      await deleteTenant(tenantId);
      setMessage({
        type: 'success',
        text: 'Tenant deleted successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  const hasActiveFilters = searchInput !== "" || statusSelect !== "";

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      <TenantStatsCards
        totalTenants={stats.total_tenants}
        freeTrial={stats.free_trial}
        active={stats.active}
        expiredSuspended={stats.expired_suspended}
        currentShown={tenants.length}
      />

      <div className="flex gap-4 my-4 overflow-x-auto pb-2 md:pb-0">
        <div className="flex-1 min-w-[280px] md:min-w-0 relative">
          <input
            type="text"
            placeholder="Search tenants by business name or email..."
            value={searchInput}
            onChange={handleSearch}
            className="w-full border border-black/70 px-4 h-[59px] pl-13 rounded bg-white text-black placeholder-black/80"
          />
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-three w-7 h-7"
          />
        </div>

        <select
          value={statusSelect}
          onChange={handleStatusChange}
          className="w-48 md:w-64 border border-black h-[59px] text-black px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark flex-shrink-0"
        >
          <option value="">All Status</option>
          <option value="free_trial">Free Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>

        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="secondary"
            className="flex items-center gap-2 px-4 h-[59px] flex-shrink-0"
          >
            <X size={18} />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <TenantsTable
        tenants={tenants}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMoreTenants}
       
      />
    </div>
  );
}