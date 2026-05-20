// app/admin/analytics/components/analyticsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import OverallStatsCards from './overallStatsCard';
import OverallFunnelChart from './overallFunnelChart';
import OverallVisitorTable from './overallVisitors';
import OverallFilterBar from './overallFilterBar';

interface AnalyticsClientProps {
  initialDays: number;
}

export default function AnalyticsClient({ initialDays }: AnalyticsClientProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchAnalytics = async (page: number, daysValue: number, append: boolean = false) => {
    try {
      const res = await fetch(`/api/admin/analytics?days=${daysValue}&page=${page}&limit=20`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await res.json();
      
      if (result.success) {
        const newVisitors = append ? [...visitors, ...result.visitors] : result.visitors;
        setVisitors(newVisitors);
        setData(result);
        setCurrentPage(result.pagination?.currentPage || 1);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      if (!append) setLoading(false);
      setLoadingMore(false);
    }
  };

  const updateDays = async (newDays: number) => {
    setDays(newDays);
    setLoading(true);
    setCurrentPage(1);
    await fetchAnalytics(1, newDays, false);
  };

  const loadMore = async () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    await fetchAnalytics(currentPage + 1, days, true);
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics(1, initialDays, false);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Failed to load analytics'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Site Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Shop owner signup funnel and visitor analytics
        </p>
      </div>

      {/* Stats Cards */}
      <OverallStatsCards summary={data.summary} />

      {/* Filter Bar */}
      <OverallFilterBar
        days={days}
        onDaysChange={updateDays}
      />

      {/* Funnel Chart Section */}
      <div className="my-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Signup Funnel
        </h2>
        <OverallFunnelChart funnel={data.funnel} />
      </div>

      {/* Engagement Section */}
      <div className="my-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Engagement</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex-1 min-w-[200px]">
            <p className="text-sm text-green-700 font-medium">WhatsApp</p>
            <p className="text-2xl font-bold text-gray-800">{data.engagement.whatsapp_click.unique_visitors} visitors</p>
            <p className="text-xs text-gray-500">{data.engagement.whatsapp_click.clicks} total clicks</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex-1 min-w-[200px]">
            <p className="text-sm text-blue-700 font-medium">Phone</p>
            <p className="text-2xl font-bold text-gray-800">{data.engagement.phone_click.unique_visitors} visitors</p>
            <p className="text-xs text-gray-500">{data.engagement.phone_click.clicks} total clicks</p>
          </div>
        </div>
      </div>

      {/* Visitor Table Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Visitor Details (by IP Address)
        </h2>
        <OverallVisitorTable
          visitors={visitors}
          eventTypes={data.available_event_types}
          loading={loadingMore}
          hasMore={currentPage < totalPages}
          loadMore={loadMore}
        />
      </div>
    </div>
  );
}