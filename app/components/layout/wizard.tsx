// components/shopowner/Wizard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, Store, Loader2, X } from "lucide-react";
import FormInput from "../ui/formInput";
import { useToast } from "@/context/toastContext";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface WizardProps {
  shopSlug: string;
  shopId: number;
  onComplete?: () => void;
}

export default function Wizard({ shopSlug, shopId, onComplete }: WizardProps) {
  const { showToast } = useToast();
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Form values
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");
  const [whatsappValue, setWhatsappValue] = useState<string | undefined>("");
  const [formData, setFormData] = useState({
    business_town: "",
    business_address: "",
  });
  
  // Store original values from DB to know when to clear on focus
  const originalValuesRef = useRef({
    phone: "",
    whatsapp: "",
    town: "",
    address: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkWizardStatus = async () => {
      try {
        const response = await fetch(`/api/shopowner/wizard?shopId=${shopId}`);
        
        if (!response.ok) {
          throw new Error("Failed to check status");
        }
        
        const data = await response.json();

        if (data.completed === true) {
          setIsComplete(true);
          setHasChecked(true);
          return;

        }

        if (data.existingData) {
          // Store original values
          if (data.existingData.phone) {
            const phone = data.existingData.phone;
            setPhoneValue(phone);
            originalValuesRef.current.phone = phone;
          }
          if (data.existingData.whatsapp_number) {
            const whatsapp = data.existingData.whatsapp_number;
            setWhatsappValue(whatsapp);
            originalValuesRef.current.whatsapp = whatsapp;
          }
          if (data.existingData.business_town) {
            const town = data.existingData.business_town;
            setFormData(prev => ({ ...prev, business_town: town }));
            originalValuesRef.current.town = town;
          }
          if (data.existingData.business_address) {
            const address = data.existingData.business_address;
            setFormData(prev => ({ ...prev, business_address: address }));
            originalValuesRef.current.address = address;
          }
        }

        const skipUntil = localStorage.getItem(`wizard_skip_until_${shopSlug}`);
        const isSkipped = skipUntil && Date.now() < parseInt(skipUntil);

        // No auto-open modal – only show when button clicked
        setHasChecked(true);
      } catch (error) {
        console.error("Failed to check wizard status:", error);
        setHasChecked(true);
      }
    };

    if (shopId && !hasChecked) {
      checkWizardStatus();
    }
  }, [shopId, shopSlug, hasChecked]);

  // Clear field on focus if it still contains the original DB value
  const handlePhoneFocus = () => {
    if (phoneValue === originalValuesRef.current.phone && originalValuesRef.current.phone) {
      setPhoneValue("");
    }
    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
  };

  const handleWhatsappFocus = () => {
    if (whatsappValue === originalValuesRef.current.whatsapp && originalValuesRef.current.whatsapp) {
      setWhatsappValue("");
    }
    if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: "" }));
  };

  const handleTownFocus = () => {
    if (formData.business_town === originalValuesRef.current.town && originalValuesRef.current.town) {
      setFormData(prev => ({ ...prev, business_town: "" }));
    }
    if (errors.business_town) setErrors(prev => ({ ...prev, business_town: "" }));
  };

  const handleAddressFocus = () => {
    if (formData.business_address === originalValuesRef.current.address && originalValuesRef.current.address) {
      setFormData(prev => ({ ...prev, business_address: "" }));
    }
    if (errors.business_address) setErrors(prev => ({ ...prev, business_address: "" }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!phoneValue || !phoneValue.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.business_town.trim()) {
      newErrors.business_town = "Town/City is required";
    }

    if (!formData.business_address.trim()) {
      newErrors.business_address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors before continuing", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/shopowner/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneValue,
          whatsapp_number: whatsappValue || null,
          business_town: formData.business_town,
          business_address: formData.business_address,
          shopId: shopId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete setup");
      }

      localStorage.removeItem(`wizard_skip_until_${shopSlug}`);
      showToast("Setup completed successfully!", "success");
      
      setIsComplete(true);
      setShowModal(false);
      
      if (onComplete) {
        onComplete();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to complete setup";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const skipUntil = Date.now() + (48 * 60 * 60 * 1000);
    localStorage.setItem(`wizard_skip_until_${shopSlug}`, skipUntil.toString());
    setShowModal(false);
    showToast("You can complete this later", );
  };

  if (!hasChecked) return null;
  if (isComplete) return null;

  return (
    <>
      {/* Banner with button to open modal */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Action Required: Shop Setup Incomplete
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Add your contact information so customers can reach you
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-three text-white rounded-lg text-sm font-medium hover:bg-three/90 transition-colors shadow-sm"
          >
            Complete Setup
          </button>
        </div>
      </div>

      {/* Modal - only opens when button clicked */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 p-5 bg-gradient-to-r from-three/5 to-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-three/10 flex items-center justify-center">
                    <Store className="w-5 h-5 text-three" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Complete Shop Setup</h2>
                    <p className="text-sm text-gray-500">Add your contact information</p>
                  </div>
                </div>
                <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  This information will appear in your shop's contact section so customers can reach you.
                </p>
              </div>

              {/* Phone Number - clears on focus if original value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  defaultCountry="KE"
                  value={phoneValue}
                  onChange={setPhoneValue}
                  onFocus={handlePhoneFocus}
                  placeholder="Enter phone number"
                  className="w-full"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              {/* WhatsApp Number - clears on focus if original value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <PhoneInput
                  defaultCountry="KE"
                  value={whatsappValue}
                  onChange={setWhatsappValue}
                  onFocus={handleWhatsappFocus}
                  placeholder="Enter WhatsApp number"
                  className="w-full"
                />
              </div>

              {/* Town/City - clears on focus if original value */}
              <FormInput
                name="business_town"
                label="Town/City"
                type="text"
                value={formData.business_town}
                onChange={handleChange}
                onFocus={handleTownFocus}
                placeholder="e.g., Nairobi"
                required
                icon="mapPin"
              />

              {/* Business Address - clears on focus if original value */}
              <FormInput
                name="business_address"
                label="Business Address"
                type="text"
                value={formData.business_address}
                onChange={handleChange}
                onFocus={handleAddressFocus}
                placeholder="Street name, building, floor"
                required
                icon="home"
              />
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
              >
                Remind Later (48h)
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 bg-three text-white rounded-lg hover:bg-three/90 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ensure placeholders have visible color */}
      <style jsx global>{`
        .PhoneInputInput::placeholder,
        input::placeholder,
        textarea::placeholder {
          color: #9ca3af !important;
          opacity: 1;
        }
      `}</style>
    </>
  );
}