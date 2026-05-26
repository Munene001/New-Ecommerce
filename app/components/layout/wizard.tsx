// components/shopowner/Wizard.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Store, Phone, MapPin, Home, Loader2, X } from "lucide-react";
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
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");
  const [formData, setFormData] = useState({
    business_town: "",
    business_address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check wizard status on mount (only once)
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

        // Check localStorage for skip period (48 hours)
        const skipUntil = localStorage.getItem(`wizard_skip_until_${shopSlug}`);
        const isSkipped = skipUntil && Date.now() < parseInt(skipUntil);

        if (!isSkipped) {
          // Auto-trigger modal on first visit
          setShowModal(true);
        }
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

  // Don't render until we've checked status
  if (!hasChecked) {
    return null;
  }

  // If complete, show nothing
  if (isComplete) {
    return null;
  }

  return (
    <>
      {/* Banner - Red urgency banner */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
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

      {/* Modal (centered overlay) - Magenta/Three theme */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
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
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  This information will appear in your shop's contact section so customers can reach you.
                </p>
              </div>

              {/* Phone Input with Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  international
                  defaultCountry="KE"
                  value={phoneValue}
                  onChange={setPhoneValue}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-three/20 focus:border-three"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <FormInput
                name="business_town"
                label="Town/City"
                type="text"
                value={formData.business_town}
                onChange={handleChange}
                placeholder="e.g., Nairobi"
                required
                icon="mapPin"
              />

              <FormInput
                name="business_address"
                label="Business Address"
                type="text"
                value={formData.business_address}
                onChange={handleChange}
                placeholder="Street name, building, floor"
                required
                icon="home"
              />
            </div>

            {/* Footer - Magenta/Three buttons */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Remind Later (48h)
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 bg-three text-white rounded-lg hover:bg-three/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}