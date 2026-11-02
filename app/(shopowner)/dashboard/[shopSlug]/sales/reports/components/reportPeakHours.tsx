// app/(dashboard)/[shopSlug]/reports/components/ReportPeakHours.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ReportData } from "../hooks/useReports";

interface Props {
  data: ReportData | null;
  loading: boolean;
}

export default function ReportPeakHours({ data, loading }: Props) {
  if (loading) return <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return null;

  const series = data.hourlyDistribution;
  const peak = series.reduce(
    (max, curr) => (curr.order_count > max.order_count ? curr : max),
    { hour: 0, order_count: 0 }
  );

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-black mb-1">Peak hours</h2>
      <p className="text-sm text-gray-600 mb-4">
        {peak.order_count > 0
          ? `Most paid orders arrived around ${peak.hour}:00 (${peak.order_count} orders). This chart shows when customers buy during the day.`
          : "No paid orders in this period."}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={(h) => `${h}:00`}
            tick={{ fill: "#374151", fontSize: 11 }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={{ stroke: "#d1d5db" }}
            interval={1}
          />
          <YAxis tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: 12 }}
            labelFormatter={(h) => `${h}:00`}
            formatter={(v: any) => [`${v} paid orders`, "Orders"]}
          />
          <Bar dataKey="order_count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}