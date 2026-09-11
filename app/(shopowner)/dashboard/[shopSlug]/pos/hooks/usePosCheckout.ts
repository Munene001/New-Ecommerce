import { useState } from 'react';
import { useCart } from '@/context/shopCartContext';
import { useToast } from '@/context/toastContext';

export type PaymentMethod = 'cash' | 'pos_direct_mpesa' | 'mpesa';

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
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const parsedTendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, parsedTendered - subtotal);
  const isCashValid = paymentMethod !== 'cash' || parsedTendered >= subtotal;

  const openCheckout = () => {
    if (items.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    setAmountTendered(subtotal.toString());
    setCompletedOrder(null);
    setIsOpen(true);
  };

  const closeCheckout = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const processPayment = async () => {
    if (paymentMethod === 'cash' && parsedTendered < subtotal) {
      showToast('Amount tendered is less than total', 'error');
      return;
    }

    if (paymentMethod === 'pos_direct_mpesa' && !customerPhone) {
      showToast('Please enter customer M-Pesa phone number', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shop_id: shopId,
        source: 'pos',
        payment_method: paymentMethod,
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || '0000000000',
        items: items.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/shops/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process POS transaction');
      }

      setCompletedOrder({
        ...data.data,
        changeDue,
        amountTendered: parsedTendered,
      });

      clearCart();
      showToast('Transaction completed successfully!', 'success');
      if (onSuccess) onSuccess();

    } catch (err: any) {
      showToast(err.message || 'Payment processing failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
    changeDue,
    isCashValid,
    isSubmitting,
    completedOrder,
    processPayment,
  };
}