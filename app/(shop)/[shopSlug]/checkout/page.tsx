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

interface DeliveryTier {
  tier_id: number;
  tier_name: string;
  fee: number;
}

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

  // Delivery state
  const [deliveryTiers, setDeliveryTiers] = useState<DeliveryTier[]>([]);
  const [selectedDeliveryTier, setSelectedDeliveryTier] = useState<DeliveryTier | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  const orderPlacedRef = useRef(false);

  // Track page view
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
          {
            credentials: 'include',
          }
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

  // Fetch delivery tiers - using shopowner endpoint (now public for GET)
  useEffect(() => {
    const fetchDeliveryTiers = async () => {
      if (!shop?.shopId) return;
      
      setLoadingDelivery(true);
      try {
        const response = await fetch(`/api/shopowner/payments/delivery?shop_id=${shop.shopId}`, {
          credentials: 'include',
        });
        const result = await response.json();
        
        if (result.success) {
          setDeliveryTiers(result.data);
          if (result.data.length > 0) {
            setDeliveryEnabled(true);
            setSelectedDeliveryTier(result.data[0]);
            setDeliveryFee(result.data[0].fee);
          } else {
            setDeliveryEnabled(false);
            setDeliveryFee(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch delivery tiers:", error);
        setDeliveryEnabled(false);
      } finally {
        setLoadingDelivery(false);
      }
    };
    
    fetchDeliveryTiers();
  }, [shop?.shopId]);

  // Auto-fill form for authenticated users
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

  // Redirect if cart is empty
  useEffect(() => {
    if (!orderPlacedRef.current && !authLoading && items.length === 0) {
      router.push(`/${shop?.shopSlug}`);
    }
  }, [items, authLoading, router, shop]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeliveryChange = (tier: DeliveryTier) => {
    setSelectedDeliveryTier(tier);
    setDeliveryFee(tier.fee);
  };

  const handlePlaceOrder = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone
    ) {
      showToast("Please fill in all required fields (Name, Email, Phone)", "error");
      return;
    }

    setIsSubmitting(true);

    trackEvent('order_placed');

    try {
      // ✅ FIX: Normalize all items before sending to API
      const normalizedItems = items.map((item) => ({
        product_id: Number(item.product_id), // ✅ Ensure number
        variant_id: item.variant_id ? Number(item.variant_id) : null, // ✅ Ensure number or null
        quantity: Number(item.quantity), // ✅ Ensure number
        price: Number(item.discount_price ?? item.price), // ✅ Ensure number
        product_name: String(item.product_name || ''),
        variant_name: item.variant_name ? String(item.variant_name) : null,
      }));

      // ✅ FIX: Ensure all numeric values are actually numbers
      const orderData = {
        shop_id: Number(shop?.shopId), // ✅ Ensure number
        customer_name: String(formData.fullName).trim(),
        customer_email: String(formData.email).trim(),
        customer_phone: String(formData.phone).trim(),
        customer_city: formData.city ? String(formData.city).trim() : null,
        customer_address: formData.address ? String(formData.address).trim() : null,
        special_instructions: formData.specialInstructions ? String(formData.specialInstructions).trim() : undefined,
        payment_method: paymentMethod === "cod" ? "cash_on_delivery" : "mpesa",
        subtotal: Number(subtotal), // ✅ Ensure number
        delivery_fee: Number(deliveryFee), // ✅ Ensure number
        delivery_tier_id: selectedDeliveryTier?.tier_id ? Number(selectedDeliveryTier.tier_id) : null,
        delivery_zone: selectedDeliveryTier?.tier_name ? String(selectedDeliveryTier.tier_name) : null,
        items: normalizedItems,
      };

 

      const response = await fetch("/api/shops/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        const token = result.data.order_token;
        if (token) {
          localStorage.setItem(`guest_order_token_${result.data.order_id}`, token);
        }

        orderPlacedRef.current = true;
        clearCart(true);
        showToast(result.data.message, "success");

        const paymentUrl = token 
          ? `/${shop?.shopSlug}/checkout/payment?order_id=${result.data.order_id}&token=${encodeURIComponent(token)}`
          : `/${shop?.shopSlug}/checkout/payment?order_id=${result.data.order_id}`;

        router.push(paymentUrl);
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
                  <p className="text-sm text-black">
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
                deliveryTiers={deliveryTiers}
                deliveryEnabled={deliveryEnabled}
                selectedDeliveryTier={selectedDeliveryTier}
                onDeliveryChange={handleDeliveryChange}
                loadingDelivery={loadingDelivery}
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
                deliveryFee={deliveryFee}
                selectedDeliveryTier={selectedDeliveryTier}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}