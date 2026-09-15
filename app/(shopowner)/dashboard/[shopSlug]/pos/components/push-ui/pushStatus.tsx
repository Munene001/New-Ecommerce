'use client';

import {
  Loader2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

type PushStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

interface POSPushStatusProps {
  status: PushStatus;
  statusMessage: string;
  orderNumber: string | null;
  totalAmount: number;
  retryable: boolean;
  retryCount: number;
  onRetry: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function POSPushStatus({
  status,
  statusMessage,
  orderNumber,
  totalAmount,
  retryable,
  retryCount,
  onRetry,
  onCancel,
  loading = false,
}: POSPushStatusProps) {
  if (status === 'pending') {
    return (
      <div className="space-y-4 text-center py-4 text-black">
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-blue-800 animate-spin" />
        </div>
        <div>
          <h4 className="font-extrabold text-lg text-black">Waiting for Customer</h4>
          <p className="text-xs font-bold text-black mt-1">
            {statusMessage || 'Prompt sent. Waiting for PIN entry...'}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 border-2 border-blue-300 p-3 text-left">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 font-bold">
              <p className="font-extrabold">Order {orderNumber || '—'}</p>
              <p>KES {totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 text-xs font-bold text-black hover:bg-gray-100 rounded-lg border-2 border-gray-300"
        >
          Cancel Payment
        </button>
      </div>
    );
  }

  if (status === 'failed' || status === 'cancelled') {
    const showRetry = retryable && retryCount < 3;
    const tooManyAttempts = retryCount >= 3;

    return (
      <div className="space-y-4 py-2 text-black">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-700" />
          </div>
          <h4 className="font-extrabold text-lg text-black mt-3">
            {tooManyAttempts
              ? 'Too Many Attempts'
              : status === 'cancelled'
              ? 'Payment Cancelled'
              : 'Payment Failed'}
          </h4>
          <p className="text-xs font-bold text-black mt-1">{statusMessage}</p>
        </div>

        {!tooManyAttempts && retryable && (
          <div className="rounded-lg bg-amber-50 border-2 border-amber-300 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-900 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-extrabold text-amber-950">
                You can retry ({retryCount}/3 attempts used)
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {showRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white font-extrabold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-white" />
                  Retry Push ({3 - retryCount} left)
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold text-black rounded-lg border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}