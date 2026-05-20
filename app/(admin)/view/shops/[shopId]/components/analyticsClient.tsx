// app/admin/shops/[shopId]/analytics/components/analyticsClient.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { useShopTracking } from '../hooks/useShopTracking';
import ShopAnalyticsCard from './shopAnalyticsCard';
import FunnelChart from './funnelChart';
import SessionTable from './sessionsTable';
import AnalFilterBar from './analFilterBar';
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";

interface AnalyticsClientProps {
  shopId: number;
}

export default function AnalyticsClient({ shopId }: AnalyticsClientProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const {
    stats,
    funnel,
    engagement,
    sessions,
    availableEventTypes,
    shopInfo,
    dateRange,
    viewMode,
    updateDateRange,
    updateViewMode,
    refresh,
    loading,
    error
  } = useShopTracking(shopId);

  const handleDeleteShop = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/shops/${shopId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Shop deleted successfully' });
        setTimeout(() => {
          router.push('/view/shops');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete shop' });
        setShowDeleteModal(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error: Failed to delete shop' });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading && !sessions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={refresh}
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
      <SimpleToast message={message} onClose={() => setMessage(null)} />

      {/* Header with Back and Delete buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {shopInfo?.shop_name || 'Shop Analytics'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Customer journey analytics and conversion insights
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Delete Shop</span>
        </button>
      </div>

      {/* Stats Cards */}
      <ShopAnalyticsCard stats={stats} />

      {/* Filter Bar with Date Range and View Mode Toggle */}
      <AnalFilterBar
        dateRange={dateRange}
        viewMode={viewMode}
        onDateRangeChange={updateDateRange}
        onViewModeChange={updateViewMode}
      />

      {/* Funnel Chart Section */}
      <div className="my-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Customer Journey Funnel ({viewMode === 'sessions' ? 'Per Visit' : 'Per Person'})
        </h2>
        <FunnelChart data={funnel} viewMode={viewMode} />
      </div>

      {/* Engagement Section */}
      <div className="my-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Engagement</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex-1 min-w-[200px]">
            <p className="text-sm text-green-700 font-medium">WhatsApp</p>
            <p className="text-2xl font-bold text-gray-800">{engagement.whatsapp_click.sessions} sessions</p>
            <p className="text-xs text-gray-500">{engagement.whatsapp_click.clicks} total clicks</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex-1 min-w-[200px]">
            <p className="text-sm text-blue-700 font-medium">Phone</p>
            <p className="text-2xl font-bold text-gray-800">{engagement.phone_click.sessions} sessions</p>
            <p className="text-xs text-gray-500">{engagement.phone_click.clicks} total clicks</p>
          </div>
        </div>
      </div>

      {/* Session Table Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {viewMode === 'sessions' ? 'Session Details' : 'Unique IP Addresses'}
        </h2>
        <SessionTable
          sessions={sessions}
          eventTypes={availableEventTypes}
          viewMode={viewMode}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Shop</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <span className="font-semibold">{shopInfo?.shop_name}</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone. All products, orders, and data associated with this shop will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteShop}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Shop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}