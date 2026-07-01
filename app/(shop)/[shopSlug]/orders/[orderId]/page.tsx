// app/(shop)/[shopSlug]/orders/[orderId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import PageBar from "@/app/components/layout/pageBar";
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  MapPin,
  Calendar,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    shopSlug: string;
    orderId: string;
  }>;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variant_id: number | null;
  variant_name: string | null;
  variant_attributes: Record<string, string> | null;
}

interface OrderData {
  order_id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  customer_phone: string;
  customer_email: string;
  customer_name?: string;
  customer_city?: string;
  customer_address?: string;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
  items: OrderItem[];
}

interface OrderItemWithImage extends OrderItem {
  product_id?: number;
  imageUrl?: string;
  imageError?: boolean;
}

export default function OrderDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState<string>("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItemWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    try {
      const response = await fetch(`/api/shops/orders/${orderId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setOrder(data.data);

        // Fetch images for each product
        const itemsWithImages = await Promise.all(
          data.data.items.map(async (item: OrderItem, index: number) => {
            // We don't have product_id from the public API, so use index or a placeholder
            // The API doesn't return product_id for customers, so we skip image fetching
            // or use a fallback
            return {
              ...item,
              product_id: undefined,
              imageUrl: undefined,
              imageError: true,
            };
          })
        );
        setItems(itemsWithImages);
      } else {
        setMessage({ type: "error", text: "Failed to load order details" });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setMessage({ type: "error", text: "Failed to load order details" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-gray-200 text-gray-800 border-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "paid"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : "bg-amber-100 text-amber-800 border-amber-300";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="md:p-6 px-4 py-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-48"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Order not found
          </h2>
          <Button
            onClick={() => router.push(`/${shopSlug}`)}
            variant="secondary"
            className="mt-4"
          >
            Go to Shop
          </Button>
        </div>
      </div>
    );
  }

  const displayItems = items.length > 0 ? items : order.items.map(item => ({ ...item, imageError: true }));

  return (
    <div className="md:p-6 px-4 py-6 font-[Poppins] max-w-7xl mx-auto">
      <PageBar breadcrumb={`Order #${order.order_number}`} />

      <div className="flex gap-6 items-center justify-between mt-2 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${shopSlug}`)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Order #{order.order_number}
            </h1>
            <p className="text-gray-800 text-sm mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package size={18} />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-gray-300">
              {displayItems.map((item, index) => (
                <div key={index} className="px-6 py-4 flex items-center gap-4">
                  {/* Product Image - placeholder since we don't have product_id */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <Package size={24} className="text-gray-500" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-500">{item.variant_name}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      KSh {formatPrice(item.price * item.quantity)}
                    </p>
                    <p className="text-sm text-gray-800">
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                </div>
              ))}
              <div className="px-6 py-4 bg-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-lg text-gray-900">
                    KSh {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {order.special_instructions && (
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Special Instructions
                </h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700">{order.special_instructions}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
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
                <p className="font-medium text-black">
                  {order.customer_name || "N/A"}
                </p>
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
                <p className="text-black">{order.customer_address || "N/A"}</p>
                <p className="text-black text-sm">{order.customer_city || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800">Order Status</h2>
            </div>
            <div className="px-6 py-4">
              <div
                className={`inline-flex px-3 py-2 rounded-lg border font-medium ${getStatusColor(order.order_status)}`}
              >
                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
              </div>
              {order.order_status === "pending" && (
                <p className="text-sm text-gray-600 mt-3">
                  Your order has been received and is awaiting confirmation.
                </p>
              )}
              {order.order_status === "processing" && (
                <p className="text-sm text-gray-600 mt-3">
                  Your order is being prepared for delivery.
                </p>
              )}
              {order.order_status === "delivered" && (
                <p className="text-sm text-gray-600 mt-3">
                  Your order has been delivered. Thank you for shopping with us!
                </p>
              )}
              {order.order_status === "cancelled" && (
                <p className="text-sm text-gray-600 mt-3">
                  This order has been cancelled.
                </p>
              )}
            </div>
          </div>

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
                  {order.payment_method === "cash_on_delivery"
                    ? "Cash on Delivery"
                    : order.payment_method}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div
                  className={`inline-flex px-3 py-2 rounded-lg border font-medium ${getPaymentStatusColor(order.payment_status)}`}
                >
                  {order.payment_status === "pending" ? "Pending" : "Paid"}
                </div>
              </div>
            </div>
          </div>

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
    </div>
  );
}    