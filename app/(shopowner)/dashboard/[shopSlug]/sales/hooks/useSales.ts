// app/(dashboard)/[shopSlug]/hooks/useSales.ts
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
  special_instructions: string | null;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
  total_price: number;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingDelivery: number;
  averageOrderValue: number;
}

interface UseSalesReturn {
  orders: Order[];
  metrics: SalesMetrics;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  filterByStatus: (status: string) => Promise<void>;
  filterByDateRange: (from: string, to: string) => Promise<void>;
  searchOrders: (term: string) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  resetFilters: () => Promise<void>;
  refreshSales: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: string) => Promise<boolean>;
  deleteOrder: (orderId: number) => Promise<boolean>;
  getSaleWithItems: (orderId: number) => Promise<OrderWithItems | null>;
}

export function useSales(shopId: string): UseSalesReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Filter states
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string>('');
  const [currentDateFrom, setCurrentDateFrom] = useState<string>('');
  const [currentDateTo, setCurrentDateTo] = useState<string>('');
  const [currentSearch, setCurrentSearch] = useState<string>('');

  const initialFetchDone = useRef(false);

  // Helper function to safely parse subtotal
  const parseSubtotal = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Calculate sales metrics from orders (only paid orders)
  const metrics = useMemo((): SalesMetrics => {
    // Only consider paid orders for sales metrics
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    
    const totalRevenue = paidOrders.reduce((sum, o) => {
      const amount = parseSubtotal(o.subtotal);
      return sum + amount;
    }, 0);
    
    const totalOrders = paidOrders.length;
    const pendingDelivery = paidOrders.filter(o => o.order_status !== 'delivered').length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalRevenue,
      totalOrders,
      pendingDelivery,
      averageOrderValue,
    };
  }, [orders]);

  const fetchOrders = useCallback(async (
    page: number,
    paymentStatus?: string,
    orderStatus?: string,
    dateFrom?: string,
    dateTo?: string,
    search?: string,
    append: boolean = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        shop_id: shopId,
        page: page.toString(),
        limit: '20',
      });
      
      if (paymentStatus) params.append('payment_status', paymentStatus);
      if (orderStatus) params.append('status', orderStatus);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (search) params.append('search', search);

      const res = await fetch(`/api/shopowner/orders?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await res.json();
      
      const ordersData = (data.orders || []).map((order: any) => ({
        ...order,
        subtotal: parseSubtotal(order.subtotal)
      }));

      const newOrders = append ? [...orders, ...ordersData] : ordersData;
      setOrders(newOrders);
      setCurrentPage(data.pagination?.currentPage || 1);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);

    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, orders]);

  // Initial fetch - get orders with payment_status = 'paid'
  useEffect(() => {
    if (!initialFetchDone.current && shopId) {
      initialFetchDone.current = true;
      fetchOrders(1, 'paid', '', currentDateFrom, currentDateTo, currentSearch, false);
    }
  }, [fetchOrders, shopId, currentDateFrom, currentDateTo, currentSearch]);

  const hasMore = currentPage < totalPages;

  const refreshSales = useCallback(async () => {
    await fetchOrders(1, 'paid', currentOrderStatus, currentDateFrom, currentDateTo, currentSearch, false);
  }, [currentDateFrom, currentDateTo, currentSearch, currentOrderStatus, fetchOrders]);

  const filterByStatus = async (status: string) => {
    setCurrentOrderStatus(status);
    await fetchOrders(1, 'paid', status, currentDateFrom, currentDateTo, currentSearch, false);
  };

  const filterByDateRange = async (from: string, to: string) => {
    setCurrentDateFrom(from);
    setCurrentDateTo(to);
    await fetchOrders(1, 'paid', currentOrderStatus, from, to, currentSearch, false);
  };

  const searchOrders = async (term: string) => {
    setCurrentSearch(term);
    await fetchOrders(1, 'paid', currentOrderStatus, currentDateFrom, currentDateTo, term, false);
  };

  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages) return;
    await fetchOrders(page, 'paid', currentOrderStatus, currentDateFrom, currentDateTo, currentSearch, false);
  };

  const loadMoreOrders = async () => {
    if (loading || !hasMore) return;
    await fetchOrders(currentPage + 1, 'paid', currentOrderStatus, currentDateFrom, currentDateTo, currentSearch, true);
  };

  const resetFilters = async () => {
    setCurrentDateFrom('');
    setCurrentDateTo('');
    setCurrentSearch('');
    setCurrentOrderStatus('');
    await fetchOrders(1, 'paid', '', '', '', '', false);
  };

  const updateOrderStatus = async (orderId: number, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', value: status }),
      });
      
      if (res.ok) {
        await refreshSales();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  };

  const deleteOrder = async (orderId: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await refreshSales();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete order:', error);
      return false;
    }
  };

  // New: Get single sale with its items
  const getSaleWithItems = async (orderId: number): Promise<OrderWithItems | null> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch sale');
      }

      const data = await res.json();
      
      if (data.success) {
        return {
          ...data.order,
          subtotal: parseSubtotal(data.order.subtotal),
          items: data.items || []
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch sale with items:', error);
      return null;
    }
  };

  return {
    orders,
    metrics,
    loading,
    currentPage,
    totalPages,
    totalCount,
    hasMore,
    filterByStatus,
    filterByDateRange,
    searchOrders,
    goToPage,
    loadMoreOrders,
    resetFilters,
    refreshSales,
    updateOrderStatus,
    deleteOrder,
    getSaleWithItems,
  };
}