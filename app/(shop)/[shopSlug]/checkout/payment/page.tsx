"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { CODPayment } from "./components/cod";
import { STKPushPayment } from "./components/stkPush";
import { DirectMpesaPayment } from "./components/manualMpesa";

// Add these type definitions
interface Order {
  order_id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  customer_phone: string;
  customer_email: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface PaymentConfig {
  active_payment_type: 'direct_mpesa' | 'stk_push' | null;
  direct_mpesa: {
    type: 'paybill' | 'till' | 'pochi' | 'send_money';
    business_number: string | null;
    account_number: string | null;
    till_number: string | null;
    phone_number: string | null;
  } | null;
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { shop } = useShop();
  const { showToast } = useToast();
  
  const orderId = searchParams.get("order_id");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch order details
  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/shops/orders/${orderId}`);
        const result = await response.json();
        
        if (result.success) {
          setOrder(result.data);
        } else {
          showToast("Failed to load order", "error");
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
        showToast("Network error", "error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId, showToast]);
  
  // Fetch payment settings (only for M-Pesa)
  useEffect(() => {
    if (order?.payment_method === "mpesa" && shop?.shopId) {
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
      fetchPaymentSettings();
    }
  }, [order?.payment_method, shop?.shopId, showToast]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }
  
  // COD Flow - from order data
  if (order.payment_method === "cash_on_delivery") {
    return <CODPayment orderId={orderId} orderNumber={order.order_number}  />;
  }
  
  // M-Pesa Flow - from order data
  if (order.payment_method === "mpesa") {
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
    
    if (paymentConfig.active_payment_type === 'stk_push') {
      return <STKPushPayment orderId={orderId} orderNumber={order.order_number} />;
    }
    
    if (paymentConfig.active_payment_type === 'direct_mpesa' && paymentConfig.direct_mpesa) {
      return (
        <DirectMpesaPayment 
          orderId={orderId} 
          orderNumber={order.order_number} 
          mpesaInfo={paymentConfig.direct_mpesa}
          totalAmount={order.total_amount}
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