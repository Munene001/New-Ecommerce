// app/admin/shops/components/shopsTable.tsx
'use client';

import { useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

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

interface ShopsTableProps {
  shops: Shop[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onRowClick?: (shopId: number) => void; // optional custom handler
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50/5 transition-colors min-w-full">
    <div className="w-[15%] px-4">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
    </div>
    <div className="w-[15%]">
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>
    <div className="w-[15%]">
      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
    </div>
    <div className="w-[35%]">
      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
    </div>
    <div className="w-[10%]">
      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
    <div className="w-[10%]">
      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
    </div>
  </div>
);

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShopType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getDashboardUrl = (shopSlug: string) => {
  return `/dashboard/${shopSlug}`;
};

export default function ShopsTable({
  shops,
  loading,
  hasMore,
  loadMore,
  onRowClick,
}: ShopsTableProps) {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const lastShopRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const handleRowClick = (shopId: number) => {
    if (onRowClick) {
      onRowClick(shopId);
    } else {
      // Default admin navigation
      router.push(`/view/shops/${shopId}`);
    }
  };

  return (
    <div className="md:w-full relative">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] md:min-w-full">
          {/* Table header */}
          <div className="flex flex-row border-b border-[#294248] h-[52px] items-center text-black font-medium text-sm bg-gray-50">
            <div className="w-[15%] px-4">Shop Name</div>
            <div className="w-[15%]">Shop Type</div>
            <div className="w-[15%]">Tenant</div>
            <div className="w-[35%]">Dashboard URL</div>
            <div className="w-[10%]">Products</div>
            <div className="w-[10%]">Created</div>
          </div>

          {/* Table content */}
          {loading && shops.length === 0 ? (
            <div className="mt-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : shops.length > 0 ? (
            <div className="mt-2">
              {shops.map((shop, index) => (
                <div
                  key={shop.shop_id}
                  ref={index === shops.length - 1 ? lastShopRef : null}
                  onClick={() => handleRowClick(shop.shop_id)}
                  className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-[15%] px-4">
                    <div className="font-medium text-gray-900">
                      {shop.shop_name}
                    </div>
                  </div>

                  <div className="w-[15%]">
                    <div className="text-gray-900">
                      {formatShopType(shop.shop_type)}
                    </div>
                  </div>

                  <div className="w-[15%]">
                    <div className="text-gray-900">
                      {shop.tenant_name}
                    </div>
                  </div>

                  <div className="w-[35%]">
                    <a
                      href={getDashboardUrl(shop.shop_slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center gap-1"
                    >
                      {getDashboardUrl(shop.shop_slug)}
                      <Icon icon="mdi:open-in-new" className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="w-[10%] flex items-center">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Icon icon="mdi:package-variant" className="w-4 h-4" />
                      <span>{shop.product_count}</span>
                    </div>
                  </div>

                  <div className="w-[10%] text-gray-900 text-sm">
                    {formatDate(shop.created_at)}
                  </div>
                </div>
              ))}

              {loading && shops.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin w-6 h-6 text-magenta-dark"
                  />
                </div>
              )}

              {!hasMore && shops.length > 0 && (
                <div className="text-center py-4 text-gray-900">
                  No more shops to load
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <Icon
                icon="mdi:store"
                className="w-16 h-16 mb-4 text-gray-400"
              />
              <p className="text-lg font-medium">No shops found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}