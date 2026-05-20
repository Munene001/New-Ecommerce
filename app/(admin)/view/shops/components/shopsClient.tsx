// app/admin/shops/components/shopsClient.tsx
'use client';

import { useState, useRef, useEffect } from "react";

import ShopStatsCards from "./shopCards";
import ShopsTable from "./shopsTables";
import Button from "@/app/components/ui/button";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";
import { useShops } from "../hooks/shopHook";

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
  total_shops: number;
  recently_created: number;
}

interface ShopsClientProps {
  initialShops: Shop[];
  initialStats: ShopStats;
}

export default function ShopsClient({
  initialShops,
  initialStats,
}: ShopsClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [tenantSelect, setTenantSelect] = useState("");
  const [shopTypeSelect, setShopTypeSelect] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
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
  } = useShops(initialShops, initialStats);

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
    setSearchInput("");
    setTenantSelect("");
    setShopTypeSelect("");
    setMessage(null);
    resetFilters();
  };

  const hasActiveFilters = searchInput !== "" || tenantSelect !== "" || shopTypeSelect !== "";

  // Get unique tenants for filter dropdown
  const uniqueTenants = Array.from(new Map(shops.map(shop => [shop.tenant_id, shop.tenant_name])).entries())
    .map(([id, name]) => ({ tenant_id: id, tenant_name: name }));

  const shopTypes = ['retail', 'clothing', 'pharmacy', 'bookshop'];

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
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

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <ShopsTable
        shops={shops}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMoreShops}
      />
    </div>
  );
}