'use client';

import DashCard from "@/app/components/ui/dashCard";
import { Package, Tag, Percent, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  totalProducts: number;
  totalCategories: number;
  totalDiscounted: number;
  totalInstock: number;
  currentShown: number;
}

export default function StatsCards({ 
  totalProducts, 
  totalCategories, 
  totalDiscounted, 
  totalInstock,
  currentShown 
}: StatsCardsProps) {
  
  const statsData = [
    { 
      title: "Total Products", 
      value: totalProducts, 
      icon: Package, 
      subtitle: `Showing ${totalProducts}`,
    },
    { 
      title: "Categories", 
      value: totalCategories, 
      icon: Tag, 
      subtitle: `Showing ${totalCategories}`,
    },
    { 
      title: "Discounted Products", 
      value: totalDiscounted, 
      icon: Percent, 
      subtitle: ` ${totalProducts - totalDiscounted} not discounted`,
    },
    { 
      title: "In Stock", 
      value: totalInstock, 
      icon: CheckCircle, 
      subtitle: `${totalProducts - totalInstock} out of stock`,
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