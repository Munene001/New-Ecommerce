'use client';

import DashCard from "@/app/components/ui/dashCard";
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";

interface PaymentsStatsCardsProps {
  totalRevenue: number;
  pendingPayouts: number;
  completedPayouts: number;
  monthlyRevenue?: number; // Optional for future use
}

export default function PaymentsStatsCards({ 
  totalRevenue, 
  pendingPayouts, 
  completedPayouts,
  monthlyRevenue = 0,
}: PaymentsStatsCardsProps) {
  
  const statsData = [
    { 
      title: "Total Revenue", 
      value: `KES ${totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      subtitle: "All time sales",
    },
    { 
      title: "Pending Payouts", 
      value: `KES ${pendingPayouts.toLocaleString()}`, 
      icon: Clock, 
      subtitle: "Awaiting settlement",
    },
    { 
      title: "Completed Payouts", 
      value: `KES ${completedPayouts.toLocaleString()}`, 
      icon: CheckCircle, 
      subtitle: "Successfully paid",
    },
    { 
      title: "Monthly Revenue", 
      value: `KES ${monthlyRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      subtitle: "This month",
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