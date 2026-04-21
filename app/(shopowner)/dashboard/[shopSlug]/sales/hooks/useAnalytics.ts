"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_time: number;
}

interface TopProduct {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface CityOrder {
  city: string;
  order_count: number;
  revenue: number;
}

interface HourlyDistribution {
  hour: number;
  order_count: number;
}

interface AnalyticsMetrics {
  bestSeller: {
    product_name: string;
    quantity_sold: number;
  } | null;
  paymentSplit: {
    mpesa: number;
    cod: number;
    mpesa_percentage: number;
    cod_percentage: number;
  };
  conversionRate: number; // paid orders / total orders * 100
  topCity: {
    city: string;
    order_count: number;
  } | null;
}

interface UseAnalyticsReturn {
  metrics: AnalyticsMetrics;
  topProducts: TopProduct[];
  revenueVsOrders: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  hourlyDistribution: HourlyDistribution[];
  ordersByCity: CityOrder[];
  loading: boolean;
  filterByDateRange: (from: string, to: string) => Promise<void>;
  resetFilters: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

export function useAnalytics(shopId: string): UseAnalyticsReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Filter states
  const [currentDateFrom, setCurrentDateFrom] = useState<string>('');
  const [currentDateTo, setCurrentDateTo] = useState<string>('');
  
  const initialFetchDone = useRef(false);

  // Fetch all orders and order items for analytics
  const fetchAnalyticsData = useCallback(async (
    dateFrom?: string,
    dateTo?: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        shop_id: shopId,
        limit: '1000', // Get enough data for analytics
      });
      
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      // Fetch orders
      const ordersRes = await fetch(`/api/shopowner/orders?${params}`);
      const ordersData = await ordersRes.json();
      
      if (ordersData.success) {
        setOrders(ordersData.orders);
      }

      // Fetch all order items for these orders
      // Note: You might need a separate API for bulk order items
      // For now, we'll fetch items per order (optimize later)
      const allItems: OrderItem[] = [];
      for (const order of ordersData.orders) {
        const itemsRes = await fetch(`/api/shopowner/orders/${order.order_id}/items`);
        const itemsData = await itemsRes.json();
        if (itemsData.success) {
          allItems.push(...itemsData.items);
        }
      }
      setOrderItems(allItems);

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // Calculate analytics metrics from orders data
  const metrics = useMemo((): AnalyticsMetrics => {
    // Best Seller
    const productSales = new Map<string, number>();
    orderItems.forEach(item => {
      const current = productSales.get(item.product_name) || 0;
      productSales.set(item.product_name, current + item.quantity);
    });
    
    let bestSeller = null;
    let maxQty = 0;
    for (const [product, qty] of productSales) {
      if (qty > maxQty) {
        maxQty = qty;
        bestSeller = { product_name: product, quantity_sold: qty };
      }
    }

    // Payment Split
    const totalOrders = orders.length;
    const mpesaOrders = orders.filter(o => o.payment_method === 'mpesa').length;
    const codOrders = orders.filter(o => o.payment_method === 'cash_on_delivery').length;
    
    const paymentSplit = {
      mpesa: mpesaOrders,
      cod: codOrders,
      mpesa_percentage: totalOrders > 0 ? (mpesaOrders / totalOrders) * 100 : 0,
      cod_percentage: totalOrders > 0 ? (codOrders / totalOrders) * 100 : 0,
    };

    // Conversion Rate (paid vs total)
    const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    // Top City
    const cityOrders = new Map<string, number>();
    orders.forEach(order => {
      const city = order.customer_city;
      const current = cityOrders.get(city) || 0;
      cityOrders.set(city, current + 1);
    });
    
    let topCity = null;
    let maxOrders = 0;
    for (const [city, count] of cityOrders) {
      if (count > maxOrders) {
        maxOrders = count;
        topCity = { city, order_count: count };
      }
    }

    return {
      bestSeller,
      paymentSplit,
      conversionRate,
      topCity,
    };
  }, [orders, orderItems]);

  // Top Products by Revenue
  const topProducts = useMemo((): TopProduct[] => {
    const productRevenue = new Map<string, { quantity: number; revenue: number }>();
    
    orderItems.forEach(item => {
      const current = productRevenue.get(item.product_name);
      const revenue = item.quantity * item.price_at_time;
      
      if (current) {
        current.quantity += item.quantity;
        current.revenue += revenue;
      } else {
        productRevenue.set(item.product_name, { quantity: item.quantity, revenue });
      }
    });
    
    const products = Array.from(productRevenue.entries()).map(([name, data]) => ({
      product_name: name,
      quantity_sold: data.quantity,
      revenue: data.revenue,
    }));
    
    return products.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orderItems]);

  // Revenue vs Orders Summary
  const revenueVsOrders = useMemo(() => {
    const paidOrdersList = orders.filter(o => o.payment_status === 'paid');
    const totalRevenue = paidOrdersList.reduce((sum, o) => sum + o.subtotal, 0);
    const totalOrders = paidOrdersList.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = orders.length > 0 ? (totalOrders / orders.length) * 100 : 0;
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
    };
  }, [orders]);

  // Hourly Distribution
  const hourlyDistribution = useMemo((): HourlyDistribution[] => {
    const hourCount = new Array(24).fill(0);
    
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourCount[hour]++;
    });
    
    return hourCount.map((count, hour) => ({ hour, order_count: count }));
  }, [orders]);

  // Orders by City
  const ordersByCity = useMemo((): CityOrder[] => {
    const cityMap = new Map<string, { count: number; revenue: number }>();
    
    orders.forEach(order => {
      const city = order.customer_city;
      const current = cityMap.get(city);
      
      if (current) {
        current.count++;
        if (order.payment_status === 'paid') {
          current.revenue += order.subtotal;
        }
      } else {
        cityMap.set(city, {
          count: 1,
          revenue: order.payment_status === 'paid' ? order.subtotal : 0,
        });
      }
    });
    
    const cities = Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      order_count: data.count,
      revenue: data.revenue,
    }));
    
    return cities.sort((a, b) => b.order_count - a.order_count);
  }, [orders]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && shopId) {
      initialFetchDone.current = true;
      fetchAnalyticsData(currentDateFrom, currentDateTo);
    }
  }, [fetchAnalyticsData, shopId, currentDateFrom, currentDateTo]);

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalyticsData(currentDateFrom, currentDateTo);
  }, [currentDateFrom, currentDateTo, fetchAnalyticsData]);

  const filterByDateRange = async (from: string, to: string) => {
    setCurrentDateFrom(from);
    setCurrentDateTo(to);
    await fetchAnalyticsData(from, to);
  };

  const resetFilters = async () => {
    setCurrentDateFrom('');
    setCurrentDateTo('');
    await fetchAnalyticsData('', '');
  };

  return {
    metrics,
    topProducts,
    revenueVsOrders,
    hourlyDistribution,
    ordersByCity,
    loading,
    filterByDateRange,
    resetFilters,
    refreshAnalytics,
  };
}