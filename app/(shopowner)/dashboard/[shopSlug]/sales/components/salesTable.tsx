// app/(dashboard)/[shopSlug]/sales/components/SalesTable.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

interface SalesTableProps {
  orders: Order[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onStatusUpdate: (orderId: number, status: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  shopSlug: string;
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-gray-300 h-[72px] items-center w-full">
    <div className="w-[18%] px-4"><div className="h-4 bg-gray-300 rounded w-28 animate-pulse"></div></div>
    <div className="w-[22%] px-4"><div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div></div>
    <div className="w-[15%] px-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-6 bg-gray-300 rounded-full w-20 animate-pulse"></div></div>
    <div className="w-[15%] px-4"><div className="h-6 bg-gray-300 rounded-full w-24 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></div>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function SalesTable({
  orders,
  loading,
  hasMore,
  loadMore,
  onStatusUpdate,
  onRefresh,
  shopSlug,
}: SalesTableProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastOrderRef = useCallback(
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

  const handleRowClick = (orderId: number) => {
    router.push(`/dashboard/${shopSlug}/orders/${orderId}`);
  };

  const handleStatusChange = async (orderId: number, newStatus: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (updating) return;
    setUpdating(true);
    
    const success = await onStatusUpdate(orderId, newStatus);
    if (success) {
      await onRefresh();
    }
    setUpdating(false);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="w-full relative">
      <div className="w-full overflow-x-auto">
        <div className="w-full">
          {/* Table header */}
          <div className="flex flex-row border-b border-gray-400 h-[52px] items-center text-gray-700 font-semibold text-sm bg-gray-100 w-full">
            <div className="w-[18%] px-4">Sales #</div>
            <div className="w-[22%] px-4">Customer</div>
            <div className="w-[15%] px-4">Phone</div>
            <div className="w-[10%] px-4">Amount</div>
            <div className="w-[10%] px-4">Payment</div>
            <div className="w-[15%] px-4">Delivery Status</div>
            <div className="w-[10%] px-4">Date</div>
          </div>

          {/* Table content */}
          {loading && orders.length === 0 ? (
            <div className="mt-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : orders.length > 0 ? (
            <div className="mt-2">
              {orders.map((order, index) => (
                <div
                  key={order.order_id}
                  ref={index === orders.length - 1 ? lastOrderRef : null}
                  onClick={() => handleRowClick(order.order_id)}
                  className="flex flex-row border-b border-gray-300 min-h-[72px] items-center hover:bg-gray-100 transition-colors cursor-pointer w-full"
                >
                  <div className="w-[18%] px-4">
                    <div className="font-semibold text-gray-800 text-sm">
                      {order.order_number}
                    </div>
                  </div>

                  <div className="w-[22%] px-4">
                    <div className="text-black text-sm font-medium">
                      {order.customer_name}
                    </div>
                    <div className="text-gray-700 text-xs truncate">
                      {order.customer_email}
                    </div>
                  </div>

                  <div className="w-[15%] px-4">
                    <div className="text-black text-sm">
                      {order.customer_phone}
                    </div>
                    <div className="text-gray-700 text-xs">
                      {order.customer_city}
                    </div>
                  </div>

                  <div className="w-[10%] px-4">
                    <div className="text-gray-800 font-semibold text-sm">
                      KSh {order.subtotal.toLocaleString()}
                    </div>
                    <div className="text-gray-500 text-xs capitalize">
                      {order.payment_method === 'cash_on_delivery' ? 'COD' : order.payment_method}
                    </div>
                  </div>

                  <div className="w-[10%] px-4">
                    <div className="text-xs px-2 py-1 rounded-full border font-medium bg-emerald-100 text-emerald-800 border-emerald-300">
                      {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </div>
                  </div>

                  <div className="w-[15%] px-4">
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order.order_id, e.target.value, e)}
                        disabled={updating}
                        className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${getStatusColor(order.order_status)}`}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-gray-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="w-[10%] px-4">
                    <div className="text-gray-600 text-sm">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>
              ))}

              {loading && orders.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-amber-700" />
                </div>
              )}

              {!hasMore && orders.length > 0 && (
                <div className="text-center py-4 text-gray-600 text-sm">
                  No more orders to load
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-600">
              <Icon icon="mdi:package-variant" className="w-16 h-16 mb-4 text-gray-500" />
              <p className="text-lg font-medium">No sales found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}