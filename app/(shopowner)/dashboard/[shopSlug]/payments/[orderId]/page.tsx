// app/(shopowner)/dashboard/[shopSlug]/payments/[orderId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone, 
  CreditCard, 
  Hash, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Receipt,
  Smartphone,
  Copy
} from 'lucide-react';
import { useShop } from '@/app/(shopowner)/shopownerContext';
import { useDashboardPayments } from '../hooks/useDashboardPayments';
import OrderSkeleton from '../../orders/[orderId]/components/orderSkeleton';

interface PaymentDetail {
  order_number: string;
  order_id: number;
  customer_name: string;
  customer_phone: string;
  amount: number;
  payment_method: 'COD' | 'Direct M-Pesa' | 'STK Push' | 'M-Pesa';
  checkout_id: string | null;
  receipt_number: string | null;
  provider: 'Safaricom' | 'Kopokopo' | null;
  result_code: number | null;
  result_description: string | null;
  status: string;
  delivery_fee: number;
  delivery_zone: string | null;
  created_at: string;
}

const getStatusBadge = (status: string) => {
  const styles = {
    paid: 'bg-green-100 text-green-800 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return styles[status as keyof typeof styles] || styles.pending;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-600" />;
    case 'cancelled':
      return <AlertCircle className="w-5 h-5 text-gray-600" />;
    default:
      return <Clock className="w-5 h-5 text-yellow-600" />;
  }
};

const getPaymentMethodColor = (method: string) => {
  if (method === 'STK Push') return 'text-purple-600';
  if (method === 'Direct M-Pesa') return 'text-blue-600';
  if (method === 'COD') return 'text-orange-600';
  return 'text-gray-600';
};

const getPaymentMethodIcon = (method: string) => {
  if (method === 'STK Push') return <Smartphone className="w-4 h-4" />;
  if (method === 'Direct M-Pesa') return <Smartphone className="w-4 h-4" />;
  if (method === 'COD') return <Receipt className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function PaymentDetailPage() {
  const params = useParams();
  const { shopSlug } = useShop();
  const { getPaymentDetail, loading } = useDashboardPayments(shopSlug || '');
  
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = params?.orderId as string;

  useEffect(() => {
    if (!orderId || !shopSlug) return;

    const fetchPayment = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderIdNum = parseInt(orderId, 10);
        if (isNaN(orderIdNum)) {
          throw new Error('Invalid order ID');
        }
        
        const detail = await getPaymentDetail(orderIdNum);
        if (detail) {
          setPayment(detail);
        } else {
          setError('Payment details not found');
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [orderId, shopSlug, getPaymentDetail]);

  if (isLoading || loading) {
    return <OrderSkeleton />;
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
          <p className="text-gray-600">{error || 'The payment you are looking for does not exist.'}</p>
          <Link
            href={`/dashboard/${shopSlug}/payments`}
            className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Payments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/dashboard/${shopSlug}/payments`}
          className="inline-flex items-center text-gray-700 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Payments
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Payment #{payment.order_number}</h1>
                <p className="text-gray-300 text-sm mt-1">
                  {formatDate(payment.created_at)}
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusBadge(payment.status)}`}>
                {getStatusIcon(payment.status)}
                <span className="font-medium capitalize">{payment.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Payment Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Payment Method</span>
                <span className={`flex items-center gap-1.5 font-medium ${getPaymentMethodColor(payment.payment_method)}`}>
                  {getPaymentMethodIcon(payment.payment_method)}
                  {payment.payment_method}
                </span>
              </div>
              {payment.checkout_id && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Transaction ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-700">{payment.checkout_id}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(payment.checkout_id || '')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Transaction ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {payment.receipt_number && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">M-Pesa Receipt</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-700">{payment.receipt_number}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(payment.receipt_number || '')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Receipt Number"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {payment.provider && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Provider</span>
                  <span className="text-gray-700">{payment.provider}</span>
                </div>
              )}
              {payment.result_code !== null && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Result Code</span>
                  <span className={`font-medium ${payment.result_code === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {payment.result_code}
                  </span>
                </div>
              )}
              {payment.result_description && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Result Description</span>
                  <span className="text-gray-700">{payment.result_description}</span>
                </div>
              )}
              {payment.delivery_fee > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-700">{formatCurrency(payment.delivery_fee)}</span>
                </div>
              )}
              {payment.delivery_zone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Delivery Zone</span>
                  <span className="text-gray-700">{payment.delivery_zone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Customer Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium text-gray-900">{payment.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{payment.customer_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium text-gray-900">{payment.order_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-medium text-gray-900">{formatDate(payment.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col gap-3">
              <Link
                href={`/dashboard/${shopSlug}/orders/${payment.order_id}`}
                className="w-full px-4 py-3 bg-black text-white text-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                View Full Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}