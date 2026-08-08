// components/STKPushPayment.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authcontext";
import { storeRedirect } from "@/lib/redirect/helper";
import { STKPushForm } from "./stk-ui/stkPushForm";
import { STKPushStatus } from "./stk-ui/stkPushStatus";

interface STKPushPaymentProps {
  orderId: string | null;
  orderNumber: string | null;
  onPaymentSuccess?: () => void;
}

const getOrderToken = (orderId: string, searchParams: URLSearchParams): string | null => {
  return searchParams.get('token') || localStorage.getItem(`guest_order_token_${orderId}`);
};

export function STKPushPayment({ orderId, orderNumber, onPaymentSuccess }: STKPushPaymentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { shop, trackEvent } = useShop();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [hasTrackedPageView, setHasTrackedPageView] = useState(false);
  const [savedPhoneNumber, setSavedPhoneNumber] = useState("");

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
          const order = result.data;
          
          if (order.payment_status === 'paid') {
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
          
          const isRetryable = order.retryable === true || order.retryable === 1;
          const isTransactionFailed = order.transaction_status === 'failed';
          
          if (order.payment_status === 'pending' && isRetryable && isTransactionFailed) {
            setPaymentStatus('failed');
            setRetryable(isRetryable);
            setStatusMessage(order.displayMessage || 'Payment failed. Please try again.');
            setIsPolling(false);
            setPollCount(0);
            return;
          }
          
          if (order.payment_status === 'failed') {
            setPaymentStatus('failed');
            setRetryable(false);
            setStatusMessage(order.displayMessage || 'Payment failed. Please contact support.');
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
        setRetryCount(prev => prev + 1);
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
    router.push(`/${shop?.shopSlug}`);
  };

  const handleViewOrder = () => {
    router.push(`/${shop?.shopSlug}/orders/${orderId}`);
  };

  const handleSignIn = () => {
    const currentFullPath = `${pathname}?order_id=${orderId}&status=success`;
    storeRedirect(currentFullPath);
    router.push('/auth/login');
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
        orderNumber={orderNumber}
        disabled={loading}
      />
    );
  }

  return (
    <STKPushStatus
      status={paymentStatus}
      statusMessage={statusMessage}
      orderNumber={orderNumber}
      retryable={retryable}
      retryCount={retryCount}
      onRetry={handleRetry}
      onContinue={handleContinueShopping}
      onViewOrder={handleViewOrder}
      onSignIn={handleSignIn}
      isAuthenticated={isAuthenticated}
      shopColor={shop?.secondaryColor}
      loading={loading}
    />
  );
}