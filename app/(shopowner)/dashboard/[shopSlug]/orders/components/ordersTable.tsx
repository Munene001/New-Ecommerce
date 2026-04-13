'use client';

import { useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

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

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onUpdateStatus: (orderId: number, status: string) => Promise<boolean>;
  onCancelOrder: (orderId: number) => Promise<boolean>;
  onDeleteOrder: (orderId: number) => Promise<boolean>;
  refreshOrders: () => Promise<void>;
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-gray-200 h-[72px] items-center hover:bg-gray-50 transition-colors">
    <div className="w-[15%] px-4"><div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div></div>
    <div className="w-[20%] px-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></div>
    <div className="w-[15%] px-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div></div>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: string) => {
  return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
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
  onCancelOrder,
  onDeleteOrder,
  refreshOrders,
}: OrdersTableProps) {
  const [actionValues, setActionValues] = useState<Record<number, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; orderId: number | null }>({ show: false, orderId: null });
  const [showCancelModal, setShowCancelModal] = useState<{ show: boolean; orderId: number | null }>({ show: false, orderId: null });
  const [showStatusModal, setShowStatusModal] = useState<{ show: boolean; orderId: number | null; newStatus: string | null }>({ show: false, orderId: null, newStatus: null });
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

  const handleActionChange = async (value: string, orderId: number, currentStatus: string) => {
    setActionValues((prev) => ({ ...prev, [orderId]: "" }));
    
    if (value === "update_status") {
      // This will be handled by a separate status dropdown
      return;
    } else if (value === "cancel") {
      if (currentStatus === 'cancelled') return;
      setShowCancelModal({ show: true, orderId });
    } else if (value === "delete") {
      setShowDeleteModal({ show: true, orderId });
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (updating) return;
    setUpdating(true);
    
    const success = await onUpdateStatus(orderId, newStatus);
    if (success) {
      await refreshOrders();
    }
    setUpdating(false);
  };

  const handleCancelConfirm = async () => {
    if (!showCancelModal.orderId || updating) return;
    setUpdating(true);
    
    const success = await onCancelOrder(showCancelModal.orderId);
    if (success) {
      await refreshOrders();
    }
    setShowCancelModal({ show: false, orderId: null });
    setUpdating(false);
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteModal.orderId || updating) return;
    setUpdating(true);
    
    const success = await onDeleteOrder(showDeleteModal.orderId);
    if (success) {
      await refreshOrders();
    }
    setShowDeleteModal({ show: false, orderId: null });
    setUpdating(false);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="md:w-full relative">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1000px] md:min-w-full">
          {/* Table header */}
          <div className="flex flex-row border-b border-gray-200 h-[52px] items-center text-gray-500 font-medium text-sm bg-gray-50">
            <div className="w-[15%] px-4">Order #</div>
            <div className="w-[20%] px-4">Customer</div>
            <div className="w-[15%] px-4">Phone</div>
            <div className="w-[10%] px-4">Amount</div>
            <div className="w-[10%] px-4">Payment</div>
            <div className="w-[10%] px-4">Status</div>
            <div className="w-[10%] px-4">Date</div>
            <div className="w-[10%] px-4">Actions</div>
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
                  className="flex flex-row border-b border-gray-200 min-h-[72px] items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="w-[15%] px-4">
                    <div className="font-medium text-gray-900 text-sm">
                      {order.order_number}
                    </div>
                  </div>

                  <div className="w-[20%] px-4">
                    <div className="text-gray-900 text-sm font-medium">
                      {order.customer_name}
                    </div>
                    <div className="text-gray-400 text-xs truncate">
                      {order.customer_email}
                    </div>
                  </div>

                  <div className="w-[15%] px-4">
                    <div className="text-gray-600 text-sm">
                      {order.customer_phone}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {order.customer_city}
                    </div>
                  </div>

                  <div className="w-[10%] px-4">
                    <div className="text-gray-900 font-medium text-sm">
                      KSh {order.subtotal.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-xs capitalize">
                      {order.payment_method === 'cash_on_delivery' ? 'COD' : order.payment_method}
                    </div>
                  </div>

                  <div className="w-[10%] px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>

                  <div className="w-[10%] px-4">
                    <select
                      value={order.order_status}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                      disabled={updating}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${getStatusColor(order.order_status)}`}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="text-gray-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[10%] px-4">
                    <div className="text-gray-500 text-sm">
                      {formatDate(order.created_at)}
                    </div>
                  </div>

                  <div className="w-[10%] px-4">
                    <select
                      className="border rounded-md p-1 text-sm"
                      value={actionValues[order.order_id] || ""}
                      onChange={(e) => handleActionChange(e.target.value, order.order_id, order.order_status)}
                    >
                      <option value="">Actions</option>
                      <option value="cancel" disabled={order.order_status === 'cancelled'}>Cancel</option>
                      <option value="delete" disabled={order.order_status === 'processing' || order.order_status === 'delivered'}>Delete</option>
                    </select>
                  </div>
                </div>
              ))}

              {loading && orders.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-magenta-dark" />
                </div>
              )}

              {!hasMore && orders.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No more orders to load
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <Icon icon="mdi:package-variant" className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal({ show: false, orderId: null })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                No, Go Back
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={updating}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal({ show: false, orderId: null })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                No, Go Back
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={updating}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}