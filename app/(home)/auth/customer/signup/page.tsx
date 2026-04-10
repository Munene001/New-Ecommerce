"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import Modal from "@/app/components/ui/modal";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Component that uses useSearchParams
function CustomerSignupContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");

  // Store redirect parameter on mount
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      sessionStorage.setItem("loginRedirect", redirect);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    setPhoneValue(value);
    setFormData((prev) => ({ ...prev, phone: value || "" }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim())
      newErrors.full_name = "Full name is required";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!formData.confirm_password)
      newErrors.confirm_password = "Please confirm your password";
    else if (formData.password !== formData.confirm_password)
      newErrors.confirm_password = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const redirect = sessionStorage.getItem("loginRedirect") || "";

    try {
      const response = await fetch("/api/shops/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          redirect,
          redirectTo: `${window.location.origin}/api/auth/callback?next=/auth/login`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.verified) {
          setModal({
            isOpen: true,
            title: "Account Created!",
            message: "Your account has been verified and created. You can now log in.",
            type: "success",
          });
          // Clear form on successful verified signup
          setFormData({
            full_name: "",
            email: "",
            phone: "",
            password: "",
            confirm_password: "",
          });
          setPhoneValue("");
        } else {
          setModal({
            isOpen: true,
            title: "Check Your Email",
            message: "Account created! Please verify your email before logging in.",
            type: "info",
          });
          // Keep form data so user can see what they entered
        }
      } else {
        setModal({
          isOpen: true,
          title: "Signup Failed",
          message: data.error || "Something went wrong. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setModal({
        isOpen: true,
        title: "Error",
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Build login link with the stored redirect
  const loginLink = () => {
    const redirect = sessionStorage.getItem("loginRedirect");
    return redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : "/auth/login";
  };

  return (
    <div className="min-h-screen text-white font-[Plus_Jakarta_Sans] flex flex-col justify-center items-center p-4">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primaryText mb-2">
            Customer Signup
          </h1>
          <p className="text-three">Create your customer account</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={handleChange}
              hasError={!!errors.full_name}
              error={errors.full_name}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              hasError={!!errors.email}
              error={errors.email}
              required
            />
          </div>

          {/* Phone - Using react-phone-number-input */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number *
            </label>
            <PhoneInput
              international
              defaultCountry="KE"
              value={phoneValue}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              className="w-full"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
            <style jsx global>{`
              .PhoneInput {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #1f2937;
                border: 1px solid ${errors.phone ? '#ef4444' : '#374151'};
                border-radius: 0.5rem;
                padding: 0.5rem 0.75rem;
              }
              .PhoneInput:focus-within {
                outline: none;
                ring: 2px solid #EAA022;
              }
              .PhoneInputInput {
                border: none;
                outline: none;
                flex: 1;
                background: transparent;
                font-size: 1rem;
                color: white;
              }
              .PhoneInputInput::placeholder {
                color: #6b7280;
              }
              .PhoneInputCountry {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              .PhoneInputCountrySelect {
                background: #1f2937;
                color: white;
                border: none;
              }
            `}</style>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password *
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              hasError={!!errors.password}
              error={errors.password}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium mb-2">
              Confirm Password *
            </label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirm_password}
              onChange={handleChange}
              hasError={!!errors.confirm_password}
              error={errors.confirm_password}
              required
            />
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              className="mr-2 h-4 w-4 rounded border-gray-300 bg-gray-800 text-[#EAA022] focus:ring-[#EAA022]"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-300">
              I agree to the{" "}
              <Link href="/terms" className="text-[#EAA022] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#EAA022] hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center mb-20">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href={loginLink()} className="text-[#EAA022] font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CustomerSignup() {
  return (
    <Suspense fallback={
      <div className="min-h-screen text-white font-[Plus_Jakarta_Sans] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primaryText mb-2">
              Customer Signup
            </h1>
            <p className="text-[#EAA022]">Loading...</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-700 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CustomerSignupContent />
    </Suspense>
  );
}