'use client';

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
  delivery_fee: number;
  delivery_zone: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  viewed_by_seller: number;
}

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onUpdateStatus: (orderId: number, status: string) => Promise<boolean>;
  onUpdatePaymentStatus: (orderId: number, status: string) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  shopSlug: string;
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-gray-300 h-[72px] items-center w-full">
    <div className="w-[14%] px-4"><div className="h-4 bg-gray-300 rounded w-28 animate-pulse"></div></div>
    <div className="w-[18%] px-4"><div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div></div>
    <div className="w-[12%] px-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-6 bg-gray-300 rounded-full w-20 animate-pulse"></div></div>
    <div className="w-[14%] px-4"><div className="h-6 bg-gray-300 rounded-full w-20 animate-pulse"></div></div>
    <div className="w-[12%] px-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></div>
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

const getPaymentStatusColor = (status: string) => {
  return status === 'paid' 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
    : 'bg-amber-100 text-amber-800 border-amber-300';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function OrdersTable({
  orders,
  loading,
  hasMore,
  loadMore,
  onUpdateStatus,
  onUpdatePaymentStatus,
  refreshOrders,
  shopSlug,
}: OrdersTableProps) {
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
    
    const success = await onUpdateStatus(orderId, newStatus);
    if (success) {
      await refreshOrders();
    }
    setUpdating(false);
  };

  const handlePaymentStatusChange = async (orderId: number, newStatus: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (updating) return;
    setUpdating(true);
    
    const success = await onUpdatePaymentStatus(orderId, newStatus);
    if (success) {
      await refreshOrders();
    }
    setUpdating(false);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
  ];

  return (
    <div className="w-full relative">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1200px] md:min-w-0">
          {/* Table header - all left-aligned */}
          <div className="flex flex-row border-b border-gray-400 h-[52px] items-center text-gray-700 font-semibold text-sm bg-gray-100 w-full">
            <div className="w-[14%] px-4 text-left">Order #</div>
            <div className="w-[18%] px-4 text-left">Customer</div>
            <div className="w-[14%] px-4 text-left">Phone</div>
            <div className="w-[10%] px-4 text-left">Amount</div>
            <div className="w-[10%] px-4 text-left">Delivery</div>
            <div className="w-[10%] px-4 text-left">Payment</div>
            <div className="w-[14%] px-4 text-left">Status</div>
            <div className="w-[10%] px-4 text-left">Date</div>
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
                  <div className="w-[14%] px-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">
                        {order.order_number}
                      </span>
                      {order.viewed_by_seller === 0 && (
                        <span className="bg-magenta text-white text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-[18%] px-4 text-left">
                    <div className="text-black text-sm font-medium truncate">
                      {order.customer_name}
                    </div>
                    <div className="text-gray-700 text-xs truncate">
                      {order.customer_email}
                    </div>
                  </div>

                  <div className="w-[14%] px-4 text-left">
                    <div className="text-black font-medium text-sm">
                      {order.customer_phone}
                    </div>
                    <div className="text-gray-700 text-xs truncate">
                      {order.customer_city}
                    </div>
                  </div>

                  <div className="w-[10%] px-4 text-left">
                    <div className="text-gray-800 font-semibold text-sm">
                      KSh {order.subtotal.toLocaleString()}
                    </div>
                  </div>

                  <div className="w-[10%] px-4 text-left">
                    <div className="text-black text-sm">
                      {order.delivery_fee > 0 ? (
                        <span>KSh {order.delivery_fee.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-500 text-xs">Free</span>
                      )}
                    </div>
                    {order.delivery_zone && (
                      <div className="text-gray-500 text-xs truncate">
                        {order.delivery_zone}
                      </div>
                    )}
                  </div>

                  <div className="w-[10%] px-4 text-left">
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.payment_status}
                        onChange={(e) => handlePaymentStatusChange(order.order_id, e.target.value, e)}
                        disabled={updating}
                        className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${getPaymentStatusColor(order.payment_status)}`}
                      >
                        {paymentStatusOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-gray-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="w-[14%] px-4 text-left">
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

                  <div className="w-[10%] px-4 text-left">
                    <div className="text-black text-sm">
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
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}