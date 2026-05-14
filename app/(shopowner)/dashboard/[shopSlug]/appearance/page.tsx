"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useToast } from "@/context/toastContext";
import SimpleToast from "@/app/components/ui/simpleToast";
import HeaderForm from "./components/headerForm";
import ColorForm from "./components/colorForm";
import BannerManager from "./components/bannerManager";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import LoadingFix from "@/app/components/layout/loadingFix";

interface Banner {
  banner_id: number;
  category_id?: number | string | null;
  link_url?: string | null;
  is_active?: number;
  image_url?: string;
}

export default function AppearancePage() {
  const params = useParams();
  const shopSlug = params?.shopSlug as string; // Keep for UI/URLs only
  const { showToast } = useToast();
  const { shopId } = useShop(); // Get ID from context
  
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Header & Cart", "Colors", "Banners"];
  const [tabWarning, setTabWarning] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [headerMessage, setHeaderMessage] = useState("");
  const [cartIcon, setCartIcon] = useState("cart");
  const [secondaryColor, setSecondaryColor] = useState("#f54a00");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Fetch current appearance settings
  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) return; // Don't fetch without ID
      
      try {
        // Change to use shopId
        const res = await fetch(`/api/shops/${shopId}`);
        const data = await res.json();
        setHeaderMessage(data.headerMessage || "");
        setCartIcon(data.cartIcon || "cart");
        setSecondaryColor(data.secondaryColor || "#f54a00");
        
        // Change to use shopId
        const bannerRes = await fetch(`/api/shopowner/banners?shopId=${shopId}`);
        const bannerData = await bannerRes.json();
        if (bannerData.success) {
          setBanners(bannerData.banners);
        }
      } catch {
        showToast("Failed to load appearance settings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId, showToast]); // Changed dependency to shopId

  const showWarning = (message: string, type: 'success' | 'error' = 'error') => {
    setTabWarning({ text: message, type });
    setTimeout(() => setTabWarning(null), 5000);
  };

  const handleUpdateHeader = async (data: { header_message: string; cart_icon: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/shopowner/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...data }), // Send shopId instead of shopSlug
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("Header settings updated!", "success");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      showToast(errorMessage, "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateColor = async (data: { secondary_color: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/shopowner/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...data }), // Send shopId instead of shopSlug
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("Color updated!", "success");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      showToast(errorMessage, "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const renderComponent = () => {
    switch (activeIndex) {
      case 0:
        return (
          <HeaderForm
            headerMessage={headerMessage}
            setHeaderMessage={setHeaderMessage}
            cartIcon={cartIcon}
            setCartIcon={setCartIcon}
            onSubmit={handleUpdateHeader}
            submitting={submitting}
          />
        );
      case 1:
        return (
          <ColorForm
            secondaryColor={secondaryColor}
            setSecondaryColor={setSecondaryColor}
            onSubmit={handleUpdateColor}
            submitting={submitting}
          />
        );
      case 2:
        return (
          <BannerManager
            shopId={shopId}
            shopSlug={shopSlug}  // Only pass shopId, remove shopSlug
            banners={banners}
            setBanners={setBanners}
            showWarning={showWarning}
          />
        );
      default:
        return null;
    }
  };

  const handleTabClick = (index: number) => {
    setTabWarning(null);
    setActiveIndex(index);
  };

  if (loading) {
    return <LoadingFix/>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-[Poppins]">
      <div className="mb-6">
        <Link
          href={`/dashboard/${shopSlug}/products`}
          className="inline-flex items-center text-gray-700 hover:text-black text-[16px] transition-colors font-[Poppins]"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black font-[Poppins]">
          Appearance
        </h1>
        <p className="text-gray-600 mt-2 font-[Poppins]">
          Customize your shop&apos;s look and feel
        </p>
      </div>

      <SimpleToast message={tabWarning} onClose={() => setTabWarning(null)} />

      {/* Tabs */}
      <div className="w-full mb-8">
        <div className="flex">
          <div className="md:w-[75%] w-full">
            <div className="flex justify-between mb-1">
              {sections.map((section, index) => (
                <button
                  key={section}
                  onClick={() => handleTabClick(index)}
                  className={`flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] transition-colors font-[Poppins] ${
                    index === activeIndex
                      ? "text-black"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  style={{ width: `${100 / sections.length}%` }}
                >
                  {section}
                </button>
              ))}
            </div>
            <div className="relative w-full h-[10px] bg-gray-400">
              <div
                className="absolute h-[10px] bg-magenta-dark rounded-full transition-all duration-300"
                style={{
                  width: `${100 / sections.length}%`,
                  left: `${(100 / sections.length) * activeIndex}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm md:p-6 px-3 py-6">
        {renderComponent()}
      </div>
    </div>
  );
}