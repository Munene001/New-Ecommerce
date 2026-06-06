// app/affiliate/tenants/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAffiliateTenants } from './hooks/useAffliate';
import TenantStatsCards from '@/app/(admin)/view/tenants/components/tenantCards';
import TenantsTable from '@/app/(admin)/view/tenants/components/tenantTable';
import Button from '@/app/components/ui/button';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';

export default function AffiliateTenantsPage() {
  const router = useRouter();
  const {
    tenants,
    stats,
    loading,
    hasMore,
    searchTenants,
    filterByStatus,
    loadMore,
    resetFilters,
  } = useAffiliateTenants();

  const [searchInput, setSearchInput] = useState('');
  const [statusSelect, setStatusSelect] = useState('');

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
    setSearchInput('');
    setStatusSelect('');
    resetFilters();
  };

  const hasActiveFilters = searchInput !== '' || statusSelect !== '';

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins]">
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

      <TenantsTable
        tenants={tenants}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMore}
        onRowClick={(tenantId) => router.push(`/affiliate/tenants/${tenantId}`)}
      />
    </div>
  );
}