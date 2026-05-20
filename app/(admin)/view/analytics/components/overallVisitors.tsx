// app/admin/analytics/components/overallVisitorTable.tsx
'use client';

import { useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

interface Visitor {
  ip_address: string;
  total_events: number;
  first_activity: string;
  last_activity: string;
  referrer_url: string;
  status: string;
  [key: string]: any;
}

interface OverallVisitorTableProps {
  visitors: Visitor[];
  eventTypes: string[];
  loading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
}

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
    'Completed Signup': 'bg-green-100 text-green-800',
    'Dropped at Verification': 'bg-yellow-100 text-yellow-800',
    'Dropped at Signup': 'bg-orange-100 text-orange-800',
    'Engaged': 'bg-blue-100 text-blue-800',
    'Just Browsing': 'bg-gray-100 text-gray-800',
  };
  
  const color = statusColors[status || 'Just Browsing'] || statusColors['Just Browsing'];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default function OverallVisitorTable({
  visitors,
  eventTypes,
  loading = false,
  hasMore = false,
  loadMore,
}: OverallVisitorTableProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Define columns
  const getColumns = () => {
    return [
      { key: 'ip_address', label: 'IP Address' },
      { key: 'total_events', label: 'Events' },
      { key: 'last_activity', label: 'Last Activity' },
      { key: 'referrer_url', label: 'Referrer' },
      ...eventTypes.map(et => ({
        key: et,
        label: et.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })),
      { key: 'status', label: 'Status' },
    ];
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

  const renderCellValue = (visitor: Visitor, columnKey: string) => {
    if (columnKey === 'status') {
      return getStatusBadge(visitor.status);
    }
    
    if (columnKey === 'last_activity') {
      return formatDateTime(visitor.last_activity);
    }
    
    if (columnKey === 'referrer_url') {
      const url = visitor.referrer_url;
      if (!url) return 'Direct';
      try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
      } catch {
        return url.substring(0, 50);
      }
    }
    
    const value = visitor[columnKey];
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return value || '-';
  };

  if (loading && visitors.length === 0) {
    return (
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-gray-200">
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

  if (visitors.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-500">
        <Icon icon="mdi:table-off" className="w-16 h-16 mb-4 text-gray-400" />
        <p className="text-lg font-medium">No visitors found</p>
        <p className="text-sm">Try adjusting your date range</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-black font-semibold text-sm border-r border-gray-200 last:border-r-0">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visitors.map((visitor, index) => (
            <tr
              key={visitor.ip_address}
              ref={index === visitors.length - 1 ? lastRowRef : null}
              className="border-b border-gray-200 hover:bg-gray-50/70 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-gray-900 text-sm border-r border-gray-200 last:border-r-0">
                  {renderCellValue(visitor, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {loading && visitors.length > 0 && (
        <div className="flex justify-center items-center py-4 border-t border-gray-200">
          <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-magenta-dark" />
        </div>
      )}

      {!hasMore && visitors.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-xs bg-gray-50 border-t border-gray-200">
          {visitors.length} unique visitors loaded
        </div>
      )}
    </div>
  );
}