'use client';

import DashCard from "@/app/components/ui/dashCard";
import { ShoppingBag, Clock, PackageCheck, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
}

export default function StatsCards({ 
  totalOrders, 
  pendingOrders, 
  processingOrders, 
  completedOrders 
}: StatsCardsProps) {
  
  const statsData = [
    { 
      title: "Total Orders", 
      value: totalOrders, 
      icon: ShoppingBag, 
      subtitle: `Total orders received`,
    },
    { 
      title: "Pending", 
      value: pendingOrders, 
      icon: Clock, 
      subtitle: `Awaiting confirmation`,
    },
    { 
      title: "Processing", 
      value: processingOrders, 
      icon: PackageCheck, 
      subtitle: `Being prepared`,
    },
    { 
      title: "Completed", 
      value: completedOrders, 
      icon: CheckCircle, 
      subtitle: `Delivered successfully`,
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