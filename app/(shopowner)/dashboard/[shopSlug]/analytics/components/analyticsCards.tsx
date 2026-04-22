// app/(dashboard)/[shopSlug]/analytics/components/analyticsCards.tsx
"use client";

import DashCard from "@/app/components/ui/dashCard";
import { CreditCard, Package, Users, Calendar } from "lucide-react";

interface AnalyticsCardsProps {
  summary?: {
    collectionRate: number;
    avgItemsPerOrder: number;
    returningCustomersRate: number;
    weekendVsWeekday: {
      weekend_percentage: number;
    };
  };
  loading?: boolean;
}

export default function AnalyticsCards({ summary, loading }: AnalyticsCardsProps) {
  
  const statsData = [
    { 
      title: "Collection Rate", 
      value: loading ? "..." : (summary ? `${summary.collectionRate.toFixed(1)}%` : "0%"), 
      icon: CreditCard, 
      subtitle: `Paid vs Total orders`,
    },
    { 
      title: "Avg Items per Order", 
      value: loading ? "..." : (summary ? summary.avgItemsPerOrder.toFixed(1) : "0"), 
      icon: Package, 
      subtitle: `Items per paid order`,
    },
    { 
      title: "Returning Customers", 
      value: loading ? "..." : (summary ? `${summary.returningCustomersRate.toFixed(1)}%` : "0%"), 
      icon: Users, 
      subtitle: `Repeat buyers`,
    },
    { 
      title: "Weekend Orders", 
      value: loading ? "..." : (summary ? `${summary.weekendVsWeekday.weekend_percentage.toFixed(1)}%` : "0%"), 
      icon: Calendar, 
      subtitle: `% of orders on Sat/Sun`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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