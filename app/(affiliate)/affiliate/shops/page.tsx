'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAffiliateShops } from './hooks/useShopAffiliate';
import ShopStatsCards from '@/app/(admin)/view/shops/components/shopCards';
import ShopsTable from '@/app/(admin)/view/shops/components/shopsTables';
import Button from '@/app/components/ui/button';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';

export default function AffiliateShopsPage() {
  const router = useRouter();
  const {
    shops,
    stats,
    loading,
    hasMore,
    searchShops,
    filterByTenant,
    filterByShopType,
    loadMore,
    resetFilters,
  } = useAffiliateShops();

  const [searchInput, setSearchInput] = useState('');
  const [tenantSelect, setTenantSelect] = useState('');
  const [shopTypeSelect, setShopTypeSelect] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchShops(value);
  };

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTenantSelect(value);
    filterByTenant(value);
  };

  const handleShopTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setShopTypeSelect(value);
    filterByShopType(value);
  };

  const handleReset = () => {
    setSearchInput('');
    setTenantSelect('');
    setShopTypeSelect('');
    resetFilters();
  };

  const hasActiveFilters = searchInput !== '' || tenantSelect !== '' || shopTypeSelect !== '';

  // Unique tenants for filter dropdown (from current shops list)
  const uniqueTenants = Array.from(
    new Map(shops.map(shop => [shop.tenant_id, shop.tenant_name])).entries()
  ).map(([id, name]) => ({ tenant_id: id, tenant_name: name }));

  const shopTypes = ['retail', 'clothing', 'pharmacy', 'bookshop'];

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins]">
      <ShopStatsCards
        mostPopularType={stats.most_popular_type}
        mostPopularCount={stats.most_popular_count}
        leastPopularType={stats.least_popular_type}
        leastPopularCount={stats.least_popular_count}
        totalShops={stats.total_shops}
        recentlyCreated={stats.recently_created}
        currentShown={shops.length}
      />

      <div className="flex gap-4 my-4 overflow-x-auto pb-2 md:pb-0 flex-wrap">
        <div className="flex-1 min-w-[280px] md:min-w-0 relative">
          <input
            type="text"
            placeholder="Search shops by name..."
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
          value={tenantSelect}
          onChange={handleTenantChange}
          className="w-48 md:w-64 border border-black h-[59px] text-black px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark flex-shrink-0"
        >
          <option value="">All Tenants</option>
          {uniqueTenants.map((tenant) => (
            <option key={tenant.tenant_id} value={tenant.tenant_id}>
              {tenant.tenant_name}
            </option>
          ))}
        </select>

        <select
          value={shopTypeSelect}
          onChange={handleShopTypeChange}
          className="w-48 md:w-64 border border-black h-[59px] text-black px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark flex-shrink-0"
        >
          <option value="">All Shop Types</option>
          {shopTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
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

      <ShopsTable
        shops={shops}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMore}
        onRowClick={(shopId) => router.push(`/affiliate/shops/${shopId}/analytics`)}
      />
    </div>
  );
}