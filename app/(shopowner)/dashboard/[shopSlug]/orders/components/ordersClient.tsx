'use client';

import { useState, useRef, useEffect } from "react";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import StatsCards from "./statsCard";
import OrdersTable from "./ordersTable";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import { X } from "lucide-react";

interface OrdersClientProps {
  shopId: number;
  shopSlug: string;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
}

export default function OrdersClient({
  shopId,
  shopSlug,
  totalOrders,
  pendingOrders,
  processingOrders,
  completedOrders,
}: OrdersClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    orders,
    loading,
    hasMore,
    loadMoreOrders,
    searchOrders,
    filterByStatus,
    filterByDateRange,
    resetFilters,
    refreshOrders,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
  } = useDashboardOrders(shopId.toString());

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        setMessage(null);
      }, 5000);
      
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchOrders(value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    filterByStatus(value);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateFrom(value);
    if (value && dateTo) {
      filterByDateRange(value, dateTo);
    }
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateTo(value);
    if (dateFrom && value) {
      filterByDateRange(dateFrom, value);
    }
  };

  const handleReset = () => {
    setSearchInput("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    resetFilters();
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    const success = await updateOrderStatus(orderId, status);
    if (success) {
      setMessage({ type: 'success', text: `Order status updated to ${status}` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
    return success;
  };

  const handleCancelOrder = async (orderId: number) => {
    const success = await cancelOrder(orderId);
    if (success) {
      setMessage({ type: 'success', text: 'Order cancelled successfully' });
    } else {
      setMessage({ type: 'error', text: 'Failed to cancel order' });
    }
    return success;
  };

  const handleDeleteOrder = async (orderId: number) => {
    const success = await deleteOrder(orderId);
    if (success) {
      setMessage({ type: 'success', text: 'Order deleted successfully' });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete order' });
    }
    return success;
  };

  const hasActiveFilters = searchInput !== "" || statusFilter !== "" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      <StatsCards
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        processingOrders={processingOrders}
        completedOrders={completedOrders}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 my-4">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchInput}
            onChange={handleSearch}
            className="w-full border border-gray-300 px-4 h-[50px] pl-12 rounded-lg bg-white text-black"
          />
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
        </div>

        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="w-48 border border-gray-300 h-[50px] px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-magenta-dark"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={handleDateFromChange}
          className="w-40 border border-gray-300 h-[50px] px-4 rounded-lg"
          placeholder="From"
        />

        <input
          type="date"
          value={dateTo}
          onChange={handleDateToChange}
          className="w-40 border border-gray-300 h-[50px] px-4 rounded-lg"
          placeholder="To"
        />

        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="secondary"
            className="flex items-center gap-2 px-4 h-[50px]"
          >
            <X size={18} />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <OrdersTable
        orders={orders}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMoreOrders}
        onUpdateStatus={handleUpdateStatus}
        onCancelOrder={handleCancelOrder}
        onDeleteOrder={handleDeleteOrder}
        refreshOrders={refreshOrders}
      />
    </div>
  );
}