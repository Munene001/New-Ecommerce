// app/(shop)/[shopSlug]/checkout/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { CODPayment } from "./components/cod";
import { STKPushPayment } from "./components/stkPush";
import { DirectMpesaPayment } from "./components/manualMpesa";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { shop } = useShop();
  const { showToast } = useToast();
  
  const orderId = searchParams.get("order_id");
  const orderNumber = searchParams.get("order_number");
  const method = searchParams.get("method"); // "mpesa" or "cod"
  
  const [paymentConfig, setPaymentConfig] = useState<{
    active_payment_type: 'direct_mpesa' | 'stk_push' | null;
    direct_mpesa: {
      type: 'paybill' | 'till' | 'pochi' | 'send_money';
      business_number: string | null;
      account_number: string | null;
      till_number: string | null;
      phone_number: string | null;
    } | null;
  } | null>(null);
  
  // Fetch payment settings
  useEffect(() => {
    if (method === "mpesa" && shop?.shopId) {
      fetchPaymentSettings();
    }
  }, [method, shop?.shopId]);
  
  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch(`/api/shopowner/payments?shop_id=${shop?.shopId}`);
      const result = await response.json();
      
      if (result.success) {
        setPaymentConfig(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error);
      showToast("Failed to load payment options", "error");
    }
  };
  
  // COD Flow
  if (method === "cod") {
    return <CODPayment orderId={orderId} orderNumber={orderNumber} />;
  }
  
  // M-Pesa Flow
  if (method === "mpesa") {
    // Loading state
    if (!paymentConfig) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment options...</p>
          </div>
        </div>
      );
    }
    
    // STK Push
    if (paymentConfig.active_payment_type === 'stk_push') {
      return <STKPushPayment orderId={orderId} orderNumber={orderNumber} />;
    }
    
    // Direct M-Pesa
    if (paymentConfig.active_payment_type === 'direct_mpesa' && paymentConfig.direct_mpesa) {
      return (
        <DirectMpesaPayment 
          orderId={orderId} 
          orderNumber={orderNumber} 
          mpesaInfo={paymentConfig.direct_mpesa}
        />
      );
    }
  }
  
  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Payment Method</h1>
          <p className="text-gray-600">Please go back and try again.</p>
        </div>
      </div>
    </div>
  );
}