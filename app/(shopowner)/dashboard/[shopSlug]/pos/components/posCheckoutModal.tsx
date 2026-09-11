'use client';

import { X, DollarSign, Smartphone, CheckCircle, Printer } from 'lucide-react';
import { PaymentMethod } from '../hooks/usePosCheckout';

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
  completedOrder: any;
  onProcessPayment: () => void;
  primaryColor?: string;
}

export function POSCheckoutModal({
  isOpen,
  onClose,
  subtotal,
  paymentMethod,
  setPaymentMethod,
  customerPhone,
  setCustomerPhone,
  amountTendered,
  setAmountTendered,
  changeDue,
  isCashValid,
  isSubmitting,
  completedOrder,
  onProcessPayment,
  primaryColor = '#0FA965',
}: POSCheckoutModalProps) {
  if (!isOpen) return null;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">
            {completedOrder ? 'Receipt Summary' : 'Complete Sale'}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {completedOrder ? (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h4 className="text-xl font-bold text-gray-800">Payment Complete!</h4>
                <p className="text-sm text-gray-500">
                  Order #: <span className="font-mono font-medium">{completedOrder.order_number}</span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left border text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Paid:</span>
                  <span className="font-semibold">KES {formatPrice(completedOrder.total_amount)}</span>
                </div>
                {paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tendered:</span>
                      <span>KES {formatPrice(completedOrder.amountTendered)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-bold border-t pt-2">
                      <span>Change Returned:</span>
                      <span>KES {formatPrice(completedOrder.changeDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Checkout Form */
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

              {/* Payment Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                    <span className="text-xs">M-Pesa Push</span>
                  </button>

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
                    <span className="text-xs">Till / Manual</span>
                  </button>
                </div>
              </div>

              {/* Cash Option Fields */}
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

                  {/* Quick Tender Buttons */}
                  <div className="flex gap-2">
                    {[subtotal, 100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountTendered(amt.toString())}
                        className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-gray-100"
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

              {/* M-Pesa Direct Push Fields */}
              {paymentMethod === 'pos_direct_mpesa' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Customer M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
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
                {isSubmitting ? 'Processing...' : 'Complete Transaction'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}