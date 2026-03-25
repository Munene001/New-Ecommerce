"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";
import InstructionsList from "@/app/components/ui/instructionList";
import BannerUploader from "./bannerUploader";
import BannerConfigModal from "./bannerConfigModal";

interface BannerManagerProps {
  shopId: number;  
  shopSlug: string;
  banners: any[];
  setBanners: (banners: any[]) => void;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [configModal, setConfigModal] = useState<{
    isOpen: boolean;
    banner: any | null;
    mode: "activate" | "edit";
  }>({ isOpen: false, banner: null, mode: "activate" });

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/shopowner/categories?shopId=${shopId}`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };
  
  useEffect(() => {
    if (shopId) {
      fetchCategories();
    }
  }, [shopId]);
  
  const handleActivate = (banner: any) => {
    setConfigModal({ isOpen: true, banner, mode: "activate" });
  };

  const handleEdit = (banner: any) => {
    setConfigModal({ isOpen: true, banner, mode: "edit" });
  };

  const handleSaveConfig = async (bannerId: number, data: {
    category_id?: string;
    link_url?: string;
  }) => {
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
      
      setBanners(banners.map(b => ({ 
        ...b, 
        ...data,
        is_active: b.banner_id === bannerId ? 1 : 0 
      })));
      showWarning("Banner configured and activated!", "success");
    } catch (error: any) {
      showWarning(error.message, "error");
    }
  };

  const handleUpdateConfig = async (bannerId: number, data: {
    category_id?: string;
    link_url?: string;
  }) => {
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
      
      setBanners(banners.map(b => b.banner_id === bannerId ? { ...b, ...data } : b));
      showWarning("Banner updated successfully!", "success");
    } catch (error: any) {
      showWarning(error.message, "error");
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      const res = await fetch(`/api/shopowner/banners?banner_id=${bannerId}&shopSlug=${shopSlug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setBanners(banners.filter(b => b.banner_id !== bannerId));
      showWarning("Banner deleted!", "success");
    } catch (error: any) {
      showWarning(error.message, "error");
    }
  };

  const handleUploadSuccess = (newBanners: any[]) => {
    setBanners([...newBanners, ...banners]);
    setShowUploadForm(false);
    showWarning(`${newBanners.length} banner(s) uploaded!`, "success");
  };

  const handleDeactivate = async () => {
    const activeBanner = banners.find(b => b.is_active);
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
      
      setBanners(banners.map(b => ({ ...b, is_active: 0 })));
      showWarning("Banner deactivated!", "success");
    } catch (error: any) {
      showWarning(error.message, "error");
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
          <Button onClick={() => setShowUploadForm(true)} variant="secondary" className="flex items-center gap-2">
            <Icon icon="mdi:plus" className="w-5 h-5" />
            Upload Banners
          </Button>
        )}
        {banners.some(b => b.is_active) && (
          <Button onClick={handleDeactivate} variant="secondary" className="flex items-center gap-2 text-red-600">
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
          <p className="text-gray-500 text-center py-8">No banners yet. Upload your first banner!</p>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.banner_id}
              className={`border rounded-lg p-4 flex items-center gap-4 ${
                banner.is_active ? "border-green-500 bg-green-50/30" : "border-gray-200"
              }`}
            >
              <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img
                  src={`/api/shops/${shopSlug}/banner-image?bannerId=${banner.banner_id}&w=200`}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {banner.is_active && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                      <Icon icon="mdi:check-circle" className="w-3 h-3" />
                      Active
                    </span>
                  )}
                  {banner.category_id && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      <Icon icon="mdi:tag" className="w-3 h-3" />
                      Links to Category
                    </span>
                  )}
                  {banner.link_url && !banner.category_id && (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      <Icon icon="mdi:link" className="w-3 h-3" />
                      Custom Link
                    </span>
                  )}
                </div>
                {banner.category_id && categories.find(c => c.category_id === banner.category_id) && (
                  <p className="text-xs text-gray-600 mt-1">
                    Category: {categories.find(c => c.category_id === banner.category_id)?.category_name}
                  </p>
                )}
                {banner.link_url && (
                  <p className="text-xs text-blue-600 truncate mt-1">{banner.link_url}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!banner.is_active ? (
                  <button
                    onClick={() => handleActivate(banner)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-100 rounded-lg transition"
                  >
                    <Icon icon="mdi:check-circle" className="w-4 h-4" />
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition"
                  >
                    <Icon icon="mdi:pencil" className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(banner.banner_id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition"
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
        onClose={() => setConfigModal({ isOpen: false, banner: null, mode: "activate" })}
        banner={configModal.banner}
        mode={configModal.mode}
        categories={categories}
        onSave={configModal.mode === "activate" ? handleSaveConfig : handleUpdateConfig}
        showWarning={showWarning}
      />
    </div>
  );
}