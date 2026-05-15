// app/admin/tenants/components/tenantStatsCards.tsx
'use client';

import DashCard from "@/app/components/ui/dashCard";
import { Building2, Users, Clock, AlertCircle } from "lucide-react";

interface TenantStatsCardsProps {
  totalTenants: number;
  freeTrial: number;
  active: number;
  expiredSuspended: number;
  currentShown: number;
}

export default function TenantStatsCards({ 
  totalTenants, 
  freeTrial, 
  active, 
  expiredSuspended,
  currentShown,
}: TenantStatsCardsProps) {
  
  const statsData = [
    { 
      title: "Total Tenants", 
      value: totalTenants, 
      icon: Building2, 
      subtitle: `Showing ${currentShown}`,
    },
    { 
      title: "Free Trial", 
      value: freeTrial, 
      icon: Clock, 
      subtitle: `${freeTrial} tenants in trial period`,
    },
    { 
      title: "Active", 
      value: active, 
      icon: Users, 
      subtitle: `${active} paying tenants`,
    },
    { 
      title: "Expired / Suspended", 
      value: expiredSuspended, 
      icon: AlertCircle, 
      subtitle: `Need attention`,
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