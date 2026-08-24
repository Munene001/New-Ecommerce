'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from "@/app/components/ui/button";
import { CreditCard, Truck } from "lucide-react";
import PaymentsStatsCards from "./components/pstatsCard";
import TransactionsTable from './components/transactionTable';
import TransactionsFilters from './components/transactionFilters';
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { useDashboardPayments } from "./hooks/useDashboardPayments";

export default function PaymentsPage() {
  const { shopSlug, shopId } = useShop();
  
  const {
    transactions,
    stats,
    loading,
    hasMore,
    loadMoreTransactions,
    applyFilters, // 👈 Import applyFilters
    resetFilters,
  } = useDashboardPayments(shopId ? String(shopId) : '');

  // Handle filter changes cleanly with a single API request
  const handleFilterChange = (filters: {
    paymentType: string;
    dateFrom: string;
    dateTo: string;
    search: string;
  }) => {
    applyFilters({
      paymentType: filters.paymentType,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: filters.search,
    });
  };

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      {/* Stats Cards */}
      <PaymentsStatsCards
        totalRevenue={stats.totalRevenue}
        monthlyRevenue={stats.monthlyRevenue}
        stkPayments={stats.stkPayments}
        stkPaymentRate={stats.stkPaymentRate}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
        <Link href={`/dashboard/${shopSlug}/payments/configuration`}>
          <Button
            className="flex flex-row gap-2 items-center justify-center w-full sm:w-auto"
            variant="secondary"
          >
            <CreditCard size={18} />
            <span>Payment Configuration</span>
          </Button>
        </Link>

        <Link href={`/dashboard/${shopSlug}/payments/delivery`}>
          <Button
            className="flex flex-row gap-2 items-center justify-center w-full sm:w-auto"
            variant="secondary"
          >
            <Truck size={18} />
            <span>Delivery Fee Settings</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <TransactionsFilters
          onFilterChange={handleFilterChange}
          onReset={resetFilters}
          loading={loading}
        />
      </div>

      {/* Transactions Table */}
      <div className="mt-6">
        <TransactionsTable
          transactions={transactions}
          loading={loading}
          hasMore={hasMore}
          loadMore={loadMoreTransactions}
          shopSlug={shopSlug || ''}
        />
      </div>
    </div>
  );
}