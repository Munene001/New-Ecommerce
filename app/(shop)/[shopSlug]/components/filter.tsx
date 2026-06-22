"use client";

import { ArrowLeftRight, Check, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Range } from "react-range";

type SortOption = "newest" | "oldest" | "price_low" | "price_high" | "random";

interface PriceRange {
  min: number;
  max: number;
}

interface ShopFilters {
  search: string;
  categories: string[];
  priceRange: PriceRange | null;
  sortBy: SortOption;
  inStock: boolean;
}

interface FilterProps {
  shopData: {
    secondaryColor: string;
  };
  activeFilters: ShopFilters;
  onToggleCategory: (categoryId: string) => void | Promise<void>;
  onSetPriceRange: (min: number, max: number) => void | Promise<void>;
  onClearPriceRange: () => void | Promise<void>;
  onSetSortBy: (option: SortOption) => void | Promise<void>;
  categories: { id: string; name: string }[];
  maxPrice: number;
  onClose?: () => void;
}

export default function Filter({
  shopData,
  activeFilters,
  onToggleCategory,
  onSetPriceRange,
  onClearPriceRange,
  onSetSortBy,
  categories,
  maxPrice,
  onClose,
}: FilterProps) {
  const maxLimit = maxPrice || 150000;
  
  const currentPriceRange = useMemo<[number, number]>(() => {
    if (activeFilters.priceRange) {
      return [activeFilters.priceRange.min, activeFilters.priceRange.max];
    }
    return [0, maxLimit];
  }, [activeFilters.priceRange, maxLimit]);

  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(currentPriceRange);
  const [prevPriceRange, setPrevPriceRange] = useState(currentPriceRange);
  
  if (prevPriceRange[0] !== currentPriceRange[0] || prevPriceRange[1] !== currentPriceRange[1]) {
    setPrevPriceRange(currentPriceRange);
    setLocalPriceRange(currentPriceRange);
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];

  const getTrackBackground = () => {
    const minPercent = (localPriceRange[0] / maxLimit) * 100;
    const maxPercent = (localPriceRange[1] / maxLimit) * 100;
    return `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${minPercent}%, ${shopData.secondaryColor} ${minPercent}%, ${shopData.secondaryColor} ${maxPercent}%, #e5e7eb ${maxPercent}%, #e5e7eb 100%)`;
  };

  // Wrapper functions that close modal after action
  const handleToggleCategory = async (categoryId: string) => {
    await onToggleCategory(categoryId);
    if (onClose) onClose();
  };

  const handleSetSortBy = async (option: SortOption) => {
    await onSetSortBy(option);
    if (onClose) onClose();
  };

  const handleApplyPriceRange = () => {
    onSetPriceRange(localPriceRange[0], localPriceRange[1]);
    if (onClose) onClose();
  };

  const handleClearPriceRange = () => {
    onClearPriceRange();
    if (onClose) onClose();
  };

  return (
    <div className="bg-white bg-[url('/assets/maze-special.svg')]  bg-repeat bg-[length:400px_auto] p-4 rounded-lg border border-gray-200 sticky top-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-lg rounded-sm text-black border border-gray-700 p-2 flex items-center gap-2">
          <ArrowLeftRight size={20} style={{ color: shopData.secondaryColor }} />
          <span>Filter</span>
        </h2>
      
      </div>

      <div className="space-y-6">
        {/* Price Range Slider */}
        <div className="space-y-3">
          <h3 className="font-medium mb-3 text-gray-700">Price Range</h3>
          <div className="px-2">
            <Range
              step={100}
              min={0}
              max={maxLimit}
              values={localPriceRange}
              onChange={(values) => setLocalPriceRange(values as [number, number])}
              renderTrack={({ props, children }) => {
                const { style, ...trackProps } = props;
                return (
                  <div
                    {...trackProps}
                    className="h-1 w-full rounded"
                    style={{
                      ...style,
                      background: getTrackBackground(),
                    }}
                  >
                    {children}
                  </div>
                );
              }}
              renderThumb={({ props }) => {
                const { style, ...thumbProps } = props;
                return (
                  <div
                    {...thumbProps}
                    className="h-4 w-4 rounded-full shadow-md"
                    style={{
                      ...style,
                      backgroundColor: shopData.secondaryColor,
                      border: `2px solid ${shopData.secondaryColor}`,
                    }}
                  />
                );
              }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-700">Ksh {localPriceRange[0].toLocaleString()}</span>
            <span className="text-gray-700">{localPriceRange[1].toLocaleString()}</span>
          </div>
          <button
            onClick={handleApplyPriceRange}
            className="mt-2 text-sm px-3 py-1.5 rounded w-full transition-colors"
            style={{ backgroundColor: shopData.secondaryColor, color: "white" }}
          >
            Apply Price Filter
          </button>
          {activeFilters.priceRange && (
            <button
              onClick={handleClearPriceRange}
              className="mt-1 text-xs text-gray-600 hover:text-gray-700 flex items-center gap-1 mx-auto"
            >
              <X size={12} />
              Clear price filter
            </button>
          )}
        </div>

        {/* Sort By */}
        <div>
          <h3 className="font-medium mb-2 text-gray-700">Sort By</h3>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div
                  className="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
                  style={{
                    borderColor: activeFilters.sortBy === option.value
                      ? shopData.secondaryColor
                      : "#d1d5db",
                  }}
                >
                  {activeFilters.sortBy === option.value && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: shopData.secondaryColor }} />
                  )}
                </div>
                <input
                  type="radio"
                  name="sortBy"
                  value={option.value}
                  checked={activeFilters.sortBy === option.value}
                  onChange={() => handleSetSortBy(option.value)}
                  className="hidden"
                />
                <span className="text-sm text-gray-900 group-hover:text-gray-900">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-medium mb-2 text-gray-700">Categories</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  style={{
                    borderColor: activeFilters.categories.includes(String(cat.id))
                      ? shopData.secondaryColor
                      : "#d1d5db",
                    backgroundColor: activeFilters.categories.includes(String(cat.id))
                      ? shopData.secondaryColor
                      : "transparent",
                  }}
                >
                  {activeFilters.categories.includes(String(cat.id)) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={activeFilters.categories.includes(String(cat.id))}
                  onChange={() => handleToggleCategory(String(cat.id))}
                  className="hidden"
                />
                <span className="text-sm text-gray-900 group-hover:text-gray-900">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}