"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";
import Input from "@/app/components/ui/input";
import { useAuth } from "@/context/authcontext";
import { useToast } from "@/context/toastContext";
import InstructionsList from "@/app/components/ui/instructionList";
import SimpleToast from "@/app/components/ui/simpleToast";

export default function Settings() {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Shop Information", "Location"];
  const [tabWarning, setTabWarning] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    shop_name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    business_town: "",
    business_address: "",
    whatsapp_number: "",
  });

  // Fetch shop data directly
  useEffect(() => {
    const fetchShopData = async () => {
      if (!shopSlug) return;
      
      try {
        const response = await fetch(`/api/shops/${shopSlug}`);
        if (!response.ok) throw new Error("Failed to fetch shop");
        const shop = await response.json();
        
        setFormData({
          shop_name: shop.shopName || "",
          description: shop.description || "",
          contact_email: shop.contactEmail || "",
          contact_phone: shop.contactPhone || "",
          business_town: shop.businessTown || "",
          business_address: shop.businessAddress || "",
          whatsapp_number: shop.whatsappNumber || "",
        });
      } catch (error) {
        console.error("Error fetching shop:", error);
        showToast("Failed to load shop data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopSlug, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validatePrimaryTab = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.shop_name.trim()) {
      newErrors.shop_name = "Shop name is required";
    }
    
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = "Invalid email format";
    }
    
    if (formData.contact_phone && !/^[0-9]{10,15}$/.test(formData.contact_phone.replace(/\D/g, ""))) {
      newErrors.contact_phone = "Invalid phone number";
    }
    
    if (formData.whatsapp_number && !/^[0-9]{10,15}$/.test(formData.whatsapp_number.replace(/\D/g, ""))) {
      newErrors.whatsapp_number = "Invalid WhatsApp number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.shop_name.trim()) {
      newErrors.shop_name = "Shop name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showWarning = (message: string, type: 'success' | 'error' = 'error') => {
    setTabWarning({ text: message, type });
    setTimeout(() => setTabWarning(null), 5000);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showWarning("Please fix the errors before saving", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/shopowner/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          shop_name: formData.shop_name,
          description: formData.description,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          business_town: formData.business_town,
          business_address: formData.business_address,
          whatsapp_number: formData.whatsapp_number,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      showToast("Settings updated successfully!", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to update settings", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeIndex === 0 && !validatePrimaryTab()) {
      showWarning("Please fix the errors before proceeding", "error");
      return;
    }
    setTabWarning(null);
    if (activeIndex < sections.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setTabWarning(null);
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleTabClick = (index: number) => {
    if (index > 0) {
      const hasErrors = !formData.shop_name.trim();
      if (hasErrors) {
        showWarning("Please complete all required fields first", "error");
        return;
      }
    }
    setTabWarning(null);
    setActiveIndex(index);
  };

  const renderComponent = () => {
    switch (activeIndex) {
      case 0:
        return (
          <div className="space-y-8 md:space-y-5">
            <div>
              <div className="text-xl font-semibold text-black">Shop Information</div>
            </div>
            
            <InstructionsList
              items={[
                { text: "Your shop name appears in the header and search results" },
                { text: "Contact details are displayed to customers on your shop page" },
                { text: "WhatsApp number enables customers to message you directly" },
              ]}
              variant="green"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Shop Name"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                placeholder="Enter shop name"
                required
                hasError={!!errors.shop_name}
                error={errors.shop_name}
              />
              <Input
                label="Contact Email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
                placeholder="shop@example.com"
                hasError={!!errors.contact_email}
                error={errors.contact_email}
              />
              <Input
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                placeholder="254712345678"
                hasError={!!errors.contact_phone}
                error={errors.contact_phone}
              />
              <Input
                label="WhatsApp Number"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="254712345678"
                hasError={!!errors.whatsapp_number}
                error={errors.whatsapp_number}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition font-[Poppins]"
                  placeholder="Describe your shop..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-8 md:space-y-5">
            <div>
              <div className="text-xl font-semibold text-black">Location</div>
            </div>
            
            <InstructionsList
              items={[
                { text: "Your shop location helps customers find you" },
                { text: "Town/City and address are displayed on your shop page" },
              ]}
              variant="green"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Town/City"
                name="business_town"
                value={formData.business_town}
                onChange={handleChange}
                placeholder="e.g., Nairobi"
                hasError={!!errors.business_town}
                error={errors.business_town}
              />
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleChange}
                  placeholder="Street name, building, floor"
                  hasError={!!errors.business_address}
                  error={errors.business_address}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative font-[Poppins]">
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
          Shop Settings
        </h1>
        <p className="text-gray-600 mt-2 font-[Poppins]">
          Manage your shop information and contact details
        </p>
      </div>

      <SimpleToast message={tabWarning} onClose={() => setTabWarning(null)} />

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
                  {index === 0 && (
                    <span className="ml-1 text-red-500 text-xs">*</span>
                  )}
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
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm md:p-6 px-3 py-6">
        {renderComponent()}
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