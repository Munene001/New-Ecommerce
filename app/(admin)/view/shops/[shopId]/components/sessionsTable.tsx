// app/admin/shops/[shopId]/analytics/components/sessionTable.tsx
'use client';

import { useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

interface Session {
  session_id?: string;
  ip_address?: string;
  session_count?: number;
  start_time?: string;
  last_activity?: string;
  referrer_url?: string;
  status?: string;
  shop_view?: number;
  product_view?: number;
  whatsapp_click?: number;
  phone_click?: number;
  add_to_cart?: number;
  checkout_page_view?: number;
  order_placed?: number;
  payment_success?: number;
  [key: string]: any;
}

interface SessionTableProps {
  sessions: Session[];
  eventTypes: string[];
  viewMode: 'sessions' | 'ip';
  loading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (status?: string) => {
  const statusColors: Record<string, string> = {
    Completed: 'bg-green-100 text-green-800',
    'Dropped at Payment': 'bg-yellow-100 text-yellow-800',
    'Dropped at Order': 'bg-orange-100 text-orange-800',
    'Dropped at Checkout': 'bg-red-100 text-red-800',
    'Engaged No Purchase': 'bg-blue-100 text-blue-800',
    'Just Browsing': 'bg-gray-100 text-gray-800',
    Mixed: 'bg-purple-100 text-purple-800',
  };
  
  const color = statusColors[status || 'Just Browsing'] || statusColors['Just Browsing'];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default function SessionTable({
  sessions,
  eventTypes,
  viewMode,
  loading = false,
  hasMore = false,
  loadMore,
}: SessionTableProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Define columns based on view mode
  const getColumns = () => {
    if (viewMode === 'sessions') {
      return [
        { key: 'session_id', label: 'Session ID' },
        { key: 'last_activity', label: 'Date/Time' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'referrer_url', label: 'Referrer' },
        ...eventTypes.filter(et => !['session_id', 'ip_address', 'referrer_url', 'start_time', 'last_activity', 'status'].includes(et)).map(et => ({
          key: et,
          label: et.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        { key: 'status', label: 'Status' },
      ];
    } else {
      return [
        { key: 'ip_address', label: 'IP Address' },
        { key: 'session_count', label: 'Visits' },
        { key: 'last_visit', label: 'Last Visit' },
        { key: 'referrer_url', label: 'Referrer' },
        ...eventTypes.filter(et => !['ip_address', 'session_count', 'first_visit', 'last_visit', 'referrer_url', 'status'].includes(et)).map(et => ({
          key: et,
          label: et.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        { key: 'status', label: 'Status' },
      ];
    }
  };

  const columns = getColumns();

  const lastRowRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && loadMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const renderCellValue = (row: Session, columnKey: string) => {
    if (columnKey === 'status') {
      return getStatusBadge(row.status);
    }
    
    if (columnKey === 'last_activity' || columnKey === 'last_visit') {
      return formatDateTime(row[columnKey]);
    }
    
    if (columnKey === 'referrer_url') {
      const url = row[columnKey];
      if (!url) return 'Direct';
      try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
      } catch {
        return url.substring(0, 50);
      }
    }
    
    if (columnKey === 'session_id' && row[columnKey]) {
      return row[columnKey].substring(0, 8) + '...';
    }
    
    const value = row[columnKey];
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return value || '-';
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <tbody>
            {[1,2,3,4,5].map((i) => (
              <tr key={i} className="border-b border-gray-200 divide-x divide-gray-200">
                {columns.map((col, idx) => (
                  <td key={idx} className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-500">
        <Icon icon="mdi:table-off" className="w-16 h-16 mb-4 text-gray-400" />
        <p className="text-lg font-medium">No data found</p>
        <p className="text-sm">Try adjusting your date range</p>
      </div>
    );
  }

  return (
    /* 1. Added an outer container border and rounded corners */
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          {/* 2. Added divide-x to create vertical grid lines between table headers */}
          <tr className="bg-gray-50 border-b border-gray-200 divide-x divide-gray-200">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-black font-semibold text-sm">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        {/* 3. Added divide-y so rows have neat baselines */}
        <tbody className="divide-y divide-gray-200">
          {sessions.map((session, index) => (
            <tr
              key={viewMode === 'sessions' ? session.session_id : session.ip_address}
              ref={index === sessions.length - 1 ? lastRowRef : null}
              /* 4. Added divide-x to create vertical grid lines between table cells */
              className="divide-x divide-gray-200 hover:bg-gray-50/70 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-gray-900 text-sm">
                  {renderCellValue(session, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {loading && sessions.length > 0 && (
        <div className="flex justify-center items-center py-4 border-t border-gray-200">
          <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-magenta-dark" />
        </div>
      )}

      {!hasMore && sessions.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-xs bg-gray-50 border-t border-gray-200">
          {sessions.length} {viewMode === 'sessions' ? 'sessions' : 'unique IPs'} loaded
        </div>
      )}
    </div>
  );
}