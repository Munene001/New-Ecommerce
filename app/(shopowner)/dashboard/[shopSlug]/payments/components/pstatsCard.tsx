'use client';

import DashCard from "@/app/components/ui/dashCard";
import { DollarSign, TrendingUp, Smartphone, Percent } from "lucide-react";

interface PaymentsStatsCardsProps {
  totalRevenue: number;
  monthlyRevenue: number;
  stkPayments: number;
  stkPaymentRate: number;
}

export default function PaymentsStatsCards({ 
  totalRevenue, 
  monthlyRevenue,
  stkPayments,
  stkPaymentRate,
}: PaymentsStatsCardsProps) {
  
  const statsData = [
    { 
      title: "Total Revenue", 
      value: `KES ${totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      subtitle: "All time sales",
    },
    { 
      title: "Monthly Revenue", 
      value: `KES ${monthlyRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      subtitle: "This month",
    },
    { 
      title: "STK Payments", 
      value: stkPayments.toLocaleString(), 
      icon: Smartphone, 
      subtitle: "Successful STK transactions",
    },
    { 
      title: "STK Payment Rate", 
      value: `${stkPaymentRate}%`, 
      icon: Percent, 
      subtitle: "Of M-Pesa orders via STK",
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