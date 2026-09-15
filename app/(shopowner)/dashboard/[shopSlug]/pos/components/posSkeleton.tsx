export const POSProductCardSkeleton = () => (
  <div className="w-full font-[Poppins] animate-pulse">
    <div className="relative w-full aspect-square bg-gray-200 rounded-md"></div>
    <div className="mt-1.5 space-y-1.5">
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-between">
        <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
        <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);