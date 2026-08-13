"use client";

import { 
  XCircle, 
  Loader2, 
  PartyPopper,
  Package,
  ShoppingBag,
  AlertCircle,
  Clock,
  Smartphone,
  User,
  Mail          // ✅ NEW
} from "lucide-react";
import { useEffect } from "react";

interface STKPushStatusProps {
  status: 'pending' | 'completed' | 'failed';
  statusMessage: string;
  orderNumber: string | null;
  retryable: boolean;
  retryCount: number;
  onRetry: () => void;
  onContinue: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
  shopColor?: string;
  loading?: boolean;
  totalAmount?: number;  // ✅ NEW
}

export function STKPushStatus({
  status,
  statusMessage,
  orderNumber,
  retryable,
  retryCount,
  onRetry,
  onContinue,
  onSignIn,
  isAuthenticated = false,
  shopColor = '#059669',
  loading = false,
  totalAmount = 0,  // ✅ NEW
}: STKPushStatusProps) {

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ✅ SUCCESS STATE (UPDATED)
  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="relative p-8 text-center bg-gradient-to-br from-green-500 to-emerald-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                  <PartyPopper className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Successful! 🎉</h1>
                <p className="text-green-50 text-sm">{statusMessage}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Order Number */}
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Order Number</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{orderNumber}</p>
              </div>
              
              {/* ✅ NEW: Amount Display */}
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount Paid</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">KSh {totalAmount.toLocaleString()}</p>
              </div>

              {/* ✅ NEW: Email Confirmation */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 justify-center">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    A confirmation email has been sent to your email address.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {isAuthenticated ? (
                  <button
                    onClick={onSignIn}
                    className="w-full px-4 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: shopColor }}
                  >
                    <User className="w-4 h-4" />
                    Go to Profile
                  </button>
                ) : (
                  <button
                    onClick={onSignIn}
                    className="w-full px-4 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: shopColor }}
                  >
                    <User className="w-4 h-4" />
                    Sign in to Track Order
                  </button>
                )}

                <button
                  onClick={onContinue}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed State (unchanged)
  if (status === 'failed') {
    const showRetry = retryable && retryCount < 3;
    const tooManyAttempts = retryCount >= 3;

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="relative p-8 text-center bg-gradient-to-br from-red-500 to-rose-600">
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {tooManyAttempts ? 'Too Many Attempts' : 'Payment Failed'}
                </h1>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {statusMessage}
                  </p>
                </div>
              </div>

              {tooManyAttempts ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      You've reached the maximum number of retry attempts. 
                      Please contact support or try another payment method.
                    </p>
                  </div>
                </div>
              ) : (
                retryable && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        You can try again ({retryCount}/3 attempts used) or choose another payment method.
                      </p>
                    </div>
                  </div>
                )
              )}
              
              {showRetry && (
                <button
                  onClick={onRetry}
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: shopColor }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Try Again ({3 - retryCount} attempts left)</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={onContinue}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Order #{orderNumber} • Contact support if you need help
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ PENDING STATE (UPDATED)
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {loading ? 'Retrying Payment...' : 'Processing Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{statusMessage}</p>
            </div>
            
            {/* Order Number */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{orderNumber}</p>
            </div>

            {/* ✅ NEW: Amount Display */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">KSh {totalAmount.toLocaleString()}</p>
            </div>

            {/* ✅ NEW: Email Notification */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300 text-left">
                  You'll receive an order confirmation email once payment is successful.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300 text-left">
                  You will receive a prompt on your registered M-Pesa phone number. 
                  Enter your PIN to complete the payment.
                </p>
              </div>
            </div>
            
            <button
              onClick={onContinue}
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              This page will update automatically when payment is confirmed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}