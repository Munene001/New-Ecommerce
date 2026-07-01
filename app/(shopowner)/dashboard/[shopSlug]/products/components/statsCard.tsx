'use client';

import DashCard from "@/app/components/ui/dashCard";
import { Package, Tag, Layers, CheckCircle, AlertCircle } from "lucide-react";

interface StatsCardsProps {
  totalProducts: number;
  totalCategories: number;
  totalInventoryItems: number;
  totalInstock: number;
  totalOutOfStock: number;
  totalDrafts?: number;
}

export default function StatsCards({ 
  totalProducts, 
  totalCategories, 
  totalInventoryItems,
  totalInstock,
  totalOutOfStock,
  totalDrafts = 0,
}: StatsCardsProps) {
  
  const statsData = [
    { 
      title: "Total Products", 
      value: totalProducts, 
      icon: Package, 
      subtitle: `${totalDrafts} in draft`,
    },
    { 
      title: "Categories", 
      value: totalCategories, 
      icon: Tag, 
      subtitle: `Available categories`,
    },
    { 
      title: "Inventory Items", 
      value: totalInventoryItems, 
      icon: Layers, 
      subtitle: `Total variants + simple products`,
    },
    { 
      title: "In Stock", 
      value: totalInstock, 
      icon: CheckCircle, 
      subtitle: `${totalOutOfStock} out of stock`,
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