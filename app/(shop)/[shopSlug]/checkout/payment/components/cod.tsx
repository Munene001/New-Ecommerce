// app/(shop)/[shopSlug]/checkout/payment/components/CODPayment.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/authcontext";
import { useShop } from "@/app/(shop)/ShopContext";
import { CheckCircle, Phone, Gift, ShoppingBag, PartyPopper, Package, Truck } from "lucide-react";

interface CODPaymentProps {
  orderId: string | null;
  orderNumber: string | null;
}

export function CODPayment({ orderId, orderNumber }: CODPaymentProps) {
  const router = useRouter();
  const { shop } = useShop();
  const { isAuthenticated } = useAuth();

  const TrackOrderButton = () => {
    if (isAuthenticated) {
      return (
        <button
          onClick={() => router.push(`/${shop?.shopSlug}/orders/${orderId}`)}
          className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-[1.02]"
          style={{ backgroundColor: shop?.secondaryColor }}
        >
          Track Your Order
        </button>
      );
    }
    
    return (
      <div className="space-y-3">
        <Link
          href={`/auth/login?redirect=/${shop?.shopSlug}/orders/${orderId}`}
          className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] text-center block"
          style={{ backgroundColor: shop?.secondaryColor }}
        >
          Sign in to Track Order
        </Link>
        <p className="text-xs text-gray-500 text-center">
          Sign in to view your order history and track deliveries
        </p>
      </div>
    );
  };

  const safeOrderNumber = orderNumber || "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          {/* Success Header */}
          <div className="relative p-8 text-center bg-gradient-to-br from-green-500 to-emerald-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Order Placed! 🎉</h1>
              <p className="text-green-50">Your order has been received</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Order Number */}
            <div className="text-center bg-gradient-to-r from-gray-50 to-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Order Number</p>
              <p className="text-2xl font-bold text-gray-900">{safeOrderNumber}</p>
            </div>

            {/* Delivery Info */}
            <div className="space-y-3">
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <div className="flex gap-3">
                  <Truck className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Cash on Delivery</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please have the exact amount ready when our delivery agent arrives. 
                      Delivery fee will be communicated shortly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-2">
              <Package className="w-12 h-12 mx-auto" style={{ color: shop?.secondaryColor }} />
              <p className="text-gray-700 font-medium">
                We're preparing your order!
              </p>
             
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <TrackOrderButton />
              
              <button
                onClick={() => router.push(`/${shop?.shopSlug}`)}
                className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}