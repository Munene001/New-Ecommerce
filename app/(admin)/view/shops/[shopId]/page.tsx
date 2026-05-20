import AnalyticsClient from './components/analyticsClient';

interface PageProps {
  params: Promise<{ shopId: string }>;
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { shopId } = await params;
  
  return (
    <AnalyticsClient shopId={parseInt(shopId)} />
  );
}