// app/(dashboard)/[shopSlug]/reports/components/ReportMonthlyTrend.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ReportData } from "../hooks/useReports";

interface Props {
  data: ReportData | null;
  loading: boolean;
  isMultiMonth: boolean;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

function formatYm(ym: string): string {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function trendSentence(series: Array<{ ym: string; revenue: number; orders: number }>): string {
  if (series.length < 2) return "";
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta =
    prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : null;
  if (delta === null) return "";
  if (Math.abs(delta) < 0.05) {
    return `The most recent month (${formatYm(last.ym)}) matched the prior month's revenue at ${formatCurrency(last.revenue)}.`;
  }
  return `The most recent month (${formatYm(last.ym)}) was ${Math.abs(delta).toFixed(1)}% ${
    delta > 0 ? "higher" : "lower"
  } than the prior month (${formatYm(prev.ym)}).`;
}

export default function ReportMonthlyTrend({ data, loading, isMultiMonth }: Props) {
  // 🔇 Render nothing when the range is a single month
  if (!isMultiMonth) return null;

  if (loading) return <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return null;

  const series = (data.monthlySeries ?? []).map((m) => ({
    ...m,
    name: formatYm(m.ym),
  }));

  const busiest = series.reduce(
    (max, curr) => (curr.revenue > max.revenue ? curr : max),
    { name: "—", revenue: 0, orders: 0, ym: "" }
  );

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-black mb-1">Monthly revenue</h2>
      <p className="text-sm text-gray-600 mb-4">
        {series.length === 0
          ? "No paid orders across the months in this period."
          : `The strongest month was ${busiest.name} with ${formatCurrency(busiest.revenue)} from ${busiest.orders} paid orders. ${trendSentence(series)}`}
      </p>
      {series.length > 0 && (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={series} margin={{ right: 20, top: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
            <YAxis tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: 12 }}
              formatter={(value: any, name: any) =>
                name === "Revenue" ? [formatCurrency(value), name] : [value, name]
              }
            />
            <Bar dataKey="revenue" name="Revenue" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}