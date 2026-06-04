// app/(dashboard)/[shopSlug]/sales/components/SalesClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSales } from "../hooks/useSales";
import SalesCards from "./salesCards";
import SalesTable from "./salesTable";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import { X, Calendar } from "lucide-react";

interface SalesClientProps {
  shopId: number;
  shopSlug: string;
}

const sections = ["Sales", "Analytics"];

export default function SalesClient({ 
  shopId, 
  shopSlug 
}: SalesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    orders,
    metrics,
    loading,
    hasMore,
    loadMoreOrders,
    searchOrders,
    filterByStatus,
    filterByDateRange,
    resetFilters,
    refreshSales,
    updateOrderStatus,
    deleteOrder,
  } = useSales(shopId.toString());

  // Determine active tab based on current path
  const activeIndex = pathname?.includes('/sales') ? 0 : 1;

  const handleTabClick = (index: number) => {
    if (index === 0) {
      router.push(`/dashboard/${shopSlug}/sales`);
    } else {
      router.push(`/dashboard/${shopSlug}/analytics`);
    }
  };

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
      await refreshSales();
    } else {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
    return success;
  };

  const handleDeleteOrder = async (orderId: number) => {
    const success = await deleteOrder(orderId);
    if (success) {
      setMessage({ type: 'success', text: 'Order deleted successfully' });
      await refreshSales();
    } else {
      setMessage({ type: 'error', text: 'Failed to delete order' });
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
      {/* Navigation Toggle Bar */}
      <div className="md:w-[75%] w-full mb-6">
        <div className="flex justify-between mb-1">
          {sections.map((section, index) => (
            <button
              key={section}
              onClick={() => handleTabClick(index)}
              className={`flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] transition-colors font-[Poppins] ${
                index === activeIndex
                  ? "text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={{ width: `${100 / sections.length}%` }}
            >
              {section}
            </button>
          ))}
        </div>

        <div className="relative w-full h-2 bg-gray-200 rounded-full">
          <div
            className="absolute h-2 bg-magenta-dark rounded-full transition-all duration-300"
            style={{
              width: `${100 / sections.length}%`,
              left: `${(100 / sections.length) * activeIndex}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Sales Cards */}
      <SalesCards
        totalRevenue={metrics.totalRevenue}
        totalOrders={metrics.totalOrders}
        pendingDelivery={metrics.pendingDelivery}
        averageOrderValue={metrics.averageOrderValue}
        loading={loading}
      />

      <div className="text-three font-bold">Sales are Paid Orders</div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 my-4">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchInput}
            onChange={handleSearch}
            className="w-full border border-gray-600 px-4 h-[50px] pl-12 rounded-lg bg-white text-black"
          />
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
        </div>

        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="w-48 border border-gray-600 text-black h-[50px] px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-magenta-dark"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 text-black bg-white border border-gray-600 rounded-lg px-3 h-[50px]">
          <Calendar size={18} className="text-gray-600" />
          <input
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            className="w-32 h-full focus:outline-none text-sm placeholder:text-gray-700 text-black"
          />
          <span className="text-gray-600">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            className="w-32  h-full focus:outline-none text-sm placeholder:text-gray-700 text-black"
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

      <SalesTable
        orders={orders}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMoreOrders}
        onStatusUpdate={handleUpdateStatus}
       
        onRefresh={refreshSales}
        shopSlug={shopSlug}
      />
    </div>
  );
}