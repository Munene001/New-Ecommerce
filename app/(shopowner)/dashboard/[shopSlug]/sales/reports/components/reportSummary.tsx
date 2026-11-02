// app/(dashboard)/[shopSlug]/reports/components/reportSummary.tsx
"use client";

import type { ReportData, ResolvedRange, PreviousTotals } from "../hooks/useReports";

interface Props {
  data: ReportData | null;
  loading: boolean;
  range: ResolvedRange;
  periodLabel: string;
  previousTotals: PreviousTotals | null;
  previousLoading: boolean;
  /** True when the preset is "month" — display range as "1st → today". */
  isCurrentMonth?: boolean;
  /** Today's date in ISO (YYYY-MM-DD). Used only when isCurrentMonth is true. */
  todayIso?: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 11 -> "11th", 22 -> "22nd", etc. */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "2026-10-01" -> "1st October 2026" */
function formatLongDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  const month = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long" });
  return `${ordinal(d)} ${month} ${y}`;
}

function todayLocalIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function changeWord(current: number, previous: number): {
  direction: "higher" | "lower" | "unchanged";
  pct: number;
} {
  if (previous <= 0 && current <= 0) return { direction: "unchanged", pct: 0 };
  if (previous <= 0) return { direction: "higher", pct: 100 };
  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 0.05) return { direction: "unchanged", pct: 0 };
  return { direction: delta > 0 ? "higher" : "lower", pct: Math.abs(delta) };
}

export default function ReportSummary({
  data,
  loading,
  range,
  periodLabel,
  previousTotals,
  previousLoading,
  isCurrentMonth = false,
  todayIso,
}: Props) {
  if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return null;

  const s = data.summary;

  // ---- date range in "1st October 2026" style ----
  const today = todayIso ?? todayLocalIso();
  let rangeText = "";
  if (isCurrentMonth && range.date_from) {
    rangeText = `${formatLongDate(range.date_from)} to ${formatLongDate(today)}`;
  } else if (range.date_from && range.date_to) {
    rangeText = `${formatLongDate(range.date_from)} to ${formatLongDate(range.date_to)}`;
  }

  // ---- POS vs online breakdown ----
  const posTx = data.sourceSplit.pos.orders;
  const onlineTx = data.sourceSplit.online.orders;
  const totalPaid = s.totalPaidOrders;

  const revChange = previousTotals
    ? changeWord(s.totalRevenue, previousTotals.revenue)
    : null;
  const paidChange = previousTotals
    ? changeWord(s.totalPaidOrders, previousTotals.paidOrders)
    : null;

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-black mb-3">Overview</h2>

      <p className="text-sm text-gray-800 leading-relaxed mb-2">
        During <span className="font-medium">{periodLabel}</span>
        {rangeText ? ` (${rangeText})` : ""}
        , the shop recorded{" "}
        <span className="font-medium">{s.totalAllOrders} transactions</span>, of which{" "}
        <span className="font-medium">{totalPaid} were paid</span> — a{" "}
        <span className="font-medium">{s.collectionRate.toFixed(1)}% collection rate</span>. Of
        the paid transactions,{" "}
        <span className="font-medium">{posTx} came through POS</span> and{" "}
        <span className="font-medium">{onlineTx} were online orders</span>. Total revenue from
        paid transactions was{" "}
        <span className="font-medium">{formatCurrency(s.totalRevenue)}</span>, with an average
        transaction value of{" "}
        <span className="font-medium">{formatCurrency(s.averageOrderValue)}</span>. Each paid
        transaction carried an average of{" "}
        <span className="font-medium">{s.avgItemsPerOrder.toFixed(1)} items</span>.
      </p>

      {!previousLoading && previousTotals && revChange && paidChange && (
        <p className="text-sm text-gray-800 leading-relaxed">
          Compared with{" "}
          <span className="font-medium">{previousTotals.label}</span>, revenue was{" "}
          <span className="font-medium">
            {revChange.direction === "unchanged"
              ? "about the same"
              : `${revChange.pct.toFixed(1)}% ${revChange.direction}`}
          </span>
          {revChange.direction !== "unchanged" && (
            <>
              {" "}(from {formatCurrency(previousTotals.revenue)} to{" "}
              {formatCurrency(s.totalRevenue)})
            </>
          )}
          , and paid transactions were{" "}
          <span className="font-medium">
            {paidChange.direction === "unchanged"
              ? "about the same"
              : `${paidChange.pct.toFixed(1)}% ${paidChange.direction}`}
          </span>
          {paidChange.direction !== "unchanged" && (
            <>
              {" "}(from {previousTotals.paidOrders} to {totalPaid})
            </>
          )}
          .
        </p>
      )}
    </section>
  );
}