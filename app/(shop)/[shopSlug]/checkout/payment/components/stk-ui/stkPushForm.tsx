// components/stk-ui/STKPushForm.tsx
"use client";

import { Smartphone, Phone, Clock, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface STKPushFormProps {
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  orderNumber: string | null;
  disabled?: boolean;
}

export function STKPushForm({
  phoneNumber,
  onPhoneChange,
  loading,
  onSubmit,
  orderNumber,
  disabled = false,
}: STKPushFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      onSubmit();
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="relative p-8 text-center bg-gradient-to-br from-green-500 to-emerald-600">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Smartphone className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Complete Payment</h1>
              <p className="text-green-50 text-sm">Enter your phone number to receive an M-Pesa prompt</p>
            </div>
          </div>
          
          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="0712345678"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  disabled={loading || disabled}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the phone number registered with M-Pesa
              </p>
            </div>
            
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You will receive a prompt on your registered M-Pesa phone number. 
                  Enter your PIN to complete the payment.
                </p>
              </div>
            </div>
            
            {/* Order Number */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{orderNumber}</p>
            </div>
            
            {/* Pay Button */}
            <button
              type="submit"
              disabled={loading || disabled}
              className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending STK Push...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>Pay with STK Push</span>
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