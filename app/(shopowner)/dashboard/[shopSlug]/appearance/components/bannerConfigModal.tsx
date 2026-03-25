"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";
import FormField from "@/app/components/ui/formField";

interface BannerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner: any;
  mode: "activate" | "edit";
  categories: any[];
  onSave: (bannerId: number, data: any) => Promise<void>;
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

  useEffect(() => {
    if (banner) {
      if (banner.category_id) {
        setLinkType("category");
        setCategoryId(banner.category_id.toString());
      } else if (banner.link_url) {
        setLinkType("custom");
        setCustomUrl(banner.link_url);
      }
    }
  }, [banner]);

  const handleSave = async () => {
    const data: any = {};

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
    await onSave(banner.banner_id, data);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

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
              onChange={(e: any) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({
                id: c.category_id,
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