'use client';

import { X, DollarSign, Smartphone, CheckCircle, Printer } from 'lucide-react';
import { PaymentMethod } from '../hooks/usePosCheckout';
import { POSStkPush } from './stkpos';
import { POSKopokopo } from './kpkppos';

interface POSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  amountTendered: string;
  setAmountTendered: (val: string) => void;
  changeDue: number;
  isCashValid: boolean;
  isSubmitting: boolean;
  isMpesaPushAvailable: boolean;
  activePaymentType: 'direct_mpesa' | 'stk_push' | 'kopokopo' | null;
  pendingOrder: any;
  completedOrder: any;
  onProcessPayment: () => void;
  onPushSuccess: () => void;
  primaryColor?: string;
}

export function POSCheckoutModal({
  isOpen,
  onClose,
  subtotal,
  paymentMethod,
  setPaymentMethod,
  amountTendered,
  setAmountTendered,
  changeDue,
  isCashValid,
  isSubmitting,
  isMpesaPushAvailable,
  activePaymentType,
  pendingOrder,
  completedOrder,
  onProcessPayment,
  onPushSuccess,
  primaryColor = '#0FA965',
}: POSCheckoutModalProps) {
  if (!isOpen) return null;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">
            {completedOrder
              ? 'Sale Completed'
              : pendingOrder
              ? 'M-Pesa Payment'
              : 'Complete Sale'}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STATE 1: COMPLETED RECEIPT */}
          {completedOrder ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h4 className="text-xl font-bold text-gray-800">
                  Sale Completed
                </h4>
                <p className="text-sm text-gray-500">
                  Order #{' '}
                  <span className="font-mono font-medium">
                    {completedOrder.order_number}
                  </span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left border text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Paid:</span>
                  <span className="font-semibold">
                    KES {formatPrice(completedOrder.total_amount)}
                  </span>
                </div>
                {paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tendered:</span>
                      <span>
                        KES {formatPrice(completedOrder.amountTendered)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600 font-bold border-t pt-2">
                      <span>Change Returned:</span>
                      <span>KES {formatPrice(completedOrder.changeDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : pendingOrder ? (
            /* STATE 2: POS-NATIVE PUSH (STK / KOPOKOPO) */
            <div className="py-2">
              {activePaymentType === 'stk_push' && (
                <POSStkPush
                  orderId={pendingOrder.order_id}
                  orderNumber={pendingOrder.order_number}
                  totalAmount={pendingOrder.total_amount ?? subtotal}
                  onSuccess={onPushSuccess}
                  onCancel={onClose}
                />
              )}

              {activePaymentType === 'kopokopo' && (
                <POSKopokopo
                  orderId={pendingOrder.order_id}
                  orderNumber={pendingOrder.order_number}
                  totalAmount={pendingOrder.total_amount ?? subtotal}
                  onSuccess={onPushSuccess}
                  onCancel={onClose}
                />
              )}

              {!activePaymentType && (
                <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
                  <p className="font-semibold">Configuration Error</p>
                  <p className="mt-1 text-xs text-red-500">
                    No active M-Pesa push gateway is configured for this shop.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* STATE 3: CHECKOUT FORM */
            <>
              {/* Total Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <span className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">
                  Amount Due
                </span>
                <p className="text-3xl font-extrabold text-emerald-800">
                  KES {formatPrice(subtotal)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Select Payment Method
                </label>
                <div
                  className={`grid gap-2 ${
                    isMpesaPushAvailable ? 'grid-cols-3' : 'grid-cols-2'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-semibold shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mb-1" />
                    <span className="text-xs">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pos_direct_mpesa')}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                      paymentMethod === 'pos_direct_mpesa'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-semibold shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1" />
                    <span className="text-xs">Direct M-Pesa</span>
                  </button>

                  {isMpesaPushAvailable && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                        paymentMethod === 'mpesa'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-semibold shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-1" />
                      <span className="text-xs">M-Pesa Push</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cash fields only */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount Received (KES)
                    </label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 border rounded-md text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    {[
                      subtotal,
                      Math.ceil(subtotal / 100) * 100,
                      Math.ceil(subtotal / 500) * 500,
                      Math.ceil(subtotal / 1000) * 1000,
                    ]
                      .filter(
                        (amt, idx, arr) =>
                          amt >= subtotal && arr.indexOf(amt) === idx
                      )
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmountTendered(amt.toString())}
                          className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-emerald-50 hover:border-emerald-500 transition-colors"
                        >
                          {amt === subtotal ? 'Exact' : `${amt}`}
                        </button>
                      ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Change Due:</span>
                    <span
                      className={`text-lg font-bold ${
                        isCashValid ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      KES {formatPrice(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* No phone input for pos_direct_mpesa or mpesa.
                  Direct M-Pesa: clerk confirms payment externally.
                  M-Pesa Push: the push component collects the phone itself. */}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          {completedOrder ? (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-white font-medium rounded-lg text-sm transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Done / Next Sale
              </button>
            </>
          ) : pendingOrder ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
            >
              Cancel Payment
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onProcessPayment}
                disabled={isSubmitting || !isCashValid}
                className="px-6 py-2 text-white font-medium rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting
                  ? 'Processing...'
                  : paymentMethod === 'mpesa'
                  ? 'Initiate Push'
                  : 'Complete Transaction'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}