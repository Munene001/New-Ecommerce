"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

import { useToast } from "@/context/toastContext";
import LoadingFix from "@/app/components/layout/loadingFix";
import WarningModal from "./components/warningModal";
import ShopInfoForm from "./components/shopInfoForm";
import LocationForm from "./components/locationForm";

export default function Settings() {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Shop Information", "Location"];

  // Warning modal state
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [originalShopName, setOriginalShopName] = useState("");

  // Shop ID state
  const [shopId, setShopId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    shop_name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    business_town: "",
    business_address: "",
    whatsapp_number: "",
  });

  // Fetch shop data
  useEffect(() => {
    const fetchShopData = async () => {
      if (!shopSlug) return;

      try {
        const response = await fetch(`/api/shops/${shopSlug}`);
        if (!response.ok) throw new Error("Failed to fetch shop");
        const shop = await response.json();

        setShopId(shop.shopId);

        setFormData({
          shop_name: shop.shopName || "",
          description: shop.description || "",
          contact_email: shop.contactEmail || "",
          contact_phone: shop.contactPhone || "",
          business_town: shop.businessTown || "",
          business_address: shop.businessAddress || "",
          whatsapp_number: shop.whatsappNumber || "",
        });

        setOriginalShopName(shop.shopName || "");
      } catch (error) {
        console.error("Error fetching shop:", error);
        showToast("Failed to load shop data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopSlug, showToast]);

  const validatePrimaryTab = () => {
    if (!formData.shop_name.trim()) {
      showToast("Shop name is required", "error");
      return false;
    }

    if (
      formData.contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)
    ) {
      showToast("Invalid email format", "error");
      return false;
    }

    if (
      formData.contact_phone &&
      !/^[0-9]{10,15}$/.test(formData.contact_phone.replace(/\D/g, ""))
    ) {
      showToast("Invalid phone number", "error");
      return false;
    }

    if (
      formData.whatsapp_number &&
      !/^[0-9]{10,15}$/.test(formData.whatsapp_number.replace(/\D/g, ""))
    ) {
      showToast("Invalid WhatsApp number", "error");
      return false;
    }

    return true;
  };

  const submitForm = async (data: typeof formData) => {
    if (!shopId) {
      showToast("Shop ID not found", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/shopowner/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shopId,
          shop_name: data.shop_name,
          description: data.description,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          business_town: data.business_town,
          business_address: data.business_address,
          whatsapp_number: data.whatsapp_number,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update settings");
      }

      showToast("Settings updated successfully!", "success");

      // If slug changed, redirect to new URL
      if (responseData.newSlug && responseData.newSlug !== shopSlug) {
        setTimeout(() => {
          window.location.href = `/dashboard/${responseData.newSlug}/settings`;
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
      setShowWarningModal(false);
    }
  };

  const handleFormSubmit = () => {
    const hasShopNameChanged = formData.shop_name !== originalShopName;

    if (hasShopNameChanged) {
      setPendingFormData({ ...formData });
      setShowWarningModal(true);
    } else {
      submitForm(formData);
    }
  };

  const getNewSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNext = () => {
    if (activeIndex === 0) {
      if (!validatePrimaryTab()) return;
    }

    if (activeIndex < sections.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleFormSubmit();
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleTabClick = (index: number) => {
    if (index > 0 && !formData.shop_name.trim()) {
      showToast("Please complete Shop Information first", "error");
      return;
    }
    setActiveIndex(index);
  };

  if (loading) {
    return <LoadingFix />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative font-[Poppins]">
      {/* Warning Modal */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={() => pendingFormData && submitForm(pendingFormData)}
        oldSlug={shopSlug}
        newSlug={getNewSlugFromName(
          pendingFormData?.shop_name || formData.shop_name,
        )}
        loading={submitting}
      />

     

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black font-[Poppins]">
          Shop Settings
        </h1>
        <p className="text-gray-900 mt-2 font-[Poppins]">
          Manage your shop information and contact details
        </p>
      </div>

      <div className="w-full mb-8">
        <div className="flex">
          <div className="md:w-[75%] w-full">
            <div className="relative w-full mb-8">
              <div className="flex justify-between mb-1">
                {sections.map((section, index) => (
                  <button
                    key={section}
                    onClick={() => handleTabClick(index)}
                    className={`flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] transition-colors font-[Poppins] relative ${
                      index === activeIndex
                        ? "text-black"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {section}
                    {index === 0 && (
                      <span className="ml-1 text-red-500 text-xs">*</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Continuous gray line */}
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-400"></div>

              {/* Magenta highlight line */}
              <div
                className="absolute bottom-0 h-2 rounded-lg bg-magenta transition-all duration-300"
                style={{
                  width: `${100 / sections.length}%`,
                  left: `${(100 / sections.length) * activeIndex}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm md:p-6 px-3 py-6">
        {activeIndex === 0 && (
          <ShopInfoForm formData={formData} setFormData={setFormData} />
        )}
        {activeIndex === 1 && (
          <LocationForm formData={formData} setFormData={setFormData} />
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={activeIndex === 0}
          className={`px-6 py-3 rounded-lg font-[Poppins] text-sm font-medium transition-colors ${
            activeIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={submitting}
          className="px-6 py-3 bg-three text-white rounded-lg font-[Poppins] text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
              Saving...
            </span>
          ) : activeIndex === sections.length - 1 ? (
            "Save Changes"
          ) : (
            "Next"
          )}
        </button>
      </div>
    </div>
  );
}
