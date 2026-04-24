// app/(shopowner)/dashboard/[shopSlug]/orders/[orderId]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import { ArrowLeft, Trash2, Package, User, CreditCard, MapPin, Calendar } from "lucide-react";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import OrderSkeleton from "./components/orderSkeleton";

interface PageProps {
  params: Promise<{
    shopSlug: string;
    orderId: string;
  }>;
}

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
  total_price: number;
}

interface OrderItemWithImage extends OrderItem {
  imageUrl?: string;
  imageError?: boolean;
}

export default function IndividualOrder({ params }: PageProps) {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState<string>("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItemWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    getOrderWithItems,
  } = useDashboardOrders(orderId?.toString() || "");

  useEffect(() => {
    const loadParams = async () => {
      const { shopSlug: slug, orderId: id } = await params;
      setShopSlug(slug);
      setOrderId(parseInt(id));
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    const result = await getOrderWithItems(orderId);
    
    if (result) {
      setOrder(result);
      // Fetch images for each product
      const itemsWithImages = await Promise.all(
        result.items.map(async (item: OrderItem) => {
          const imageUrl = `/api/shopowner/products/${item.product_id}/images/primary?w=200`;
          return {
            ...item,
            imageUrl,
            imageError: false,
          };
        })
      );
      setItems(itemsWithImages);
    } else {
      setMessage({ type: 'error', text: 'Failed to load order details' });
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!orderId) return;
    
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrder({ ...order, order_status: newStatus });
      setMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!orderId) return;
    
    const success = await updatePaymentStatus(orderId, newStatus);
    if (success) {
      setOrder({ ...order, payment_status: newStatus });
      setMessage({ type: 'success', text: `Payment status updated to ${newStatus}` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update payment status' });
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderId) return;
    
    const success = await deleteOrder(orderId);
    if (success) {
      setMessage({ type: 'success', text: 'Order deleted successfully' });
      setTimeout(() => {
        router.push(`/dashboard/${shopSlug}/orders`);
      }, 1500);
    } else {
      setMessage({ type: 'error', text: 'Failed to delete order' });
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
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
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return <OrderSkeleton />;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Order not found</h2>
          <Button
            onClick={() => router.back()}
            variant="secondary"
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-6 px-4 py-6 font-[Poppins] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex gap-6 items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Order #{order.order_number}</h1>
            <p className="text-gray-800 text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowDeleteModal(true)}
          variant="secondary"
          className="flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
        >
          <Trash2 size={18} />
          <span>Delete Order</span>
        </Button>
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Info - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package size={18} />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-gray-300">
              {items.map((item) => (
                <div key={item.order_item_id} className="px-6 py-4 flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                    {!item.imageError && item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        onError={() => {
                          setItems(prev => prev.map(i => 
                            i.order_item_id === item.order_item_id 
                              ? { ...i, imageError: true }
                              : i
                          ));
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <Package size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      KSh {formatPrice(item.total_price)}
                    </p>
                    <p className="text-sm text-gray-800">
                      {formatPrice(item.price_at_time)} each
                    </p>
                  </div>
                </div>
              ))}
              <div className="px-6 py-4 bg-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-lg text-gray-900">
                    KSh {formatPrice(order.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
                <h2 className="font-semibold text-gray-800">Special Instructions</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700">{order.special_instructions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer & Payment Info - Right Column */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} />
                Customer Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-800">Name</p>
                <p className="font-medium text-black">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-800">Email</p>
                <p className="text-black">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-800">Phone</p>
                <p className="text-black">{order.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin size={14} />
                  Address
                </p>
                <p className="text-black">{order.customer_address}</p>
                <p className="text-black text-sm">{order.customer_city}</p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800">Order Status</h2>
            </div>
            <div className="px-6 py-4">
              <select
                value={order.order_status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border font-medium cursor-pointer ${getStatusColor(order.order_status)}`}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard size={18} />
                Payment Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Method</p>
                <p className="font-medium text-gray-800 capitalize">
                  {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : order.payment_method}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <select
                  value={order.payment_status}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-medium cursor-pointer ${getPaymentStatusColor(order.payment_status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={18} />
                Order Timeline
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-gray-700">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-gray-700">{formatDate(order.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-400 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
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