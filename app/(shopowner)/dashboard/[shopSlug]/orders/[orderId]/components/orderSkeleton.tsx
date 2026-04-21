// app/(shopowner)/components/OrderSkeleton.tsx
'use client';

export default function OrderSkeleton() {
  return (
    <div className="md:p-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
          <div>
            <div className="h-7 bg-gray-300 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="w-32 h-10 bg-gray-300 rounded-lg animate-pulse"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
              <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded w-48 animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 bg-gray-300 rounded w-24 animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              ))}
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-300 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
              <div className="h-6 bg-gray-300 rounded w-40 animate-pulse"></div>
            </div>
            <div className="px-6 py-4">
              <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
                <div className="h-6 bg-gray-300 rounded w-40 animate-pulse"></div>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <div className="h-3 bg-gray-300 rounded w-16 animate-pulse mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-300 rounded w-16 animate-pulse mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}