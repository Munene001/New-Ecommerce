// app/(shop)/[shopSlug]/components/filter.tsx
"use client";

import { ListFilterPlus, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// Define the same types as in the hook
type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';

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
    // other shop data if needed
  };
  activeFilters: ShopFilters;
  onToggleCategory: (categoryId: string) => Promise<void>;
  onSetPriceRange: (min: number, max: number) => Promise<void>;
  onClearPriceRange: () => Promise<void>;
  onSetSortBy: (option: SortOption) => Promise<void>;
  onClearFilters: () => Promise<void>;
  categories: { id: string; name: string }[]; // Add categories from props
}

export default function Filter({ 
  shopData,
  activeFilters,
  onToggleCategory,
  onSetPriceRange,
  onClearPriceRange,
  onSetSortBy,
  onClearFilters,
  categories
}: FilterProps) {
  // Local state for price range slider (two-way)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  
  // Update local state when activeFilters.priceRange changes (for clear button)
  useEffect(() => {
    if (activeFilters.priceRange) {
      setPriceRange([activeFilters.priceRange.min, activeFilters.priceRange.max]);
    } else {
      setPriceRange([0, 15000]); // Reset to default when cleared
    }
  }, [activeFilters.priceRange]);

  // Sort options as radio buttons
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  // Check if any filter is active
  const hasActiveFilters = 
    activeFilters.categories.length > 0 ||
    activeFilters.priceRange !== null ||
    activeFilters.sortBy !== 'newest' ||
    activeFilters.search !== '';

  // Custom slider styles with secondary color
  const sliderStyles = {
    track: {
      backgroundColor: shopData.secondaryColor,
    },
    handle: {
      borderColor: shopData.secondaryColor,
      backgroundColor: shopData.secondaryColor,
      opacity: 1,
      border: `2px solid ${shopData.secondaryColor}`,
    },
    rail: {
      backgroundColor: '#e5e7eb',
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <ListFilterPlus size={20} style={{ color: shopData.secondaryColor }} />
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

      <div>
          <h3 className="font-medium mb-2 text-gray-700">Price Range</h3>
          <div className="px-2">
            <Slider
              range
              min={0}
              max={150000}
              step={100}
              value={priceRange}
              onChange={(value) => setPriceRange(value as [number, number])}
              styles={{
                track: sliderStyles.track,
                handle: sliderStyles.handle,
                rail: sliderStyles.rail,
              }}
            />
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Ksh {priceRange[0].toLocaleString()}</span>
              <span className="text-gray-600">Ksh {priceRange[1].toLocaleString()}</span>
            </div>
            <button
              onClick={() => onSetPriceRange(priceRange[0], priceRange[1])}
              className="mt-2 text-sm px-3 py-1.5 rounded w-full transition-colors"
              style={{ 
                backgroundColor: shopData.secondaryColor,
                color: 'white'
              }}
            >
              Apply Price Filter
            </button>
            {activeFilters.priceRange && (
              <button
                onClick={onClearPriceRange}
                className="mt-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
              >
                <X size={12} />
                Clear price filter
              </button>
            )}
          </div>
        </div>

          {/* Sort By - Radio buttons instead of dropdown */}
          <div>
          <h3 className="font-medium mb-2 text-gray-700">Sort By</h3>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                <div 
                  className="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
                  style={{ 
                    borderColor: activeFilters.sortBy === option.value ? shopData.secondaryColor : '#d1d5db'
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
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Categories - Multiple selection with actual shop categories */}
        <div>
          <h3 className="font-medium mb-2 text-gray-700">Categories</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <div 
                  className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  style={{ 
                    borderColor: activeFilters.categories.includes(cat.id) ? shopData.secondaryColor : '#d1d5db',
                    backgroundColor: activeFilters.categories.includes(cat.id) ? shopData.secondaryColor : 'transparent'
                  }}
                >
                  {activeFilters.categories.includes(cat.id) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Price Range - Two-way slider with rc-slider */}
      
        
      
      </div>
    </div>
  );
}