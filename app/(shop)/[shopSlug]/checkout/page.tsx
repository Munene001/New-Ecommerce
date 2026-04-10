// app/(shop)/[shopSlug]/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/authcontext";
import { useCart } from "@/context/shopCartContext";
import { useShop } from "@/app/(shop)/ShopContext";
import { User, ShoppingBag, Loader2, CreditCard } from "lucide-react";
import PageBar from "@/app/components/layout/pageBar";
import CheckoutForm from "./component/checkoutForm";
import OrderSummary from "./component/orderSummary";
import CheckoutSkeleton from "./component/checkoutSkeleton";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const { items, subtotal, totalItems } = useCart();
  const { shop } = useShop();
  
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

  // Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && items.length === 0) {
      router.push(`/${shop?.shopSlug}`);
    }
  }, [items, authLoading, router, shop]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.city || !formData.address) {
      return;
    }
    
    sessionStorage.setItem("checkoutData", JSON.stringify({
      formData,
      paymentMethod,
      subtotal,
      items
    }));
    
    router.push(`/${shop?.shopSlug}/checkout/payment`);
  };

  if (authLoading) {
    return (
    <CheckoutSkeleton/>
    );
  }

  if (items.length === 0) {
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
      <PageBar 
        breadcrumb="shop / checkout" 
        itemCount={totalItems}
      />
      
      <div className="min-h-screen py-6 md:py-10 bg-gray-50">
        <div className=" mx-auto px-4 md:px-6 ">
          
          {/* Login Prompt - Only show for guests */}
          {!isAuthenticated && (
            <div className="bg-blue-50 border-l-4 p-4 mb-6 rounded-r-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-black" />
                  <p className="text-sm text-black-800">
                    <strong>Already have an account?</strong> Sign in for faster checkout
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
          
          {/* Desktop: Form left, Summary right | Mobile: Form top, Summary bottom */}
          <div className="flex flex-col lg:flex-row lg:gap-8">
            
            {/* LEFT COLUMN - Form */}
            <div className="lg:flex-1 order-1 lg:order-1">
              <CheckoutForm
                formData={formData}
                onChange={handleFormChange}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                secondaryColor={shop?.secondaryColor}
              />
            </div>
            
            {/* RIGHT COLUMN - Order Summary */}
            <div className="lg:w-[420px] order-2 lg:order-2 mt-6 lg:mt-0">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                totalItems={totalItems}
                onContinue={handleContinue}
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