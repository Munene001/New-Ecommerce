'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/context/toastContext';
import { POSStkPushForm } from './push-ui/stkPushForm';
import { POSPushStatus } from './push-ui/pushStatus';

interface POSStkPushProps {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  initialPhoneNumber?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type PushStatus = 'idle' | 'pending' | 'failed' | 'cancelled';

export function POSStkPush({
  orderId,
  orderNumber,
  totalAmount,
  initialPhoneNumber = '',
  onSuccess,
  onCancel,
}: POSStkPushProps) {
  const { showToast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [savedPhoneNumber, setSavedPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PushStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Polling — 2s interval for POS responsiveness
  useEffect(() => {
    if (!isPolling || !orderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/shops/orders/${orderId}`, {
          credentials: 'include',
        });
        const result = await res.json();

        if (!result.success) return;

        const orderData = result.data;

        if (orderData.payment_status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsPolling(false);
          onSuccess();
          return;
        }

        const txnStatus = orderData.transaction_status;
        const txnRetryable =
          orderData.retryable === true || orderData.retryable === 1;

        if (txnStatus === 'cancelled' && txnRetryable) {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsPolling(false);
          setStatus('cancelled');
          setRetryable(txnRetryable);
          setStatusMessage(
            orderData.displayMessage || 'Payment was cancelled by customer.'
          );
          return;
        }

        if (txnStatus === 'failed' && txnRetryable) {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsPolling(false);
          setStatus('failed');
          setRetryable(txnRetryable);
          setStatusMessage(
            orderData.displayMessage || 'Payment failed. You can retry.'
          );
          return;
        }

        setPollCount((prev) => {
          const next = prev + 1;
          if (next >= 30) {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsPolling(false);
            setStatus('failed');
            setRetryable(true);
            setStatusMessage('Payment timed out. You can retry.');
          }
          return next;
        });
      } catch (err) {
        console.error('POS STK polling error:', err);
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isPolling, orderId, onSuccess]);

  const sendPush = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast('Enter a valid phone number', 'error');
      return;
    }

    setLoading(true);
    setSavedPhoneNumber(phoneNumber);
    setStatus('pending');
    setStatusMessage('Sending payment request...');

    try {
      const res = await fetch('/api/shops/payments/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, phoneNumber }),
      });
      const result = await res.json();

      if (result.success) {
        setStatusMessage('Waiting for customer to enter M-Pesa PIN...');
        setIsPolling(true);
        setPollCount(0);
        showToast('Push sent to customer', 'success');
      } else {
        setStatus('failed');
        setRetryable(true);
        setStatusMessage(result.error || 'Failed to send push');
        showToast(result.error || 'Failed to send push', 'error');
      }
    } catch {
      setStatus('failed');
      setRetryable(true);
      setStatusMessage('Network error. Please retry.');
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const retryPush = async () => {
    const phoneToUse = savedPhoneNumber || phoneNumber;
    if (!phoneToUse || phoneToUse.length < 10) {
      showToast('Enter a valid phone number', 'error');
      return;
    }

    setLoading(true);
    setStatus('pending');
    setStatusMessage('Retrying payment...');

    try {
      const res = await fetch('/api/shops/payments/retrystk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, phoneNumber: phoneToUse }),
      });
      const result = await res.json();

      if (result.success) {
        setRetryCount((c) => c + 1);
        setStatusMessage('Retry sent. Waiting for customer PIN...');
        setIsPolling(true);
        setPollCount(0);
        showToast('Retry sent', 'success');
      } else {
        setStatus('failed');
        setRetryable(true);
        setStatusMessage(result.error || 'Retry failed');
        showToast(result.error || 'Retry failed', 'error');
      }
    } catch {
      setStatus('failed');
      setRetryable(true);
      setStatusMessage('Network error. Please retry.');
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'idle') {
    return (
      <POSStkPushForm
        phoneNumber={phoneNumber}
        onPhoneChange={setPhoneNumber}
        loading={loading}
        onSubmit={sendPush}
        orderNumber={orderNumber}
        totalAmount={totalAmount}
        disabled={loading}
      />
    );
  }

  return (
    <POSPushStatus
      status={status}
      statusMessage={statusMessage}
      orderNumber={orderNumber}
      totalAmount={totalAmount}
      retryable={retryable}
      retryCount={retryCount}
      onRetry={retryPush}
      onCancel={onCancel}
      loading={loading}
    />
  );
}