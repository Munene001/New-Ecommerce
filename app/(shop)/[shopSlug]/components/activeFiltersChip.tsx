"use client";

import { X } from "lucide-react";
import FilterChip from "@/app/components/ui/filterChip";

interface ActiveFilters {
  search: string;
  categories: (string | number)[];
  priceRange: {
    min: number;
    max: number;
  } | null;
  sortBy: string;
  inStock: boolean;
}

interface ActiveFilterChipsProps {
  activeFilters: ActiveFilters;
  categories: Array<{ id: string | number; name: string }>;
  totalCount: number;
  onRemoveSearch: () => void;
  onRemoveCategory: (categoryId: string) => void | Promise<void>;
  onRemovePriceRange: () => void;
  onRemoveSort: () => void;
  onRemoveInStock: () => void;
  onClearAll: () => void;
  secondaryColor: string;
}

export default function ActiveFilterChips({
  activeFilters,
  categories,
  totalCount,
  onRemoveSearch,
  onRemoveCategory,
  onRemovePriceRange,
  onRemoveSort,
  onRemoveInStock,
  onClearAll,
  secondaryColor,
}: ActiveFilterChipsProps) {
  const hasActiveFilters =
    activeFilters.search ||
    activeFilters.categories.length > 0 ||
    activeFilters.priceRange ||
    activeFilters.sortBy !== "random" ||
    activeFilters.inStock;

  if (!hasActiveFilters) return null;

  const sortLabels: Record<string, string> = {
    price_low: "Price low",
    price_high: "Price high",
    oldest: "Oldest",
    newest: "Newest",
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search chip */}
        {activeFilters.search && (
          <FilterChip
            label={`"${activeFilters.search}"`}
            onRemove={onRemoveSearch}
            color={secondaryColor}
          />
        )}

        {/* Category chips */}
        {activeFilters.categories.map((catId) => {
          const catIdStr = String(catId);
          const category = categories.find((c) => String(c.id) === catIdStr);
          if (!category) return null;
          return (
            <FilterChip
              key={catIdStr}
              label={category.name}
              onRemove={() => onRemoveCategory(catIdStr)}
              color={secondaryColor}
            />
          );
        })}

        {/* Price range chip */}
        {activeFilters.priceRange && (
          <FilterChip
            label={`Ksh ${activeFilters.priceRange.min.toLocaleString()} – ${activeFilters.priceRange.max.toLocaleString()}`}
            onRemove={onRemovePriceRange}
            color={secondaryColor}
          />
        )}

        {/* Sort chip - shows for ANY sort that's not 'random' (newest, price_low, price_high, oldest) */}
        {activeFilters.sortBy !== "random" && (
          <FilterChip
            label={`Sort: ${sortLabels[activeFilters.sortBy] || activeFilters.sortBy}`}
            onRemove={onRemoveSort}
            color={secondaryColor}
          />
        )}

        {/* In stock chip */}
        {activeFilters.inStock && (
          <FilterChip
            label="In stock"
            onRemove={onRemoveInStock}
            color={secondaryColor}
          />
        )}

        {/* Clear all button */}
        <button
          onClick={onClearAll}
          className="flex items-center bg-black gap-1 px-3 py-1 rounded-full text-sm text-white ml-auto"
        >
          <X size={14} />
          Clear all
        </button>
      </div>

      {/* Result count */}
      <div className="text-sm text-gray-500">
        {totalCount} {totalCount === 1 ? "product" : "products"} found
      </div>
    </div>
  );
}