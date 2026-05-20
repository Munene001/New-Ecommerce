"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/authcontext";
import { useCart } from "@/context/shopCartContext";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { User, ShoppingBag } from "lucide-react";
import PageBar from "@/app/components/layout/pageBar";
import CheckoutForm from "./component/checkoutForm";
import OrderSummary from "./component/orderSummary";
import CheckoutSkeleton from "./component/checkoutSkeleton";

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const { shop, trackEvent } = useShop();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    specialInstructions: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cod">("mpesa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [mpesaEnabled, setMpesaEnabled] = useState(false);
  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);

  // Flag to prevent redirect after order is placed
  const orderPlacedRef = useRef(false);

  // Track checkout page view (when customer arrives)
  useEffect(() => {
    if (shop?.shopId && !hasTrackedPageView && items.length > 0) {
      trackEvent('checkout_page_view');
      setHasTrackedPageView(true);
    }
  }, [shop?.shopId, items.length, hasTrackedPageView, trackEvent]);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      if (!shop?.shopId) return;

      try {
        const response = await fetch(
          `/api/shops/payments?shop_id=${shop.shopId}`,
        );
        const result = await response.json();

        if (result.success) {
          setCodEnabled(result.data.cod_enabled);
          setMpesaEnabled(result.data.has_any_mpesa_config);

          if (result.data.has_any_mpesa_config) {
            setPaymentMethod("mpesa");
          } else if (result.data.cod_enabled) {
            setPaymentMethod("cod");
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment settings:", error);
      }
    };

    fetchPaymentSettings();
  }, [shop?.shopId]);

  // Pre-fill form for logged-in users
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: user?.email || "",
        phone: profile.phone || "",
        city: "",
        address: "",
        specialInstructions: "",
      });
    }
  }, [authLoading, isAuthenticated, profile, user]);

  // Redirect if cart is empty - BUT NOT if order was just placed
  useEffect(() => {
    if (!orderPlacedRef.current && !authLoading && items.length === 0) {
      router.push(`/${shop?.shopSlug}`);
    }
  }, [items, authLoading, router, shop]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.city ||
      !formData.address
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);

    // Track order placed
    trackEvent('order_placed');

    try {
      const orderData = {
        shop_id: shop?.shopId,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_city: formData.city,
        customer_address: formData.address,
        special_instructions: formData.specialInstructions || undefined,
        payment_method: paymentMethod === "cod" ? "cash_on_delivery" : "mpesa",
        subtotal: subtotal,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/shops/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        orderPlacedRef.current = true;
        clearCart(true);
        showToast(result.data.message, "success");
        router.push(
          `/${shop?.shopSlug}/checkout/payment?order_id=${result.data.order_id}`,
        );
      } else {
        showToast(result.error || "Failed to place order", "error");
      }
    } catch (error) {
      console.error("Place order error:", error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0 && !orderPlacedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Your cart is empty</p>
          <Link
            href={`/${shop?.shopSlug}`}
            className="inline-block mt-4 px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: shop?.secondaryColor }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBar breadcrumb="shop / checkout" itemCount={totalItems} />

      <div className="min-h-screen py-6 md:py-10 bg-gray-50">
        <div className="mx-auto px-4 md:px-6">
          {!isAuthenticated && (
            <div className="bg-blue-50 border-l-4 p-4 mb-6 rounded-r-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-black" />
                  <p className="text-sm text-black-800">
                    <strong>Already have an account?</strong> Sign in for faster
                    checkout
                  </p>
                </div>
                <Link
                  href={`/auth/login?redirect=/${shop?.shopSlug}/checkout`}
                  className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:gap-8">
            <div className="lg:flex-1 order-1 lg:order-1">
              <CheckoutForm
                formData={formData}
                onChange={handleFormChange}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                secondaryColor={shop?.secondaryColor}
                codEnabled={codEnabled}
                mpesaEnabled={mpesaEnabled}
              />
            </div>

            <div className="lg:w-[420px] order-2 lg:order-2 mt-6 lg:mt-0">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                totalItems={totalItems}
                onContinue={handlePlaceOrder}
                isSubmitting={isSubmitting}
                secondaryColor={shop?.secondaryColor}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}