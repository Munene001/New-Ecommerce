// app/(shopowner)/dashboard/[shopSlug]/payments/components/transactionTable.tsx
'use client';

import { useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface Transaction {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  payment_method: string;
  checkout_id: string | null;
  receipt_number: string | null;
  created_at: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  shopSlug: string;
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-gray-300 h-[72px] items-center w-full">
    <div className="w-[12%] px-4"><div className="h-4 bg-gray-300 rounded w-28 animate-pulse"></div></div>
    <div className="w-[15%] px-4"><div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div></div>
    <div className="w-[12%] px-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></div>
    <div className="w-[14%] px-4"><div className="h-6 bg-gray-300 rounded-full w-24 animate-pulse"></div></div>
    <div className="w-[15%] px-4"><div className="h-4 bg-gray-300 rounded w-28 animate-pulse"></div></div>
    <div className="w-[12%] px-4"><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></div>
    <div className="w-[10%] px-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></div>
  </div>
);

const getPaymentMethodColor = (method: string) => {
  if (method === 'STK Push') {
    return 'bg-purple-100 text-purple-800 border-purple-300';
  }
  if (method === 'Direct M-Pesa') {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  }
  if (method === 'COD') {
    return 'bg-orange-100 text-orange-800 border-orange-300';
  }
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getPaymentMethodIcon = (method: string) => {
  if (method === 'STK Push') return 'mdi:cellphone-check';
  if (method === 'Direct M-Pesa') return 'mdi:cellphone';
  if (method === 'COD') return 'mdi:cash';
  return 'mdi:credit-card';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return `KES ${amount.toLocaleString()}`;
};

const truncateId = (id: string | null, maxLength: number = 12) => {
  if (!id) return '—';
  if (id.length <= maxLength) return id;
  return `${id.substring(0, maxLength)}...`;
};

export default function TransactionsTable({
  transactions,
  loading,
  hasMore,
  loadMore,
  shopSlug,
}: TransactionsTableProps) {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastTransactionRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const handleRowClick = (orderId: number) => {
    router.push(`/dashboard/${shopSlug}/payments/${orderId}`);
  };

  return (
    <div className="w-full relative">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1100px] md:min-w-0">
          {/* Table header */}
          <div className="flex flex-row border-b border-gray-400 h-[52px] items-center text-gray-700 font-semibold text-sm bg-gray-100 w-full">
            <div className="w-[12%] px-4 text-left">Order #</div>
            <div className="w-[15%] px-4 text-left">Customer</div>
            <div className="w-[12%] px-4 text-left">Phone</div>
            <div className="w-[10%] px-4 text-left">Amount</div>
            <div className="w-[14%] px-4 text-left">Payment Method</div>
            <div className="w-[15%] px-4 text-left">Transaction ID</div>
            <div className="w-[12%] px-4 text-left">Receipt</div>
            <div className="w-[10%] px-4 text-left">Date</div>
          </div>

          {/* Table content */}
          {loading && transactions.length === 0 ? (
            <div className="mt-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : transactions.length > 0 ? (
            <div className="mt-2">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.order_id}
                  ref={index === transactions.length - 1 ? lastTransactionRef : null}
                  onClick={() => handleRowClick(transaction.order_id)}
                  className="flex flex-row border-b border-gray-300 min-h-[72px] items-center hover:bg-gray-100 transition-colors cursor-pointer w-full"
                >
                  <div className="w-[12%] px-4 text-left">
                    <span className="font-semibold text-gray-800 text-sm">
                      {transaction.order_number}
                    </span>
                  </div>

                  <div className="w-[15%] px-4 text-left">
                    <div className="text-black text-sm font-medium truncate">
                      {transaction.customer_name}
                    </div>
                  </div>

                  <div className="w-[12%] px-4 text-left">
                    <div className="text-black font-medium text-sm">
                      {transaction.customer_phone}
                    </div>
                  </div>

                  <div className="w-[10%] px-4 text-left">
                    <div className="text-gray-800 font-semibold text-sm">
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>

                  <div className="w-[14%] px-4 text-left">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${getPaymentMethodColor(transaction.payment_method)}`}>
                      <Icon icon={getPaymentMethodIcon(transaction.payment_method)} className="w-3.5 h-3.5" />
                      {transaction.payment_method}
                    </span>
                  </div>

                  <div className="w-[15%] px-4 text-left">
                    <div className="text-gray-700 text-xs truncate font-mono" title={transaction.checkout_id || ''}>
                      {truncateId(transaction.checkout_id)}
                    </div>
                  </div>

                  <div className="w-[12%] px-4 text-left">
                    <div className="text-gray-700 text-sm truncate font-mono" title={transaction.receipt_number || ''}>
                      {transaction.receipt_number || '—'}
                    </div>
                  </div>

                  <div className="w-[10%] px-4 text-left">
                    <div className="text-black text-sm">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>
              ))}

              {loading && transactions.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-amber-700" />
                </div>
              )}

              {!hasMore && transactions.length > 0 && (
                <div className="text-center py-4 text-gray-600 text-sm">
                  No more transactions to load
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-gray-600">
              <Icon icon="mdi:credit-card-off" className="w-16 h-16 mb-4 text-gray-500" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}