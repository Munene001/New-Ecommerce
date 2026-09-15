'use client';

import { Smartphone, Phone, Loader2 } from 'lucide-react';

interface POSStkPushFormProps {
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  orderNumber: string | null;
  totalAmount: number;
  disabled?: boolean;
}

export function POSStkPushForm({
  phoneNumber,
  onPhoneChange,
  loading,
  onSubmit,
  orderNumber,
  totalAmount,
  disabled = false,
}: POSStkPushFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <div className="flex items-center gap-2 text-xs text-blue-800">
          <Smartphone className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">
            Order {orderNumber || '—'} · KES {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Customer M-Pesa Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="0712345678"
            disabled={loading || disabled}
            autoFocus
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || disabled || phoneNumber.length < 10}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4" />
            Send Push to Customer
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Customer will receive an M-Pesa prompt on their phone
      </p>
    </form>
  );
}