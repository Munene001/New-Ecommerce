"use client";

export default function LoadingFix() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-[Poppins]">
      {/* Back button */}
      <div className="mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Tabs */}
      <div className="w-full mb-8">
        <div className="flex md:w-[75%] w-full gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="relative w-full h-[10px] bg-gray-200 mt-2 rounded animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
        
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
          <div className="md:col-span-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}