"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { Smartphone, Clock } from "lucide-react";

interface STKPushPaymentProps {
  orderId: string | null;
  orderNumber: string | null;
  onPaymentSuccess?: () => void;
}

export function STKPushPayment({ orderId, orderNumber, onPaymentSuccess }: STKPushPaymentProps) {
  const router = useRouter();
  const { shop, trackEvent } = useShop();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);

  // Track payment page view
  useEffect(() => {
    if (!hasTrackedPageView) {
      trackEvent('payment_page_view');
      setHasTrackedPageView(true);
    }
  }, [hasTrackedPageView, trackEvent]);

  // Dummy STK Push handler (to be replaced with real implementation)
  const handleSTKPush = async () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Track payment success
      trackEvent('payment_success');
      onPaymentSuccess?.();
      
      showToast("STK Push sent to your phone! (Demo mode)", "success");
      setLoading(false);
      
      // Redirect to order confirmation
      setTimeout(() => {
        router.push(`/${shop?.shopSlug}/orders/${orderId}`);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Complete M-Pesa Payment</h1>
            <p className="text-gray-600 mt-2">
              Click below to receive an STK Push prompt on your phone
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                You will receive a prompt on your registered M-Pesa phone number. 
                Enter your PIN to complete the payment.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-lg font-semibold text-gray-900">{orderNumber}</p>
          </div>
          
          <button
            onClick={handleSTKPush}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: shop?.secondaryColor }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending STK Push...</span>
              </div>
            ) : (
              "Pay with STK Push"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}