// app/(shop)/[shopSlug]/components/filter.tsx
"use client";

import { ListFilterPlus, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Range } from "react-range";

type SortOption = "newest" | "oldest" | "price_low" | "price_high";

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

  // Allow both sync and async functions
  onToggleCategory: (categoryId: string) => void | Promise<void>;
  onSetPriceRange: (min: number, max: number) => void | Promise<void>;
  onClearPriceRange: () => void | Promise<void>;
  onSetSortBy: (option: SortOption) => void | Promise<void>;
  onClearFilters: () => void | Promise<void>;
  categories: { id: string; name: string }[];
  maxPrice: number;
}

export default function Filter({
  shopData,
  activeFilters,
  onToggleCategory,
  onSetPriceRange,
  onClearPriceRange,
  onSetSortBy,
  onClearFilters,
  categories,
  maxPrice,
}: FilterProps) {
  console.log("Filter received categories:", categories);
  const maxLimit = maxPrice || 150000;
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxLimit]);

  // Sync with activeFilters.priceRange (e.g., after clear)
  useEffect(() => {
    if (activeFilters.priceRange) {
      setPriceRange([
        activeFilters.priceRange.min,
        activeFilters.priceRange.max,
      ]);
    } else {
      setPriceRange([0, maxLimit]);
    }
  }, [activeFilters.priceRange, maxLimit]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];

  const hasActiveFilters =
    activeFilters.categories.length > 0 ||
    activeFilters.priceRange !== null ||
    activeFilters.sortBy !== "newest" ||
    activeFilters.search !== "";

  // Helper to compute track background gradient
  const getTrackBackground = () => {
    const minPercent = (priceRange[0] / maxLimit) * 100;
    const maxPercent = (priceRange[1] / maxLimit) * 100;
    return `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${minPercent}%, ${shopData.secondaryColor} ${minPercent}%, ${shopData.secondaryColor} ${maxPercent}%, #e5e7eb ${maxPercent}%, #e5e7eb 100%)`;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <ListFilterPlus
            size={20}
            style={{ color: shopData.secondaryColor }}
          />
          <span>Filter</span>
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range Slider – react-range */}
        <div className="space-y-3">
          <h3 className="font-medium mb-3 text-gray-700">Price Range</h3>
          <div className="px-2">
            <Range
              step={100}
              min={0}
              max={maxLimit}
              values={priceRange}
              onChange={(values) => setPriceRange(values as [number, number])}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  className="h-1 w-full rounded"
                  style={{
                    ...props.style,
                    background: getTrackBackground(),
                  }}
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  className="h-4 w-4 rounded-full shadow-md"
                  style={{
                    ...props.style,
                    backgroundColor: shopData.secondaryColor,
                    border: `2px solid ${shopData.secondaryColor}`,
                  }}
                />
              )}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-700">
              Ksh {priceRange[0].toLocaleString()}
            </span>
            <span className="text-gray-700">
              {priceRange[1].toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => onSetPriceRange(priceRange[0], priceRange[1])}
            className="mt-2 text-sm px-3 py-1.5 rounded w-full transition-colors"
            style={{ backgroundColor: shopData.secondaryColor, color: "white" }}
          >
            Apply Price Filter
          </button>
          {activeFilters.priceRange && (
            <button
              onClick={onClearPriceRange}
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
                    borderColor:
                      activeFilters.sortBy === option.value
                        ? shopData.secondaryColor
                        : "#d1d5db",
                  }}
                >
                  {activeFilters.sortBy === option.value && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: shopData.secondaryColor }}
                    />
                  )}
                </div>
                <input
                  type="radio"
                  name="sortBy"
                  value={option.value}
                  checked={activeFilters.sortBy === option.value}
                  onChange={() => onSetSortBy(option.value)}
                  className="hidden"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
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
                    borderColor: activeFilters.categories.includes(
                      String(cat.id)
                    )
                      ? shopData.secondaryColor
                      : "#d1d5db",
                    backgroundColor: activeFilters.categories.includes(
                      String(cat.id)
                    )
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
                  onChange={() => onToggleCategory(String(cat.id))}
                  className="hidden"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">
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