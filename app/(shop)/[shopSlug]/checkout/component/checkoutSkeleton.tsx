// app/(shop)/[shopSlug]/checkout/components/CheckoutSkeleton.tsx
"use client";

export default function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-white py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* PageBar Skeleton */}
        <div className="bg-gray-100 py-3 border-y border-gray-200 mb-6">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center gap-2">
              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:gap-8">
          
          {/* Left Column - Form Skeleton */}
          <div className="lg:flex-1 order-1 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
              {/* Header */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
                <div className="h-6 w-40 bg-gray-300 rounded animate-pulse" />
              </div>
              
              <div className="space-y-4">
                {/* Name and Email row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse" />
                  </div>
                  <div>
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse" />
                  </div>
                </div>
                
                {/* Phone and City row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse" />
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mb-2" />
                    <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse" />
                  </div>
                </div>
                
                {/* Address */}
                <div>
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2" />
                  <div className="h-24 w-full bg-gray-300 rounded-lg animate-pulse" />
                </div>
                
                {/* Special Instructions */}
                <div>
                  <div className="h-4 w-40 bg-gray-300 rounded animate-pulse mb-2" />
                  <div className="h-20 w-full bg-gray-300 rounded-lg animate-pulse" />
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-6" />
              
              {/* Payment Method Skeleton */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
                  <div className="h-5 w-32 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-[72px] w-full bg-gray-300 rounded-lg animate-pulse" />
                  <div className="h-[72px] w-full bg-gray-300 rounded-lg animate-pulse" />
                </div>
              </div>
              
              {/* Delivery Note Skeleton */}
              <div className="mt-5">
                <div className="h-[88px] w-full bg-gray-300 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Right Column - Order Summary Skeleton */}
          <div className="lg:w-[420px] order-2 lg:order-2 mt-6 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 sticky top-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse" />
                  <div className="h-6 w-32 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-gray-300 rounded animate-pulse" />
              </div>
              
              {/* Items */}
              <div className="space-y-3 mb-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 py-3 border-b border-gray-100">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2" />
                      <div className="h-3 w-20 bg-gray-300 rounded animate-pulse mb-2" />
                      <div className="flex gap-2">
                        <div className="w-7 h-7 bg-gray-300 rounded-lg animate-pulse" />
                        <div className="w-8 h-7 bg-gray-300 rounded animate-pulse" />
                        <div className="w-7 h-7 bg-gray-300 rounded-lg animate-pulse" />
                      </div>
                    </div>
                    <div className="w-16 h-5 bg-gray-300 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="border-t border-dashed border-gray-200 pt-3 mt-2">
                  <div className="flex justify-between">
                    <div className="h-5 w-12 bg-gray-300 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Button */}
              <div className="h-12 w-full bg-gray-300 rounded-lg animate-pulse mt-5" />
              
              {/* Secure notice */}
              <div className="flex justify-center mt-4">
                <div className="h-3 w-40 bg-gray-300 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}