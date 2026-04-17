"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

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

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  paidOrders: number;
  pendingPayment: number;
}

interface UseDashboardOrdersReturn {
  orders: Order[];
  stats: DashboardStats;
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
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: string) => Promise<boolean>;
  updatePaymentStatus: (orderId: number, status: string) => Promise<boolean>;
  cancelOrder: (orderId: number) => Promise<boolean>;
  deleteOrder: (orderId: number) => Promise<boolean>;
  getOrderWithItems: (orderId: number) => Promise<OrderWithItems | null>;
  getOrderItems: (orderId: number) => Promise<OrderItem[]>;
}

export function useDashboardOrders(shopId: string): UseDashboardOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    paidOrders: 0,
    pendingPayment: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Filter states
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [currentDateFrom, setCurrentDateFrom] = useState<string>('');
  const [currentDateTo, setCurrentDateTo] = useState<string>('');
  const [currentSearch, setCurrentSearch] = useState<string>('');

  const initialFetchDone = useRef(false);

  // Calculate stats from orders array
  const calculateStats = useCallback((ordersList: Order[]): DashboardStats => {
    const totalOrders = ordersList.length;
    const pendingOrders = ordersList.filter(o => o.order_status === 'pending').length;
    const processingOrders = ordersList.filter(o => o.order_status === 'processing').length;
    const completedOrders = ordersList.filter(o => o.order_status === 'delivered').length;
    const cancelledOrders = ordersList.filter(o => o.order_status === 'cancelled').length;
    const paidOrders = ordersList.filter(o => o.payment_status === 'paid').length;
    const pendingPayment = ordersList.filter(o => o.payment_status === 'pending').length;
    const totalRevenue = ordersList
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.subtotal, 0);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      paidOrders,
      pendingPayment,
    };
  }, []);

  const fetchOrders = useCallback(async (
    page: number,
    status?: string,
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
      
      if (status) params.append('status', status);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (search) params.append('search', search);

      const res = await fetch(`/api/shopowner/orders?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await res.json();

      const newOrders = append ? [...orders, ...data.orders] : data.orders;
      setOrders(newOrders);
      setStats(calculateStats(newOrders));
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);

    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, orders, calculateStats]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && shopId) {
      initialFetchDone.current = true;
      fetchOrders(1, currentStatus, currentDateFrom, currentDateTo, currentSearch, false);
    }
  }, [fetchOrders, shopId, currentStatus, currentDateFrom, currentDateTo, currentSearch]);

  const hasMore = currentPage < totalPages;

  const refreshOrders = useCallback(async () => {
    await fetchOrders(currentPage, currentStatus, currentDateFrom, currentDateTo, currentSearch, false);
  }, [currentPage, currentStatus, currentDateFrom, currentDateTo, currentSearch, fetchOrders]);

  const filterByStatus = async (status: string) => {
    setCurrentStatus(status);
    setCurrentDateFrom('');
    setCurrentDateTo('');
    setCurrentSearch('');
    await fetchOrders(1, status, '', '', '', false);
  };

  const filterByDateRange = async (from: string, to: string) => {
    setCurrentDateFrom(from);
    setCurrentDateTo(to);
    setCurrentStatus('');
    setCurrentSearch('');
    await fetchOrders(1, '', from, to, '', false);
  };

  const searchOrders = async (term: string) => {
    setCurrentSearch(term);
    setCurrentStatus('');
    setCurrentDateFrom('');
    setCurrentDateTo('');
    await fetchOrders(1, '', '', '', term, false);
  };

  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages) return;
    await fetchOrders(page, currentStatus, currentDateFrom, currentDateTo, currentSearch, false);
  };

  const loadMoreOrders = async () => {
    if (loading || !hasMore) return;
    await fetchOrders(currentPage + 1, currentStatus, currentDateFrom, currentDateTo, currentSearch, true);
  };

  const resetFilters = async () => {
    setCurrentStatus('');
    setCurrentDateFrom('');
    setCurrentDateTo('');
    setCurrentSearch('');
    await fetchOrders(1, '', '', '', '', false);
  };

  const updateOrderStatus = async (orderId: number, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', value: status }),
      });
      
      if (res.ok) {
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  };

  const updatePaymentStatus = async (orderId: number, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payment', value: status }),
      });
      
      if (res.ok) {
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update payment status:', error);
      return false;
    }
  };

  const cancelOrder = async (orderId: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      
      if (res.ok) {
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  };

  const deleteOrder = async (orderId: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await refreshOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete order:', error);
      return false;
    }
  };

  // New: Get single order with its items
  const getOrderWithItems = async (orderId: number): Promise<OrderWithItems | null> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await res.json();
      
      if (data.success) {
        return {
          ...data.order,
          items: data.items || []
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch order with items:', error);
      return null;
    }
  };

  // New: Get only order items
  const getOrderItems = async (orderId: number): Promise<OrderItem[]> => {
    try {
      const res = await fetch(`/api/shopowner/orders/${orderId}/items`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch order items');
      }

      const data = await res.json();
      
      if (data.success) {
        return data.items;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch order items:', error);
      return [];
    }
  };

  return {
    orders,
    stats,
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
    refreshOrders,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    deleteOrder,
    getOrderWithItems,
    getOrderItems,
  };
}