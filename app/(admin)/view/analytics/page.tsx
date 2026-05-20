// app/admin/analytics/page.tsx
import AnalyticsClient from "./components/analyticsOverallClient";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseInt(params.days || '30');
  
  return (
    <AnalyticsClient initialDays={days} />
  );
}