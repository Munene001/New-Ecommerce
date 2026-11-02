// app/(dashboard)/[shopSlug]/reports/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRef } from "react";
import InstructionsList from "@/app/components/ui/instructionList";

import { useReports } from "./hooks/useReports";
import ReportPeriodSelector from "./components/reportPeriodSelector";
import ReportSummary from "./components/reportSummary";
import ReportHighlights from "./components/reportHightlights";
import ReportProductCharts from "./components/reportProductsChart";
import ReportProductsTable from "./components/reportProductsTable";
import ReportOperations from "./components/reportOperation";
import ReportPeakHours from "./components/reportPeakHours";
import ReportMonthlyTrend from "./components/reportMonthlyTrend";
import ReportActions from "./components/reportAction";

function periodLabel(preset: string, selectedYm: string): string {
  switch (preset) {
    case "month":
      return "this month";
    case "last3":
      return "the last 3 months";
    case "last6":
      return "the last 6 months";
    case "last12":
      return "the last 12 months";
    case "all":
      return "all time";
    case "custom":
      if (/^\d{4}-\d{2}$/.test(selectedYm)) {
        const [y, m] = selectedYm.split("-").map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }
      return "the selected month";
    default:
      return "the selected period";
  }
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReportsPage({
  params,
}: {
  params: { shopSlug: string };
}) {
  const { shopSlug } = params;
  const reportRef = useRef<HTMLDivElement>(null);

  const {
    preset,
    setPreset,
    selectedYm,
    setSelectedYm,
    availableMonths,
    monthsLoading,
    monthsError,
    range,
    isMultiMonth,
    data,
    loading,
    error,
    previousTotals,
    previousLoading,
  } = useReports();

  const instructions = [
    { text: "Pick a period — monthly presets or a specific month & year" },
    { text: "Generate the PDF and download it directly" },
    {
      text: "A summary report of the previous Month is emailed automatically at the start of each month",
    },
  ];

  const filename = `report-${range.date_from ?? "all"}-${range.date_to ?? "all"}.pdf`;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-3 font-[Poppins]">
      <div className="mb-6">
        <Link
          href={`/dashboard/${shopSlug}`}
          className="inline-flex items-center text-gray-700 hover:text-black text-[16px] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black">Reports</h1>
        <p className="text-gray-800 mt-2">
          Generate a written report for any period
        </p>
      </div>

      <div className="mb-6">
        <InstructionsList items={instructions} variant="green" />
      </div>

      <ReportPeriodSelector
        preset={preset}
        setPreset={setPreset}
        selectedYm={selectedYm}
        setSelectedYm={setSelectedYm}
        availableMonths={availableMonths}
        monthsLoading={monthsLoading}
        monthsError={monthsError}
        range={range}
      />

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* everything inside this div becomes the PDF */}
      <div ref={reportRef} className="space-y-6 bg-white p-4 rounded-lg">
        <ReportSummary
          data={data}
          loading={loading}
          range={range}
          periodLabel={periodLabel(preset, selectedYm)}
          previousTotals={previousTotals}
          previousLoading={previousLoading}
          isCurrentMonth={preset === "month"}
          todayIso={todayIso()}
        />
        <ReportHighlights data={data} loading={loading} />
        <ReportProductCharts data={data} loading={loading} />
        <ReportProductsTable data={data} loading={loading} />
        <ReportOperations data={data} loading={loading} />
        <ReportPeakHours data={data} loading={loading} />
        <ReportMonthlyTrend
          data={data}
          loading={loading}
          isMultiMonth={isMultiMonth}
        />
      </div>

      <ReportActions targetRef={reportRef} filename={filename} />
    </div>
  );
}