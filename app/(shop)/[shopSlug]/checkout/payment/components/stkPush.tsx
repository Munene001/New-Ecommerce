"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authcontext";
import { STKPushForm } from "./stk-ui/stkPushForm";
import { STKPushStatus } from "./stk-ui/stkPushStatus";

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

interface STKPushPaymentProps {
  orderId: string | null;
  order: Order | null;
  initialSavedState?: any;
  onPaymentSuccess?: () => void;
  onStateChange?: (state: any) => void;
}

const getOrderToken = (orderId: string, searchParams: URLSearchParams): string | null => {
  return searchParams.get('token') || localStorage.getItem(`guest_order_token_${orderId}`);
};

export function STKPushPayment({ 
  orderId, 
  order, 
  initialSavedState,
  onPaymentSuccess,
  onStateChange 
}: STKPushPaymentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { shop, trackEvent } = useShop();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed' | 'cancelled'>(() => {
    if (order?.payment_status === 'paid') return 'completed';
    if (order?.payment_status === 'failed') return 'failed';
    if (order?.payment_status === 'cancelled') return 'cancelled';
    return initialSavedState?.status || 'idle';
  });
  
  const [statusMessage, setStatusMessage] = useState(() => {
    if (order?.payment_status === 'paid') return 'Payment successful! Your order is confirmed.';
    if (order?.payment_status === 'failed') return 'Payment failed. Please try again.';
    if (order?.payment_status === 'cancelled') return 'Payment was cancelled. You can retry.';
    return initialSavedState?.statusMessage || '';
  });

  const [retryable, setRetryable] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [retryCount, setRetryCount] = useState(initialSavedState?.retryCount || 0);
  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);
  const [savedPhoneNumber, setSavedPhoneNumber] = useState("");

  // Sync state if backend order status changes
  useEffect(() => {
    if (order?.payment_status === 'paid' && paymentStatus !== 'completed') {
      setPaymentStatus('completed');
      setStatusMessage('Payment successful! Your order is confirmed.');
      sessionStorage.removeItem('pendingPaymentOrderId');
      if (orderId) sessionStorage.removeItem(`payment_phone_${orderId}`);
    } else if (order?.payment_status === 'failed' && paymentStatus !== 'failed') {
      setPaymentStatus('failed');
      setStatusMessage('Payment failed. Please try again.');
    } else if (order?.payment_status === 'cancelled' && paymentStatus !== 'cancelled') {
      setPaymentStatus('cancelled');
      setStatusMessage('Payment was cancelled. You can retry.');
    }
  }, [order?.payment_status, orderId, paymentStatus]);

  // Save state to parent
  useEffect(() => {
    if (onStateChange && paymentStatus !== 'idle') {
      onStateChange({
        status: paymentStatus,
        statusMessage,
        orderNumber: order?.order_number || null,
        retryCount,
        timestamp: Date.now()
      });
    }
  }, [paymentStatus, statusMessage, order?.order_number, retryCount, onStateChange]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paymentStatus]);

  useEffect(() => {
    if (!hasTrackedPageView) {
      trackEvent('payment_page_view');
      setHasTrackedPageView(true);
    }
  }, [hasTrackedPageView, trackEvent]);

  useEffect(() => {
    if (orderId) {
      sessionStorage.setItem('pendingPaymentOrderId', orderId);
      
      const savedPhone = sessionStorage.getItem(`payment_phone_${orderId}`);
      if (savedPhone) {
        setPhoneNumber(savedPhone);
        setSavedPhoneNumber(savedPhone);
      }
    }
  }, [orderId]);

  // Polling
  useEffect(() => {
    if (!isPolling || !orderId) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = orderId ? getOrderToken(orderId, searchParams) : null;
        
        const response = await fetch(`/api/shops/orders/${orderId}`, {
          credentials: 'include',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
        });
        const result = await response.json();
        
        if (result.success) {
          const orderData = result.data;
          
          if (orderData.payment_status === 'paid') {
            setPaymentStatus('completed');
            setStatusMessage('Payment successful! Your order is confirmed.');
            setIsPolling(false);
            setPollCount(0);
            onPaymentSuccess?.();
            trackEvent('payment_success');
            sessionStorage.removeItem('pendingPaymentOrderId');
            sessionStorage.removeItem(`payment_phone_${orderId}`);
            return;
          }
          
          const isRetryable = orderData.retryable === true || orderData.retryable === 1;
          const transactionStatus = orderData.transaction_status;
          
          if (transactionStatus === 'cancelled' && isRetryable) {
            setPaymentStatus('cancelled');
            setRetryable(isRetryable);
            setStatusMessage(orderData.displayMessage || 'Payment was cancelled. You can retry.');
            setIsPolling(false);
            setPollCount(0);
            return;
          }
          
          if (transactionStatus === 'failed' && isRetryable) {
            setPaymentStatus('failed');
            setRetryable(isRetryable);
            setStatusMessage(orderData.displayMessage || 'Payment failed. Please try again.');
            setIsPolling(false);
            setPollCount(0);
            return;
          }
          
          if (orderData.payment_status === 'failed') {
            setPaymentStatus('failed');
            setRetryable(false);
            setStatusMessage(orderData.displayMessage || 'Payment failed. Please contact support.');
            setIsPolling(false);
            setPollCount(0);
            return;
          }
          
          setPollCount(prev => prev + 1);
          
          if (pollCount >= 12) {
            setIsPolling(false);
            setPollCount(0);
            setPaymentStatus('failed');
            setRetryable(true);
            setStatusMessage('Payment is taking longer than expected. Please check your M-Pesa and try again if needed.');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isPolling, orderId, pollCount, shop, router, onPaymentSuccess, trackEvent, searchParams]);

  const handleSTKPush = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    if (orderId) {
      sessionStorage.setItem(`payment_phone_${orderId}`, phoneNumber);
      setSavedPhoneNumber(phoneNumber);
    }

    setLoading(true);
    setPaymentStatus('pending');
    setStatusMessage('Sending payment request...');
    
    try {
      const token = orderId ? getOrderToken(orderId, searchParams) : null;
      
      const response = await fetch('/api/shops/payments/stk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          phoneNumber: phoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage('Check your phone for the M-Pesa prompt. Enter your PIN to complete payment.');
        setIsPolling(true);
        setPollCount(0);
        showToast("STK Push sent to your phone!", "success");
      } else {
        setPaymentStatus('failed');
        setRetryable(true);
        setStatusMessage(result.error || "Failed to initiate payment. Please try again.");
        showToast(result.error || "Failed to initiate payment", "error");
      }
    } catch (error) {
      console.error('STK Push error:', error);
      setPaymentStatus('failed');
      setRetryable(true);
      setStatusMessage("Network error. Please check your connection and try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!orderId) {
      showToast("Order not found", "error");
      return;
    }

    const phoneToUse = savedPhoneNumber || phoneNumber;
    if (!phoneToUse || phoneToUse.length < 10) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');
    setStatusMessage('Retrying payment...');
    
    try {
      const token = orderId ? getOrderToken(orderId, searchParams) : null;
      
      const response = await fetch('/api/shops/payments/retrystk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          phoneNumber: phoneToUse,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setRetryCount((prev: number) => prev + 1);
        setStatusMessage('Retry initiated. Check your phone for the M-Pesa prompt.');
        setIsPolling(true);
        setPollCount(0);
        showToast("Retry STK Push sent to your phone!", "success");
      } else {
        setPaymentStatus('failed');
        setRetryable(true);
        setStatusMessage(result.error || "Failed to retry payment. Please try again.");
        showToast(result.error || "Failed to retry payment", "error");
      }
    } catch (error) {
      console.error('Retry error:', error);
      setPaymentStatus('failed');
      setRetryable(true);
      setStatusMessage("Network error. Please check your connection and try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    if (orderId) {
      sessionStorage.removeItem(`payment_state_${orderId}`);
    }
    router.push(`/${shop?.shopSlug}`);
  };

  const handleSignIn = () => {
    const profileUrl = `/${shop?.shopSlug}/profile`;

    if (isAuthenticated) {
      router.push(profileUrl);
      return;
    }

    const paymentPage = `${pathname}?order_id=${orderId}&status=success`;
    sessionStorage.setItem('payment_page_after_signin', paymentPage);

    router.push(`/auth/login?redirect=${encodeURIComponent(profileUrl)}`);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (orderId) {
      sessionStorage.setItem(`payment_phone_${orderId}`, value);
    }
  };

  if (paymentStatus === 'idle') {
    return (
      <STKPushForm
        phoneNumber={phoneNumber}
        onPhoneChange={handlePhoneChange}
        loading={loading}
        onSubmit={handleSTKPush}
        orderNumber={order?.order_number || null}
        totalAmount={order?.total_amount || 0}
        disabled={loading}
      />
    );
  }

  return (
    <STKPushStatus
      status={paymentStatus}
      statusMessage={statusMessage}
      orderNumber={order?.order_number || null}
      retryable={retryable}
      retryCount={retryCount}
      onRetry={handleRetry}
      onContinue={handleContinueShopping}
      onSignIn={handleSignIn}
      isAuthenticated={isAuthenticated}
      shopColor={shop?.secondaryColor}
      loading={loading}
      totalAmount={order?.total_amount || 0}  
    />
  );
}