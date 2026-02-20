"use client";

import { Icon } from "@iconify/react";

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  show?: boolean;
}

export default function BulkActions({ 
  selectedCount, 
  onClearSelection, 
  onDelete,
  show = true 
}: BulkActionsProps) {
  if (!show || selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:w-auto w-[80vw] bg-white shadow-lg md:rounded-full rounded-lg border border-gray-200 animate-slideUp z-50">
      {/* Close icon at top right */}
      <button
        onClick={onClearSelection}
        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Clear selection"
      >
        <Icon icon="mdi:close" className="w-6 h-6 md:h-5 md:w-5 text-black" />
      </button>

      {/* Main content */}
      <div className="flex items-center justify-between px-6 gap-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} {selectedCount === 1 ? "product" : "products"} selected
        </span>
        
        <button
          onClick={onDelete}
          className="flex items-center md:gap-2 gap-1  md:px-4 md:py-2 py-1 bg-red-500 text-white md:rounded-full rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
        >
          <Icon icon="mdi:delete" className="md:w-4 md:h-4 w-8 h-8" />
          Delete Selected
        </button>
      </div>
    </div>
  );
}