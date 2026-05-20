// app/admin/shops/[shopId]/analytics/components/analFilterBar.tsx
'use client';

import Button from "@/app/components/ui/button";

interface AnalFilterBarProps {
  dateRange: number;
  viewMode: 'sessions' | 'ip';
  onDateRangeChange: (days: number) => void;
  onViewModeChange: (mode: 'sessions' | 'ip') => void;
}

export default function AnalFilterBar({
  dateRange,
  viewMode,
  onDateRangeChange,
  onViewModeChange,
}: AnalFilterBarProps) {
  const dateRangeOptions = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {/* Date Range Section */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Date Range:</span>
        <div className="flex gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDateRangeChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">View:</span>
        <div className="flex gap-1 bg-white rounded-lg border border-gray-300 p-1">
          <button
            onClick={() => onViewModeChange('sessions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'sessions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => onViewModeChange('ip')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'ip'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Unique IP
          </button>
        </div>
      </div>
    </div>
  );
}