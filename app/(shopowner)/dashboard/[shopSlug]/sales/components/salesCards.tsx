// app/(dashboard)/[shopSlug]/sales-analytics/components/SalesCards.tsx
"use client";

import DashCard from "@/app/components/ui/dashCard";
import { DollarSign, ShoppingBag, Truck, TrendingUp } from "lucide-react";

interface SalesCardsProps {
  totalRevenue: number;
  totalOrders: number;
  pendingDelivery: number;
  averageOrderValue: number;
  loading?: boolean;
}

export default function SalesCards({ 
  totalRevenue, 
  totalOrders, 
  pendingDelivery, 
  averageOrderValue,
  loading 
}: SalesCardsProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsData = [
    { 
      title: "Total Revenue", 
      value: loading ? "..." : formatCurrency(totalRevenue), 
      icon: DollarSign, 
      subtitle: `From paid orders`,
    },
    { 
      title: "Total Sales", 
      value: loading ? "..." : totalOrders, 
      icon: ShoppingBag, 
      subtitle: `Paid orders`,
    },
    { 
      title: "Pending Delivery", 
      value: loading ? "..." : pendingDelivery, 
      icon: Truck, 
      subtitle: `Orders to deliver`,
    },
    { 
      title: "Avg Order Value", 
      value: loading ? "..." : formatCurrency(averageOrderValue), 
      icon: TrendingUp, 
      subtitle: `Average per order`,
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