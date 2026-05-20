// app/admin/analytics/components/overallStatsCards.tsx
'use client';

import DashCard from "@/app/components/ui/dashCard";
import { Users, Mail, Send, CheckCircle } from "lucide-react";

interface OverallStatsCardsProps {
  summary: {
    unique_visitors: number;
    signups_started: number;
    verifications_sent: number;
    verifications_success: number;
  };
}

export default function OverallStatsCards({ summary }: OverallStatsCardsProps) {
  const statsData = [
    {
      title: "Unique Visitors",
      value: summary.unique_visitors.toLocaleString(),
      icon: Users,
      subtitle: "Total unique IP addresses",
    },
    {
      title: "Signups Started",
      value: summary.signups_started.toLocaleString(),
      icon: Mail,
      subtitle: "Clicked signup",
    },
    {
      title: "Verifications Sent",
      value: summary.verifications_sent.toLocaleString(),
      icon: Send,
      subtitle: "Code requested",
    },
    {
      title: "Verifications Success",
      value: summary.verifications_success.toLocaleString(),
      icon: CheckCircle,
      subtitle: "Email verified",
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