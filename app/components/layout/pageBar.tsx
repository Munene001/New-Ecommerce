// app/components/layout/PageContextBar.tsx
"use client";

import {PackageCheck} from "lucide-react"; // or use any icon library you prefer

interface PageContextBarProps {
  breadcrumb: string; 
  itemCount?: number; 
  itemName?: string; 
}

export default function PageBar({ breadcrumb, itemCount, itemName }: PageContextBarProps) {
    return (
      <div className="bg-gray-100 py-3 border-y border-gray-200 font-[Poppins]">
        <div className="container mx-auto px-4">
          <div className="flex md:justify-end justify-center items-center gap-2 text-sm font-[Inter]">
            <span className="text-gray-500">{breadcrumb}</span>
            {itemCount !== undefined && (
              <>
                <span className="text-gray-400">—</span>
                <span className="font-medium text-black inline-flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4" /> 
                  products({itemCount})
                </span>
              </>
            )}
            {itemName && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{itemName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }