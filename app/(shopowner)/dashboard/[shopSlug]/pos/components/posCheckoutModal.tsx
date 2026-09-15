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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-black">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-lg text-black">
            {completedOrder
              ? 'Sale Completed'
              : pendingOrder
              ? 'M-Pesa Payment'
              : 'Complete Sale'}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-black hover:text-gray-700 rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STATE 1: COMPLETED RECEIPT */}
          {completedOrder ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <div>
                <h4 className="text-xl font-extrabold text-black">
                  Sale Completed
                </h4>
                <p className="text-sm font-semibold text-black mt-1">
                  Order #{' '}
                  <span className="font-mono font-bold text-black">
                    {completedOrder.order_number}
                  </span>
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-left border border-gray-300 text-sm">
                <div className="flex justify-between">
                  <span className="text-black font-semibold">Total Paid:</span>
                  <span className="font-extrabold text-black">
                    KES {formatPrice(completedOrder.total_amount)}
                  </span>
                </div>
                {paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-black font-semibold">Tendered:</span>
                      <span className="font-bold text-black">
                        KES {formatPrice(completedOrder.amountTendered)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-700 font-extrabold border-t border-gray-300 pt-2">
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
                <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700 border border-red-200">
                  <p className="font-bold">Configuration Error</p>
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    No active M-Pesa push gateway is configured for this shop.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* STATE 3: CHECKOUT FORM */
            <>
              {/* Total Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 text-center">
                <span className="text-xs uppercase tracking-wider text-emerald-900 font-extrabold">
                  Amount Due
                </span>
                <p className="text-3xl font-black text-emerald-900">
                  KES {formatPrice(subtotal)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase">
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
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                        : 'border-gray-300 hover:bg-gray-100 text-black font-semibold'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mb-1" />
                    <span className="text-xs">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pos_direct_mpesa')}
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                      paymentMethod === 'pos_direct_mpesa'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                        : 'border-gray-300 hover:bg-gray-100 text-black font-semibold'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1" />
                    <span className="text-xs">Direct M-Pesa</span>
                  </button>

                  {isMpesaPushAvailable && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
                        paymentMethod === 'mpesa'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                          : 'border-gray-300 hover:bg-gray-100 text-black font-semibold'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-1" />
                      <span className="text-xs">M-Pesa Push</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cash fields */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-300">
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Amount Received (KES)
                    </label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 border-2 border-gray-300 text-black placeholder:text-gray-500 rounded-md text-lg font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                          className="px-2.5 py-1 bg-white border border-gray-400 text-black rounded text-xs font-bold hover:bg-emerald-100 hover:border-emerald-600 transition-colors"
                        >
                          {amt === subtotal ? 'Exact' : `${amt}`}
                        </button>
                      ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-sm font-bold text-black">Change Due:</span>
                    <span
                      className={`text-lg font-black ${
                        isCashValid ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      KES {formatPrice(changeDue)}
                    </span>
                  </div>
                </div>
              )}
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
                className="px-4 py-2 border border-gray-400 rounded-lg text-sm font-bold text-black hover:bg-gray-100 flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-black" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-white font-bold rounded-lg text-sm transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Done / Next Sale
              </button>
            </>
          ) : pendingOrder ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-black hover:text-gray-800 rounded-lg"
            >
              Cancel Payment
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-black hover:text-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onProcessPayment}
                disabled={isSubmitting || !isCashValid}
                className="px-6 py-2 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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