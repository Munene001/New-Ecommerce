// app/(dashboard)/[shopSlug]/analytics/hooks/useAnalytics.ts
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface TopProduct {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface BestSeller {
  product_name: string;
  revenue: number;
}

interface PaymentSplit {
  mpesa: number;
  cod: number;
  mpesa_percentage: number;
  cod_percentage: number;
}

interface HourlyDistribution {
  hour: number;
  order_count: number;
}

interface OrdersByCity {
  city: string;
  order_count: number;
  revenue: number;
}

interface WeekendVsWeekday {
  weekend: number;
  weekday: number;
  weekend_percentage: number;
  weekday_percentage: number;
}

interface AnalyticsSummary {
  totalRevenue: number;
  totalPaidOrders: number;
  averageOrderValue: number;
  totalAllOrders: number;
  collectionRate: number;
  avgItemsPerOrder: number;
  returningCustomersRate: number;
  weekendVsWeekday: WeekendVsWeekday;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  topProducts: TopProduct[];
  bestSeller: BestSeller | null;
  paymentSplit: PaymentSplit;
  hourlyDistribution: HourlyDistribution[];
  ordersByCity: OrdersByCity[];
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
}

export function useAnalytics(shopId: string): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const initialFetchDone = useRef(false);

  const fetchAnalytics = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shopowner/analytics?shop_id=${shopId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && shopId) {
      initialFetchDone.current = true;
      fetchAnalytics();
    }
  }, [fetchAnalytics, shopId]);

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refreshAnalytics,
  };
}