// app/admin/tenants/components/tenantsTable.tsx
'use client';

import { useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

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

interface TenantsTableProps {
  tenants: Tenant[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onRowClick?: (tenantId: number) => void; // NEW: optional custom handler
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50/5 transition-colors min-w-full">
    <div className="w-[15%] px-4">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
    </div>
    <div className="w-[20%]">
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>
    <div className="w-[25%]">
      <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
    </div>
    <div className="w-[15%]">
      <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
    </div>
    <div className="w-[15%]">
      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
    </div>
    <div className="w-[10%]">
      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
  </div>
);

const getStatusColor = (status: string) => {
  switch(status) {
    case 'active':
      return "bg-green-500/10 text-green-600";
    case 'free_trial':
      return "bg-blue-500/10 text-blue-600";
    case 'expired':
      return "bg-red-500/10 text-red-600";
    case 'suspended':
      return "bg-orange-500/10 text-orange-600";
    default:
      return "bg-gray-500/10 text-gray-600";
  }
};

const formatStatus = (status: string) => {
  switch(status) {
    case 'free_trial':
      return 'Free Trial';
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    case 'suspended':
      return 'Suspended';
    default:
      return status;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function TenantsTable({
  tenants,
  loading,
  hasMore,
  loadMore,
  onRowClick,
}: TenantsTableProps) {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const lastTenantRef = useCallback(
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

  const handleRowClick = (tenantId: number) => {
    if (onRowClick) {
      onRowClick(tenantId);
    } else {
      router.push(`/view/tenants/${tenantId}`);
    }
  };

  return (
    <div className="md:w-full relative">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] md:min-w-full">
          {/* Table header */}
          <div className="flex flex-row border-b border-[#294248] h-[52px] items-center text-black font-medium text-sm bg-gray-50">
            <div className="w-[20%] px-4">Business Name</div>
            <div className="w-[15%]">Owner</div>
            <div className="w-[35%]">Email</div>
            <div className="w-[10%]">Status</div>
            <div className="w-[15%]">Created</div>
            <div className="w-[5%]">Shops</div>
          </div>

          {/* Table content */}
          {loading && tenants.length === 0 ? (
            <div className="mt-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : tenants.length > 0 ? (
            <div className="mt-2">
              {tenants.map((tenant, index) => (
                <div
                  key={tenant.tenant_id}
                  ref={index === tenants.length - 1 ? lastTenantRef : null}
                  onClick={() => handleRowClick(tenant.tenant_id)}
                  className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-[20%] px-4">
                    <div className="font-medium text-gray-900">
                      {tenant.business_name}
                    </div>
                  </div>

                  <div className="w-[15%]">
                    <div className="text-gray-900">
                      {tenant.owner_name}
                    </div>
                  </div>

                  <div className="w-[35%]">
                    <div className="text-black">
                      {tenant.owner_email}
                    </div>
                  </div>

                  <div className="w-[10%]">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        tenant.account_status
                      )}`}
                    >
                      {formatStatus(tenant.account_status)}
                    </span>
                  </div>

                  <div className="w-[15%] text-gray-900 text-sm">
                    {formatDate(tenant.created_at)}
                  </div>

                  <div className="w-[5%]">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Icon icon="mdi:store" className="w-4 h-4" />
                      <span>{tenant.total_shops}</span>
                    </div>
                  </div>
                </div>
              ))}

              {loading && tenants.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin w-6 h-6 text-magenta-dark"
                  />
                </div>
              )}

              {!hasMore && tenants.length > 0 && (
                <div className="text-center py-4 text-gray-900">
                  No more tenants to load
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <Icon
                icon="mdi:building"
                className="w-16 h-16 mb-4 text-gray-400"
              />
              <p className="text-lg font-medium">No tenants found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}