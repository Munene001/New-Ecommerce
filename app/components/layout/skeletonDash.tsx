"use client";

import { useState, useEffect } from "react";

export default function DashboardSkeleton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 h-[85px] bg-white z-50 shadow-sm">
        <div className="h-full bg-black bg-[url('/assets/mazehex4.svg')] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <div className="w-8 h-8 bg-white/10 rounded animate-pulse"></div>
            )}
            <div className="w-32 h-8 bg-white/10 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block w-32 h-6 bg-white/10 rounded animate-pulse"></div>
            <div className="w-20 h-10 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="pt-[85px] flex min-h-screen">
        {/* Left Nav Skeleton - Only on desktop */}
        {!isMobile && (
          <aside className="sticky top-16 w-64 h-[calc(100vh-85px)] bg-black bg-[url('/assets/mazehex4.svg')] text-white overflow-y-auto p-4">
            <div className="space-y-4">
              {[1,2,3,4,5,6,7].map((i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-5 h-5 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-6 py-3">
                  <div className="w-5 h-5 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Skeleton - Universal container */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto">
            {/* Content blocks that work for any dashboard */}
            
            {/* Title block */}
            <div className="mb-8">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Stats cards grid - adaptable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      <div className="h-8 w-12 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action button */}
            <div className="flex justify-end mb-6">
              <div className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Search/filter bar */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              <div className="flex-1 min-w-[250px]">
                <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-40 h-12 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
              <div className="w-40 h-12 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
            </div>

            {/* Table/List area - flexible height */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              {/* Table header */}
              <div className="flex border-b border-gray-200 bg-gray-50 p-4 gap-4">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="h-4 w-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              
              {/* Table rows */}
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex border-b border-gray-200 p-4 gap-4">
                  {[1,2,3,4,5].map((j) => (
                    <div key={j} className="h-4 w-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}