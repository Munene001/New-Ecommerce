// app/(dashboard)/[shopSlug]/reports/components/ReportProductCharts.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ReportData } from "../hooks/useReports";

interface Props {
  data: ReportData | null;
  loading: boolean;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

function shortName(name: string, max = 18): string {
  return name.length > max ? name.slice(0, max) + "…" : name;
}

export default function ReportProductCharts({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }
  if (!data) return null;

  const top = (data.topProducts ?? []).slice(0, 5);

  const byUnits = top.map((p) => ({
    name: shortName(p.product_name),
    quantity: p.quantity_sold,
  }));

  const byValue = [...top]
    .sort((a, b) => b.revenue - a.revenue)
    .map((p) => ({
      name: shortName(p.product_name),
      revenue: p.revenue,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* By units */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-black mb-1">Best sellers by units</h2>
        <p className="text-sm text-gray-600 mb-4">
          Which products moved the most units.
        </p>
        {byUnits.length === 0 ? (
          <p className="text-sm text-gray-500">No paid product sales in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byUnits} layout="vertical" margin={{ left: 90, right: 20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: 12 }}
                formatter={(v: any) => [`${v} units`, "Units"]}
              />
              <Bar dataKey="quantity" fill="#60a5fa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* By value */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-black mb-1">Best sellers by value</h2>
        <p className="text-sm text-gray-600 mb-4">
          Which products brought in the most revenue.
        </p>
        {byValue.length === 0 ? (
          <p className="text-sm text-gray-500">No paid product sales in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byValue} layout="vertical" margin={{ left: 90, right: 20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#374151", fontSize: 12 }} axisLine={{ stroke: "#d1d5db" }} tickLine={{ stroke: "#d1d5db" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: 12 }}
                formatter={(v: any) => [formatCurrency(v), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}