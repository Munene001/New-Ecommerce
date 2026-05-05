// app/[shopSlug]/orders/[orderId]/page.tsx
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
  Store,
} from "lucide-react";
import OrderSkeleton from "@/app/(shopowner)/dashboard/[shopSlug]/orders/[orderId]/components/orderSkeleton";

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
  total: number;
}

interface OrderItemWithImage extends OrderItem {
  imageUrl?: string;
  imageError?: boolean;
}

interface Order {
  order_id: number;
  order_number: string;
  shop_id: number;
  shop_slug: string;
  shop_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  special_instructions: string | null;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export default function OrderDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState<string>("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
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
      const response = await fetch(`/api/shops/customers/orders/${orderId}`);
      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);

        // Fetch images for each product (replicating dashboard approach)
        const itemsWithImages = await Promise.all(
          data.order.items.map(async (item: OrderItem) => {
            const imageUrl = `/api/shopowner/products/${item.product_id}/images/primary?w=200`;
            return {
              ...item,
              imageUrl,
              imageError: false,
            };
          }),
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
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
          <h2 className="text-xl font-semibold text-gray-700">
            Order not found
          </h2>
          <Button
            onClick={() => router.push("/profile")}
            variant="secondary"
            className="mt-4"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-6 px-4 py-6 font-[Poppins] max-w-7xl mx-auto">
      <PageBar
        breadcrumb={`Order #${order?.order_number}`}
        itemCount={items.length}
        itemName={items.length === 1 ? "Item" : "Items"}
      />
      {/* Header */}
      <div className="flex gap-6 items-center justify-between mt-2 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${shopSlug}/profile`)}
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
                <div
                  key={item.order_item_id}
                  className="px-6 py-4 flex items-center gap-4"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                    {!item.imageError && item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        onError={() => {
                          setItems((prev) =>
                            prev.map((i) =>
                              i.order_item_id === item.order_item_id
                                ? { ...i, imageError: true }
                                : i,
                            ),
                          );
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <Package size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      KSh {formatPrice(item.total)}
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

          {/* Order Status - Read-only tracking */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800">Order Status</h2>
            </div>
            <div className="px-6 py-4">
              <div
                className={`inline-flex px-3 py-2 rounded-lg border font-medium ${getStatusColor(order.order_status)}`}
              >
                {order.order_status === "pending" && "Pending"}
                {order.order_status === "processing" && "Processing"}
                {order.order_status === "delivered" && "Delivered"}
                {order.order_status === "cancelled" && "Cancelled"}
                {!["pending", "processing", "delivered", "cancelled"].includes(
                  order.order_status,
                ) && order.order_status}
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
                {order.payment_status === "pending" &&
                  order.payment_method === "cash_on_delivery" && (
                    <p className="text-sm text-gray-600 mt-3">
                      Payment will be collected upon delivery.
                    </p>
                  )}
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
    </div>
  );
}
