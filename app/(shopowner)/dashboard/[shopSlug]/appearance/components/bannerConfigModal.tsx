"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";
import FormField from "@/app/components/ui/formField";

// Define proper types - make category_id more flexible to handle both string and number
interface Banner {
  banner_id: number;
  category_id?: number | string | null;
  link_url?: string | null;
  is_active?: number;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface BannerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: Banner | null;  // Allow banner to be null
  mode: "activate" | "edit";
  categories: Category[];
  onSave: (bannerId: number, data: { category_id?: string; link_url?: string }) => Promise<void>;
  showWarning: (message: string, type: "success" | "error") => void;
}

export default function BannerConfigModal({
  isOpen,
  onClose,
  banner,
  mode,
  categories,
  onSave,
  showWarning,
}: BannerConfigModalProps) {
  const [linkType, setLinkType] = useState<"category" | "custom">("category");
  const [categoryId, setCategoryId] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const prevBannerIdRef = useRef<number | null>(null);

  // Initialize state when banner changes - use a reducer-like pattern
  useEffect(() => {
    // Only initialize if we have a banner and it's different from the previous one
    if (banner && prevBannerIdRef.current !== banner.banner_id) {
      prevBannerIdRef.current = banner.banner_id;
      
      // Initialize form state based on banner data
      if (banner.category_id) {
        setLinkType("category");
        setCategoryId(banner.category_id.toString());
        setCustomUrl(""); // Clear custom URL
      } else if (banner.link_url) {
        setLinkType("custom");
        setCustomUrl(banner.link_url);
        setCategoryId(""); // Clear category selection
      } else {
        // Default state if no link data
        setLinkType("category");
        setCategoryId("");
        setCustomUrl("");
      }
    }
  }, [banner]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form state when modal closes
      setLinkType("category");
      setCategoryId("");
      setCustomUrl("");
      prevBannerIdRef.current = null;
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!banner) return;
    
    const data: { category_id?: string; link_url?: string } = {};

    if (linkType === "category") {
      if (!categoryId) {
        showWarning("Please select a category", "error");
        return;
      }
      data.category_id = categoryId;
    } else if (linkType === "custom") {
      if (!customUrl.trim()) {
        showWarning("Please enter a URL", "error");
        return;
      }
      data.link_url = customUrl;
    }

    setSaving(true);
    try {
      await onSave(banner.banner_id, data);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  if (!isOpen || !banner) return null;

  // Handle FormField onChange which may pass either event or direct value
  const handleCategoryChange = (value: string | number | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (typeof value === 'string' || typeof value === 'number') {
      setCategoryId(value.toString());
    } else if (value && typeof value === 'object' && 'target' in value) {
      setCategoryId(value.target.value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <Icon icon="mdi:close" className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-semibold mb-4">
          {mode === "activate" ? "Activate Banner" : "Edit Banner"}
        </h3>

        <div className="space-y-4">
          {/* Link Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link To
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLinkType("category")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                  linkType === "category"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Category
              </button>
              <button
                type="button"
                onClick={() => setLinkType("custom")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                  linkType === "custom"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Custom URL
              </button>
            </div>
          </div>

          {/* Category Dropdown */}
          {linkType === "category" && categories.length > 0 && (
            <FormField
              name="category_id"
              label="Select Category"
              type="select"
              value={categoryId}
              onChange={handleCategoryChange}
              options={categories.map((c) => ({
                id: c.category_id.toString(),
                name: c.category_name,
              }))}
              placeholder="Choose a category"
            />
          )}
          
          {/* Custom URL Input */}
          {linkType === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom URL
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/shop/category/electronics or https://..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving} loading={saving}>
            {mode === "activate" ? "Activate" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}