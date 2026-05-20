 // app/admin/shops/[shopId]/analytics/components/shopAnalyticsCard.tsx
'use client';

import DashCard from "@/app/components/ui/dashCard";
import { Users, ShoppingBag, Repeat, Package } from "lucide-react";

interface ShopAnalyticsCardProps {
  stats: {
    totalVisitors: number;
    completedPurchases: number;
    returningVisitors: number;
    ordersPlaced: number;
  };
}

export default function ShopAnalyticsCard({ stats }: ShopAnalyticsCardProps) {
  const statsData = [
    {
      title: "Total Visitors",
      value: stats.totalVisitors.toLocaleString(),
      icon: Users,
      subtitle: "Unique sessions",
    },
    {
      title: "Completed Purchases",
      value: stats.completedPurchases.toLocaleString(),
      icon: ShoppingBag,
      subtitle: "Successful payments",
    },
    {
      title: "Returning Visitors",
      value: stats.returningVisitors.toLocaleString(),
      icon: Repeat,
      subtitle: "Came back multiple times",
    },
    {
      title: "Orders Placed",
      value: stats.ordersPlaced.toLocaleString(),
      icon: Package,
      subtitle: "Checkout completed",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:gap-4 gap-2 mb-8">
      {statsData.map((data) => (
        <DashCard
          key={data.title}
          title={data.title}
          value={data.value}
          icon={data.icon}
          subtitle={data.subtitle}
        />
      ))}
    </div>
  );
}