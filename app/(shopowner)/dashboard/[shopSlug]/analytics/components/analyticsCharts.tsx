"use client";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { ReactNode } from "react";
import { Trophy, CreditCard, Clock, MapPin } from "lucide-react";

interface TopProduct {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface BestSeller {
  product_name: string;
  revenue: number;
}

interface PaymentSplit {
  mpesa: number;
  cod: number;
  mpesa_percentage: number;
  cod_percentage: number;
}

interface HourlyDistribution {
  hour: number;
  order_count: number;
}

interface OrdersByCity {
  city: string;
  order_count: number;
  revenue: number;
}

interface AnalyticsChartsProps {
  topProducts: TopProduct[];
  bestSeller: BestSeller | null;
  paymentSplit?: PaymentSplit;
  hourlyDistribution: HourlyDistribution[];
  ordersByCity: OrdersByCity[];
  loading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PIE_COLORS = ["#10b981", "#f97316"];
const BAR_COLORS = ["#60a5fa", "#a78bfa", "#f472b6", "#22d3ee", "#fbbf24"];

export default function AnalyticsCharts({
  topProducts,
  bestSeller,
  paymentSplit,
  hourlyDistribution,
  ordersByCity,
  loading,
}: AnalyticsChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-black rounded-xl border border-gray-800 p-6 h-96 animate-pulse"
          >
            <div className="h-6 bg-gray-800 rounded w-32 mb-6"></div>
            <div className="h-64 bg-gray-900 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const paymentSplitData = paymentSplit
    ? [
        {
          name: "M-Pesa",
          value: paymentSplit.mpesa,
          percentage: paymentSplit.mpesa_percentage,
        },
        {
          name: "COD",
          value: paymentSplit.cod,
          percentage: paymentSplit.cod_percentage,
        },
      ].filter((item) => item.value > 0)
    : [];

  const topProductsData = topProducts.slice(0, 5).map((product, index) => ({
    name:
      product.product_name.length > 20
        ? product.product_name.substring(0, 20) + "..."
        : product.product_name,
    revenue: product.revenue,
    quantity: product.quantity_sold,
    fill: BAR_COLORS[index % BAR_COLORS.length],
  }));

  const topCitiesData = ordersByCity.slice(0, 8).map((city, index) => ({
    name:
      city.city.length > 15 ? city.city.substring(0, 15) + "..." : city.city,
    orders: city.order_count,
    revenue: city.revenue,
    fill: BAR_COLORS[index % BAR_COLORS.length],
  }));

  const peakHour = hourlyDistribution.reduce(
    (max, curr) => (curr.order_count > max.order_count ? curr : max),
    { hour: 0, order_count: 0 }
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chart 1: Top Products by Units Sold */}
      <div className="bg-black rounded-xl border border-gray-800 p-6 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-three" />
            <h3 className="font-semibold text-white text-lg">Top Products</h3>
          </div>
          <p className="text-sm text-gray-300">
            Best selling products by units sold (Paid Sales)
          </p>
          {bestSeller && (
            <p className="text-xs text-emerald-400 mt-2">
              ⭐ Best Seller by Revenue: {bestSeller.product_name} (
              {formatCurrency(bestSeller.revenue)})
            </p>
          )}
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={topProductsData}
            layout="vertical"
            margin={{ left: 80, right: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#374151"
            />
            <XAxis
              type="number"
              tick={{ fill: "#f3f4f6" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={{ stroke: "#4b5563" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={40}
              tick={{ fill: "#f3f4f6", fontSize: 14 }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={{ stroke: "#4b5563" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000",
                border: "1px solid #4b5563",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "white", fontWeight: "bold" }}
              itemStyle={{ color: "#f3f4f6" }}
              formatter={(value: any): [string, string] => [
                `${value} units`,
                "Units Sold",
              ]}
            />
            <Legend wrapperStyle={{ color: "#f3f4f6" }} />
            <Bar
              dataKey="quantity"
              name="Units Sold"
              fill="#60a5fa"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Payment Split */}
      <div className="bg-black rounded-xl border border-gray-800 p-6 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-three" />
            <h3 className="font-semibold text-white text-lg">Payment Methods</h3>
          </div>
          <p className="text-sm text-gray-300">
            Paid Sales: M-Pesa vs Cash on Delivery
          </p>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <PieChart>
            <Pie
              data={paymentSplitData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              dataKey="value"
              paddingAngle={5}
              label={({ name, percent }): string =>
                `${name}: ${((percent || 0) * 100).toFixed(1)}%`
              }
            >
              {paymentSplitData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  stroke="#000"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#000",
                border: "1px solid #4b5563",
                borderRadius: "0.5rem",
              }}
              formatter={(value: any, name: any): [string, string] => {
                const data = paymentSplitData.find((d) => d.name === name);
                return [
                  `${value} Sales (${data?.percentage.toFixed(1)}%)`,
                  name,
                ];
              }}
            />
            <Legend
              formatter={(value): ReactNode => (
                <span className="text-gray-100">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3: Hourly Distribution */}
      <div className="bg-black rounded-xl border border-gray-800 p-6 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-three" />
            <h3 className="font-semibold text-white text-lg">Sales by Hour</h3>
          </div>
          <p className="text-sm text-gray-300">
            Peak Sales Hour: {peakHour.hour}:00 ({peakHour.order_count} paid
            orders)
          </p>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={hourlyDistribution} margin={{ right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="hour"
              tickFormatter={(h): string => `${h}:00`}
              tick={{ fill: "#f3f4f6" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={{ stroke: "#4b5563" }}
            />
            <YAxis
              tick={{ fill: "#f3f4f6" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={{ stroke: "#4b5563" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000",
                border: "1px solid #4b5563",
                borderRadius: "0.5rem",
              }}
              labelFormatter={(label): string => `${label}:00`}
              formatter={(value: any): [string, string] => [
                `${value} Paid Sales`,
                "Sales",
              ]}
            />
            <Legend wrapperStyle={{ color: "#f3f4f6" }} />
            <Line
              type="monotone"
              dataKey="order_count"
              name="Sales Volume"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ fill: "#60a5fa", stroke: "#000" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 4: Sales by City */}
      <div className="bg-black rounded-xl border border-gray-800 p-6 shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-three" />
            <h3 className="font-semibold text-white text-lg">Sales by City</h3>
          </div>
          <p className="text-sm text-gray-300">
            Geographic distribution of paid transactions
          </p>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={topCitiesData}
            layout="vertical"
            margin={{ left: 50, right:50 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#374151"
            />
            <XAxis
              type="number"
              tick={{ fill: "#f3f4f6" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={{ stroke: "#4b5563" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={40}
              tick={{ fill: "#f3f4f6" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={{ stroke: "#4b5563" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000",
                border: "1px solid #4b5563",
                borderRadius: "0.5rem",
              }}
              formatter={(value: any, name: any, props: any): [string, string] => {
                const cityData = props.payload;
                return [
                  `${value} Sales${
                    cityData?.revenue
                      ? ` (${formatCurrency(cityData.revenue)})`
                      : ""
                  }`,
                  "City Sales",
                ];
              }}
            />
            <Legend wrapperStyle={{ color: "#f3f4f6" }} />
            <Bar
              dataKey="orders"
              name="Paid Sales"
              fill="#a78bfa"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}