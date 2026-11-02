// app/(dashboard)/[shopSlug]/reports/components/ReportOperations.tsx
"use client";

import type { ReportData } from "../hooks/useReports";

interface Props {
  data: ReportData | null;
  loading: boolean;
}

const pct = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");

export default function ReportOperations({ data, loading }: Props) {
  if (loading) return <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return null;

  const paid = data.summary.totalPaidOrders;
  const peakHour = data.hourlyDistribution.reduce(
    (max, curr) => (curr.order_count > max.order_count ? curr : max),
    { hour: 0, order_count: 0 }
  );
  const topCities = data.ordersByCity.slice(0, 3);

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-black">How the shop performed</h2>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Payments</h3>
        <p className="text-sm text-gray-800 leading-relaxed">
          M-Pesa was used for{" "}
          <span className="font-medium">{data.paymentSplit.mpesa} orders</span> ({pct(data.paymentSplit.mpesa, paid)}%),
          while Cash on Delivery accounted for{" "}
          <span className="font-medium">{data.paymentSplit.cod} orders</span> ({pct(data.paymentSplit.cod, paid)}%).
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Sources</h3>
        <p className="text-sm text-gray-800 leading-relaxed">
          <span className="font-medium">{data.sourceSplit.online.orders} orders</span> ({pct(data.sourceSplit.online.orders, paid)}%)
          came through the online store, and{" "}
          <span className="font-medium">{data.sourceSplit.pos.orders} orders</span> ({pct(data.sourceSplit.pos.orders, paid)}%)
          came through the point of sale.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Timing</h3>
        <p className="text-sm text-gray-800 leading-relaxed">
          The peak hour was <span className="font-medium">{peakHour.hour}:00</span> with{" "}
          {peakHour.order_count} paid orders.{" "}
          <span className="font-medium">{data.summary.weekendVsWeekday.weekend_percentage.toFixed(1)}%</span> of
          paid orders happened on weekends, and{" "}
          <span className="font-medium">{data.summary.weekendVsWeekday.weekday_percentage.toFixed(1)}%</span> on weekdays.
        </p>
      </div>

      {topCities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Where orders came from</h3>
          <p className="text-sm text-gray-800 leading-relaxed">
            The top cities were{" "}
            {topCities.map((c, i) => (
              <span key={c.city}>
                <span className="font-medium">{c.city}</span> ({c.order_count} orders)
                {i < topCities.length - 1 ? ", " : ""}
              </span>
            ))}
            .
          </p>
        </div>
      )}
    </section>
  );
}