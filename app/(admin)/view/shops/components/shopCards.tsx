// app/admin/shops/components/shopStatsCards.tsx
'use client';

import DashCard from "@/app/components/ui/dashCard";
import { Store, Package, TrendingUp, AlertTriangle } from "lucide-react";

interface ShopStatsCardsProps {
  mostPopularType: string;
  mostPopularCount: number;
  leastPopularType: string;
  leastPopularCount: number;
  emptyShops: number;
  recentlyCreated: number;
  currentShown: number;
}

export default function ShopStatsCards({ 
  mostPopularType,
  mostPopularCount,
  leastPopularType,
  leastPopularCount,
  emptyShops,
  recentlyCreated,
  currentShown,
}: ShopStatsCardsProps) {
  
  const statsData = [
    { 
      title: "Most Popular Type", 
      value: `${mostPopularType} (${mostPopularCount})`, 
      icon: TrendingUp, 
      subtitle: `${mostPopularCount} shops`,
    },
    { 
      title: "Least Popular Type", 
      value: `${leastPopularType} (${leastPopularCount})`, 
      icon: Store, 
      subtitle: `${leastPopularCount} shops`,
    },
    { 
      title: "Empty Shops", 
      value: emptyShops, 
      icon: Package, 
      subtitle: `${emptyShops} shops with 0 products`,
    },
    { 
      title: "Recently Created", 
      value: recentlyCreated, 
      icon: AlertTriangle, 
      subtitle: `Last 30 days`,
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