"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

export interface PaymentTransaction {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  payment_method: 'COD' | 'Direct M-Pesa' | 'STK Push' | 'M-Pesa';
  receipt_number: string | null;
  checkout_id: string | null;
  reference: string | null; // Kept for backwards compatibility (aliases receipt_number or checkout_id)
  created_at: string;
}

export interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  stkPayments: number;
  stkPaymentRate: number;
}

export interface PaymentDetail extends PaymentTransaction {
  provider: 'Safaricom' | 'Kopokopo' | null;
  result_code: number | null;
  result_description: string | null;
  status: string;
  delivery_fee: number;
  delivery_zone: string | null;
}

export interface FilterParams {
  paymentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UseDashboardPaymentsReturn {
  transactions: PaymentTransaction[];
  stats: PaymentStats;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  applyFilters: (filters: FilterParams) => Promise<void>;
  filterByPaymentType: (type: string) => Promise<void>;
  filterByDateRange: (from: string, to: string) => Promise<void>;
  searchTransactions: (term: string) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  resetFilters: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  getPaymentDetail: (orderId: number) => Promise<PaymentDetail | null>;
}

export function useDashboardPayments(shopId: string): UseDashboardPaymentsReturn {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    stkPayments: 0,
    stkPaymentRate: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [currentPaymentType, setCurrentPaymentType] = useState<string>('');
  const [currentDateFrom, setCurrentDateFrom] = useState<string>('');
  const [currentDateTo, setCurrentDateTo] = useState<string>('');
  const [currentSearch, setCurrentSearch] = useState<string>('');

  const initialFetchDone = useRef(false);

  // Core API Fetch Function
  const fetchTransactions = useCallback(async (
    page: number,
    paymentType?: string,
    dateFrom?: string,
    dateTo?: string,
    search?: string,
    append: boolean = false
  ) => {
    if (!shopId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        shop_id: shopId,
        page: page.toString(),
        limit: '20',
      });

      if (paymentType) params.append('payment_type', paymentType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (search) params.append('search', search);

      const res = await fetch(`/api/shopowner/payments/transactions?${params}`);

      if (!res.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await res.json();

      // Normalize transaction records from backend API schema
      const normalizedTransactions: PaymentTransaction[] = data.transactions.map((tx: any) => ({
        order_id: tx.order_id,
        order_number: tx.order_number,
        customer_name: tx.customer_name,
        customer_phone: tx.customer_phone,
        amount: tx.amount,
        payment_method: tx.payment_method,
        receipt_number: tx.receipt_number || null,
        checkout_id: tx.checkout_id || null,
        reference: tx.receipt_number || tx.checkout_id || null,
        created_at: tx.created_at,
      }));

      setTransactions((prev) => (append ? [...prev, ...normalizedTransactions] : normalizedTransactions));
      setStats(data.stats);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);

    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchTransactions(1, '', '', '', '', false);
    }
  }, [shopId, fetchTransactions]);

  const hasMore = currentPage < totalPages;

  const applyFilters = useCallback(async ({ paymentType = '', dateFrom = '', dateTo = '', search = '' }: FilterParams) => {
    setCurrentPaymentType(paymentType);
    setCurrentDateFrom(dateFrom);
    setCurrentDateTo(dateTo);
    setCurrentSearch(search);

    await fetchTransactions(1, paymentType, dateFrom, dateTo, search, false);
  }, [fetchTransactions]);

  const refreshTransactions = useCallback(async () => {
    await fetchTransactions(currentPage, currentPaymentType, currentDateFrom, currentDateTo, currentSearch, false);
  }, [currentPage, currentPaymentType, currentDateFrom, currentDateTo, currentSearch, fetchTransactions]);

  const filterByPaymentType = useCallback(async (type: string) => {
    await applyFilters({ paymentType: type, dateFrom: currentDateFrom, dateTo: currentDateTo, search: currentSearch });
  }, [applyFilters, currentDateFrom, currentDateTo, currentSearch]);

  const filterByDateRange = useCallback(async (from: string, to: string) => {
    await applyFilters({ paymentType: currentPaymentType, dateFrom: from, dateTo: to, search: currentSearch });
  }, [applyFilters, currentPaymentType, currentSearch]);

  const searchTransactions = useCallback(async (term: string) => {
    await applyFilters({ paymentType: currentPaymentType, dateFrom: currentDateFrom, dateTo: currentDateTo, search: term });
  }, [applyFilters, currentPaymentType, currentDateFrom, currentDateTo]);

  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) return;
    await fetchTransactions(page, currentPaymentType, currentDateFrom, currentDateTo, currentSearch, false);
  }, [totalPages, currentPaymentType, currentDateFrom, currentDateTo, currentSearch, fetchTransactions]);

  const loadMoreTransactions = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchTransactions(currentPage + 1, currentPaymentType, currentDateFrom, currentDateTo, currentSearch, true);
  }, [loading, hasMore, currentPage, currentPaymentType, currentDateFrom, currentDateTo, currentSearch, fetchTransactions]);

  const resetFilters = useCallback(async () => {
    setCurrentPaymentType('');
    setCurrentDateFrom('');
    setCurrentDateTo('');
    setCurrentSearch('');
    await fetchTransactions(1, '', '', '', '', false);
  }, [fetchTransactions]);

  const getPaymentDetail = useCallback(async (orderId: number): Promise<PaymentDetail | null> => {
    try {
      const res = await fetch(`/api/shopowner/payments/transactions/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch payment details');

      const data = await res.json();
      if (!data.success) return null;

      const tx = data.transaction;
      return {
        ...tx,
        reference: tx.receipt_number || tx.checkout_id || null,
      };
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      return null;
    }
  }, []);

  return {
    transactions,
    stats,
    loading,
    currentPage,
    totalPages,
    totalCount,
    hasMore,
    applyFilters,
    filterByPaymentType,
    filterByDateRange,
    searchTransactions,
    goToPage,
    loadMoreTransactions,
    resetFilters,
    refreshTransactions,
    getPaymentDetail,
  };
}