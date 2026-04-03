"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Button from "@/app/components/ui/button";
import InstructionsList from "@/app/components/ui/instructionList";
import BannerUploader from "./bannerUploader";
import BannerConfigModal from "./bannerConfigModal";

// Define proper types - make category_id flexible to handle both string and number
interface Banner {
  banner_id: number;
  is_active?: number;
  category_id?: number | string | null; // Allow string for temporary updates
  link_url?: string | null;
  image_url?: string;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface BannerManagerProps {
  shopId: number;
  shopSlug: string;
  banners: Banner[];
  setBanners: (banners: Banner[]) => void;
  showWarning: (message: string, type: "success" | "error") => void;
}

export default function BannerManager({
  shopId,
  shopSlug,
  banners,
  setBanners,
  showWarning,
}: BannerManagerProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [configModal, setConfigModal] = useState<{
    isOpen: boolean;
    banner: Banner | null;
    mode: "activate" | "edit";
  }>({ isOpen: false, banner: null, mode: "activate" });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`/api/shopowner/categories?shopId=${shopId}`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId) {
      fetchCategories();
    }
  }, [shopId, fetchCategories]);

  const handleActivate = (banner: Banner) => {
    setConfigModal({ isOpen: true, banner, mode: "activate" });
  };

  const handleEdit = (banner: Banner) => {
    setConfigModal({ isOpen: true, banner, mode: "edit" });
  };

  const handleSaveConfig = async (
    bannerId: number,
    data: {
      category_id?: string;
      link_url?: string;
    },
  ) => {
    try {
      const res = await fetch("/api/shopowner/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_id: bannerId,
          shopSlug,
          ...data,
          activate: true,
        }),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.error);

      // Convert category_id to number if it's a string and looks like a number
      const processedData: Partial<Banner> = { ...data };
      if (
        processedData.category_id &&
        typeof processedData.category_id === "string"
      ) {
        processedData.category_id = parseInt(processedData.category_id, 10);
      }

      setBanners(
        banners.map((b) => ({
          ...b,
          ...processedData,
          is_active: b.banner_id === bannerId ? 1 : 0,
        })),
      );
      showWarning("Banner configured and activated!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      showWarning(errorMessage, "error");
    }
  };

  const handleUpdateConfig = async (
    bannerId: number,
    data: {
      category_id?: string;
      link_url?: string;
    },
  ) => {
    try {
      const res = await fetch("/api/shopowner/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_id: bannerId,
          shopSlug,
          ...data,
          activate: false,
        }),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.error);

      // Convert category_id to number if it's a string and looks like a number
      const processedData: Partial<Banner> = { ...data };
      if (
        processedData.category_id &&
        typeof processedData.category_id === "string"
      ) {
        processedData.category_id = parseInt(processedData.category_id, 10);
      }

      setBanners(
        banners.map((b) =>
          b.banner_id === bannerId ? { ...b, ...processedData } : b,
        ),
      );
      showWarning("Banner updated successfully!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      showWarning(errorMessage, "error");
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const res = await fetch(
        `/api/shopowner/banners?banner_id=${bannerId}&shopSlug=${shopSlug}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBanners(banners.filter((b) => b.banner_id !== bannerId));
      showWarning("Banner deleted!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      showWarning(errorMessage, "error");
    }
  };

  const handleUploadSuccess = (newBanners: Banner[]) => {
    setBanners([...newBanners, ...banners]);
    setShowUploadForm(false);
    showWarning(`${newBanners.length} banner(s) uploaded!`, "success");
  };

  const handleDeactivate = async () => {
    const activeBanner = banners.find((b) => b.is_active);
    if (!activeBanner) return;

    try {
      const res = await fetch("/api/shopowner/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_id: activeBanner.banner_id,
          shopSlug,
          activate: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBanners(banners.map((b) => ({ ...b, is_active: 0 })));
      showWarning("Banner deactivated!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      showWarning(errorMessage, "error");
    }
  };

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Banners</div>
      </div>

      <InstructionsList
        items={[
          { text: "Only one banner can be active at a time" },
          { text: "Max 6 banners per shop" },
          { text: "Upload multiple banners at once - they start inactive" },
          { text: "Click Activate to configure link" },
        ]}
        variant="green"
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!showUploadForm && banners.length < 6 && (
          <Button
            onClick={() => setShowUploadForm(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            Upload Banners
          </Button>
        )}
        {banners.some((b) => b.is_active) && (
          <Button
            onClick={handleDeactivate}
            variant="secondary"
            className="flex items-center gap-2 text-red-600"
          >
            <Icon icon="mdi:close-circle" className="w-5 h-5" />
            Deactivate Banner
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <BannerUploader
          shopSlug={shopSlug}
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadForm(false)}
          showWarning={showWarning}
        />
      )}

      {/* Banner List */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No banners yet. Upload your first banner!
          </p>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.banner_id}
              className={`border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 ${
                banner.is_active
                  ? "border-green-500 bg-green-50/30"
                  : "border-gray-200"
              }`}
            >
              {/* Image - full width on mobile, fixed size on desktop */}
              <div className="relative w-full sm:w-24 h-40 sm:h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={`/api/shops/${shopSlug}/banner-image?bannerId=${banner.banner_id}&w=300`}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 96px"
                />
              </div>

              {/* Content - takes remaining space */}
              <div className="flex-1 w-full">
                {/* Status badges - wrap on mobile */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {banner.is_active && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                      <Icon icon="mdi:check-circle" className="w-3 h-3" />
                      Active
                    </span>
                  )}
                  {banner.category_id && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      <Icon icon="mdi:tag" className="w-3 h-3" />
                      Links to Category
                    </span>
                  )}
                  {banner.link_url && !banner.category_id && (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      <Icon icon="mdi:link" className="w-3 h-3" />
                      Custom Link
                    </span>
                  )}
                </div>

                {/* Category name - better formatting for mobile */}
                {banner.category_id &&
                  categories.find(
                    (c) => c.category_id === Number(banner.category_id),
                  ) && (
                    <p className="text-sm text-gray-700 mt-1 break-words">
                      <span className="font-medium text-gray-500">
                        Category:
                      </span>{" "}
                      {
                        categories.find(
                          (c) => c.category_id === Number(banner.category_id),
                        )?.category_name
                      }
                    </p>
                  )}

                {/* Link URL - with better truncation for mobile */}
                {banner.link_url && (
                  <p className="text-sm text-blue-600 break-all mt-1">
                    <span className="font-medium text-gray-500">Link:</span>{" "}
                    <span className="break-all">{banner.link_url}</span>
                  </p>
                )}
              </div>

              {/* Action buttons - full width on mobile, inline on desktop */}
              <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                {!banner.is_active ? (
                  <button
                    onClick={() => handleActivate(banner)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition border border-green-200"
                  >
                    <Icon icon="mdi:check-circle" className="w-4 h-4" />
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200"
                  >
                    <Icon icon="mdi:pencil" className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(banner.banner_id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
                >
                  <Icon icon="mdi:delete" className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Config Modal */}
      <BannerConfigModal
        isOpen={configModal.isOpen}
        onClose={() =>
          setConfigModal({ isOpen: false, banner: null, mode: "activate" })
        }
        banner={configModal.banner}
        mode={configModal.mode}
        categories={categories}
        onSave={
          configModal.mode === "activate"
            ? handleSaveConfig
            : handleUpdateConfig
        }
        showWarning={showWarning}
      />
    </div>
  );
}
