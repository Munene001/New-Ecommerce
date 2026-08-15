"use client";

import { Smartphone, Phone, Clock, Loader2, Package, CreditCard } from "lucide-react";
import { useEffect } from "react";

interface STKPushFormProps {
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  orderNumber: string | null;
  totalAmount: number;
  disabled?: boolean;
}

export function STKPushForm({
  phoneNumber,
  onPhoneChange,
  loading,
  onSubmit,
  orderNumber,
  totalAmount,
  disabled = false,
}: STKPushFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      onSubmit();
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Smartphone className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Complete Your Payment</h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-sm text-green-50">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Package className="w-4 h-4" />
                <span>Order #{orderNumber || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <CreditCard className="w-4 h-4" />
                <span>KSh {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="0712345678"
                  disabled={loading || disabled}
                  className="w-full pl-10 pr-4 py-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter the phone number registered with M-Pesa
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You will receive a prompt on your registered M-Pesa phone number.
                  Enter your PIN to complete the payment.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || disabled}
              className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-lg bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>Pay KSh {totalAmount.toLocaleString()}</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              You will not be charged until you confirm the payment
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}