'use client';

import { useState, useRef, useEffect } from "react";
import { useDashboardOrders } from "../hooks/useDashboardOrders";
import StatsCards from "./statsCard";
import OrdersTable from "./ordersTable";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import { X, Calendar } from "lucide-react";

interface OrdersClientProps {
  shopId: number;
  shopSlug: string;
}

export default function OrdersClient({
  shopId,
  shopSlug,
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
    stats,
    loading,
    hasMore,
    loadMoreOrders,
    searchOrders,
    filterByStatus,
    filterByDateRange,
    resetFilters,
    refreshOrders,
    updateOrderStatus,
    updatePaymentStatus,
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
      await refreshOrders();
    } else {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
    return success;
  };

  const handleUpdatePaymentStatus = async (orderId: number, status: string) => {
    const success = await updatePaymentStatus(orderId, status);
    if (success) {
      setMessage({ type: 'success', text: `Payment status updated to ${status}` });
      await refreshOrders();
    } else {
      setMessage({ type: 'error', text: 'Failed to update payment status' });
    }
    return success;
  };

  const hasActiveFilters = searchInput !== "" || statusFilter !== "" || dateFrom !== "" || dateTo !== "";

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      <StatsCards
        totalOrders={stats.totalOrders}
        pendingOrders={stats.pendingOrders}
        processingOrders={stats.processingOrders}
        completedOrders={stats.completedOrders}
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

        {/* Clean Date Range Picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 h-[50px]">
          <Calendar size={18} className="text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            className="w-32 h-full focus:outline-none text-sm"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            className="w-32 h-full focus:outline-none text-sm"
          />
        </div>

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

      {/* Date range indicator when active */}
      {dateFrom && dateTo && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Calendar size={16} />
          <span>
            📅 {formatDate(dateFrom)} — {formatDate(dateTo)}
          </span>
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              resetFilters();
            }}
            className="ml-auto hover:text-blue-800"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <OrdersTable
        orders={orders}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMoreOrders}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        refreshOrders={refreshOrders}
        shopSlug={shopSlug}
      />
    </div>
  );
}