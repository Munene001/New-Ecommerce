// app/admin/analytics/components/overallFilterBar.tsx
'use client';

interface OverallFilterBarProps {
  days: number;
  onDaysChange: (days: number) => void;
}

export default function OverallFilterBar({ days, onDaysChange }: OverallFilterBarProps) {
  const dateRangeOptions = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
    { label: 'Last 120 days', value: 120 },
    { label: 'Last 180 days', value: 180 },
    { label: 'Last 365 days', value: 365 },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Date Range:</span>
        <div className="flex flex-wrap gap-2">
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onDaysChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                days === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}