'use client';

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { X, Calendar, Search } from "lucide-react";

interface TransactionsFiltersProps {
  onFilterChange: (filters: {
    paymentType: string;
    dateFrom: string;
    dateTo: string;
    search: string;
  }) => void;
  onReset: () => void;
  loading?: boolean;
}

export default function TransactionsFilters({
  onFilterChange,
  onReset,
  loading = false,
}: TransactionsFiltersProps) {
  const [paymentType, setPaymentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Check if any filter is active
  useEffect(() => {
    const isActive = paymentType !== "" || dateFrom !== "" || dateTo !== "" || searchInput !== "";
    setHasActiveFilters(isActive);
  }, [paymentType, dateFrom, dateTo, searchInput]);

  // Apply filters when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        paymentType,
        dateFrom,
        dateTo,
        search: searchInput,
      });
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [paymentType, dateFrom, dateTo, searchInput, onFilterChange]);

  const handleReset = () => {
    setPaymentType("");
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    onReset();
  };

  const paymentTypeOptions = [
    { value: "", label: "All Payments" },
    { value: "stk", label: "STK Payments" },
    { value: "direct", label: "Direct M-Pesa" },
    { value: "cod", label: "Cash on Delivery" },
  ];

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-gray-600 px-4 h-[50px] pl-12 rounded-lg bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-magenta-dark"
            disabled={loading}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
        </div>

        {/* Payment Type Filter */}
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="w-full md:w-48 border border-gray-600 h-[50px] text-black px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-magenta-dark bg-white disabled:opacity-50"
          disabled={loading}
        >
          {paymentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2 bg-white border border-gray-600 rounded-lg px-3 h-[50px]">
          <Calendar size={18} className="text-gray-600 flex-shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-28 md:w-32 h-full focus:outline-none text-sm text-black bg-transparent disabled:opacity-50"
            disabled={loading}
          />
          <span className="text-gray-600">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-28 md:w-32 h-full focus:outline-none text-sm text-black bg-transparent disabled:opacity-50"
            disabled={loading}
          />
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-4 h-[50px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <X size={18} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {paymentType && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-magenta/10 text-magenta-dark px-3 py-1 rounded-full border border-magenta/20">
              <span>Type: {paymentTypeOptions.find(opt => opt.value === paymentType)?.label || paymentType}</span>
              <button
                onClick={() => setPaymentType("")}
                className="hover:text-magenta-dark"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {dateFrom && dateTo && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              <Calendar size={14} />
              <span>{formatDateForDisplay(dateFrom)} — {formatDateForDisplay(dateTo)}</span>
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="hover:text-blue-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {searchInput && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200">
              <Search size={14} />
              <span>"{searchInput}"</span>
              <button
                onClick={() => setSearchInput("")}
                className="hover:text-gray-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
          <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}