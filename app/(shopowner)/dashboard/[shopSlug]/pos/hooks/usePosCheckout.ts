import { useState, useEffect } from 'react';
import { useCart } from '@/context/shopCartContext';
import { useToast } from '@/context/toastContext';

export type PaymentMethod = 'cash' | 'pos_direct_mpesa' | 'mpesa';

interface PaymentConfig {
  active_payment_type: 'direct_mpesa' | 'stk_push' | 'kopokopo' | null;
  direct_mpesa?: any;
}

interface CheckoutOptions {
  shopId: number;
  onSuccess?: () => void;
}

export function usePosCheckout({ shopId, onSuccess }: CheckoutOptions) {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const parsedTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - subtotal);
  const isCashValid = paymentMethod !== 'cash' || parsedTendered >= subtotal;

  const activePaymentType = paymentConfig?.active_payment_type || null;
  const isMpesaPushAvailable =
    activePaymentType === 'stk_push' || activePaymentType === 'kopokopo';

  // Fetch shop payment settings on modal open
  useEffect(() => {
    if (!isOpen || !shopId) return;

    const fetchPaymentSettings = async () => {
      setIsLoadingConfig(true);
      try {
        const response = await fetch(`/api/shops/payments?shop_id=${shopId}`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.success) {
          setPaymentConfig(result.data);
        }
      } catch (error) {
        console.error('Failed to load payment options:', error);
        showToast('Failed to load payment options', 'error');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchPaymentSettings();
  }, [isOpen, shopId, showToast]);

  const openCheckout = () => {
    if (items.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    setAmountTendered(subtotal.toString());
    setCompletedOrder(null);
    setPendingOrder(null);
    setPaymentMethod('cash');
    setCustomerPhone('');
    setIsOpen(true);
  };

  const closeCheckout = () => {
    if (isSubmitting) return;

    // Cancel an in-flight push order via the shopowner PUT endpoint
    if (pendingOrder?.order_id) {
      fetch(`/api/shopowner/orders/${pendingOrder.order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'cancel' }),
      }).catch((err) => console.error('Failed to cancel order:', err));

      setPendingOrder(null);
    }

    setIsOpen(false);
  };

  const processPayment = async () => {
    if (paymentMethod === 'cash' && parsedTendered < subtotal) {
      showToast('Amount tendered is less than total', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shop_id: shopId,
        source: 'pos',
        payment_method: paymentMethod,
        customer_name: customerName || 'Walk-in Customer',
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/shops/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process POS transaction');
      }

      if (paymentMethod === 'cash' || paymentMethod === 'pos_direct_mpesa') {
        setCompletedOrder({
          ...data.data,
          changeDue,
          amountTendered: parsedTendered,
        });
        clearCart(true);
        showToast('Sale completed!', 'success');
        if (onSuccess) onSuccess();
      } else if (paymentMethod === 'mpesa') {
        setPendingOrder(data.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Payment processing failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePushPaymentSuccess = () => {
    clearCart(true);
    setCompletedOrder(pendingOrder);
    setPendingOrder(null);
    showToast('Sale completed!', 'success');
    if (onSuccess) onSuccess();
  };

  return {
    isOpen,
    openCheckout,
    closeCheckout,
    paymentMethod,
    setPaymentMethod,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    amountTendered,
    setAmountTendered,
    parsedTendered,
    changeDue,
    isCashValid,
    isSubmitting,
    isLoadingConfig,
    isMpesaPushAvailable,
    activePaymentType,
    pendingOrder,
    completedOrder,
    processPayment,
    handlePushPaymentSuccess,
  };
}