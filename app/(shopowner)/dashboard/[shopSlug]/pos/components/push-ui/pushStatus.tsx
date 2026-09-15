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
      <div className="space-y-4 text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">Waiting for Customer</h4>
          <p className="text-xs text-gray-500 mt-1">
            {statusMessage || 'Prompt sent. Waiting for PIN entry...'}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-left">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Order {orderNumber || '—'}</p>
              <p>KES {totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-xs text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200"
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
      <div className="space-y-4 py-2">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <h4 className="font-semibold text-gray-800 mt-3">
            {tooManyAttempts
              ? 'Too Many Attempts'
              : status === 'cancelled'
              ? 'Payment Cancelled'
              : 'Payment Failed'}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{statusMessage}</p>
        </div>

        {!tooManyAttempts && retryable && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
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
              className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retry Push ({3 - retryCount} left)
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full py-2.5 text-sm text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}