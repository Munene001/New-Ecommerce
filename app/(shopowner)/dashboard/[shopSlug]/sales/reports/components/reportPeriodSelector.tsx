// app/(dashboard)/[shopSlug]/reports/components/ReportPeriodSelector.tsx
"use client";

import { Calendar } from "lucide-react";
import type { PeriodPreset, AvailableMonth, ResolvedRange } from "../hooks/useReports";

interface Props {
  preset: PeriodPreset;
  setPreset: (p: PeriodPreset) => void;
  selectedYm: string;
  setSelectedYm: (ym: string) => void;
  availableMonths: AvailableMonth[];
  monthsLoading: boolean;
  monthsError: string | null;
  range: ResolvedRange;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "month", label: "This Month" },
  { key: "last3", label: "Last 3 Months" },
  { key: "last6", label: "Last 6 Months" },
  { key: "last12", label: "Last 12 Months" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Specific Month" },
];

function formatYm(ym: string): string {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function ReportPeriodSelector({
  preset,
  setPreset,
  selectedYm,
  setSelectedYm,
  availableMonths,
  monthsLoading,
  monthsError,
  range,
}: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-700" />
        <span className="text-sm font-medium text-gray-700">Report period</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              preset === p.key
                ? "bg-magenta-dark text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm text-gray-700">Month:</label>
          <select
            value={selectedYm}
            onChange={(e) => setSelectedYm(e.target.value)}
            disabled={monthsLoading}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black bg-white min-w-[220px]"
          >
            <option value="">
              {monthsLoading ? "Loading months…" : "Select a month…"}
            </option>
            {availableMonths.map((m) => (
              <option key={m.ym} value={m.ym}>
                {formatYm(m.ym)} — {m.orders} orders
              </option>
            ))}
          </select>
          {monthsError && <span className="text-xs text-red-600">{monthsError}</span>}
          {!monthsLoading && availableMonths.length === 0 && !monthsError && (
            <span className="text-xs text-gray-500">No months with paid orders yet.</span>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Reporting on{" "}
        <span className="text-gray-800 font-medium">
          {range.date_from && range.date_to
            ? `${range.date_from} → ${range.date_to}`
            : "all-time data"}
        </span>
      </div>
    </div>
  );
}