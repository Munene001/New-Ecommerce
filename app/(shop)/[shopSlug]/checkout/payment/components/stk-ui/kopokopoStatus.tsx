"use client";

import {
  XCircle,
  Loader2,
  PartyPopper,
  ShoppingBag,
  AlertCircle,
  Clock,
  Smartphone,
  User,
  Mail,
  CreditCard,
  Package,
} from "lucide-react";
import { useEffect } from "react";

interface KopokopoStatusProps {
  status: "pending" | "completed" | "failed";
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
  totalAmount?: number;
}

export function KopokopoStatus({
  status,
  statusMessage,
  orderNumber,
  retryable,
  retryCount,
  onRetry,
  onContinue,
  onSignIn,
  isAuthenticated = false,
  shopColor = "#059669",
  loading = false,
  totalAmount = 0,
}: KopokopoStatusProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const OrderHeader = () => (
    <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Order</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {orderNumber || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            KSh {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  const MessageDisplay = ({
    icon,
    title,
    description,
    variant,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    variant: "success" | "error" | "warning" | "info";
  }) => {
    const variants = {
      success:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      warning:
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    };

    return (
      <div className={`mx-6 my-4 p-4 rounded-xl border ${variants[variant]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // SUCCESS
  if (status === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Payment Successful! 🎉
              </h1>
              <p className="text-green-50 text-sm">{statusMessage}</p>
            </div>

            <OrderHeader />

            <div className="mx-6 my-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 justify-center">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    A confirmation email has been sent to your email address.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 space-y-3">
              <button
                onClick={onSignIn}
                className="w-full px-4 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: shopColor }}
              >
                <User className="w-4 h-4" />
                {isAuthenticated ? "Go to Profile" : "Sign in to Track Order"}
              </button>
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
    );
  }

  // FAILED
  if (status === "failed") {
    const showRetry = retryable && retryCount < 3;
    const tooManyAttempts = retryCount >= 3;

    // Bundle all possible reasons for payment failure
    const possibleReasons = [
      "Wrong PIN entered",
      "Insufficient funds in your M-Pesa account",
      "Transaction was cancelled",
   
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {tooManyAttempts ? "Too Many Attempts" : "Payment Failed"}
              </h1>
             
            </div>

            <OrderHeader />

            <MessageDisplay
              variant="error"
              icon={<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
              title="What happened?"
              description="Your payment could not be processed. This could be due to:"
            />

            <div className="mx-6 mb-2">
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
                {possibleReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            {tooManyAttempts ? (
              <div className="mx-6 mb-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      You've reached the maximum number of retry attempts.
                      Please contact support or try another payment method.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              retryable && (
                <div className="mx-6 mb-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        You can try again ({retryCount}/3 attempts used).
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="p-6 pt-0 space-y-3">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PENDING
  if (status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {loading ? "Retrying Payment..." : "Processing Payment"}
              </h1>
              <p className="text-blue-50 text-sm mt-1">{statusMessage}</p>
            </div>

            <OrderHeader />

            <div className="mx-6 my-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Check your phone for the M-Pesa prompt. Enter your PIN to
                    complete the payment.
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-6 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 justify-center">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You'll receive a confirmation email once payment is
                    successful.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={onContinue}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                This page will update automatically when payment is confirmed
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}