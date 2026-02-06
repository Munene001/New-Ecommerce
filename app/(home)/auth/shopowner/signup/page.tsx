"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import Modal from "@/app/components/ui/modal";

export default function ShopOwnerSignup() {
  const router = useRouter();
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
    type: "info"
  });
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    business_name: "",
    business_town: "",
    business_address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
    else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, "")))
      newErrors.phone = "Invalid phone number";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!formData.confirm_password)
      newErrors.confirm_password = "Please confirm your password";
    else if (formData.password !== formData.confirm_password)
      newErrors.confirm_password = "Passwords do not match";

    if (!formData.business_name.trim())
      newErrors.business_name = "Business name is required";
    if (!formData.business_town.trim())
      newErrors.business_town = "Business town is required";
    if (!formData.business_address.trim())
      newErrors.business_address = "Business address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/shopowner/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          business_name: formData.business_name,
          business_town: formData.business_town,
          business_address: formData.business_address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.verified) {
          setModal({
            isOpen: true,
            title: "Account Created!",
            message: "Account verified and created successfully! You can now log in.",
            type: "success"
          });
          // Only clear form on successful verified signup
          setFormData({
            full_name: "",
            email: "",
            phone: "",
            password: "",
            confirm_password: "",
            business_name: "",
            business_town: "",
            business_address: "",
          });
        } else {
          setModal({
            isOpen: true,
            title: "Check Your Email",
            message: "Account created successfully! Please check your email to verify your account before logging in.",
            type: "info"
          });
          // Do NOT clear form for email verification case
        }
      } else {
        setModal({
          isOpen: true,
          title: "Signup Failed",
          message: data.error || "Signup failed. Please try again.",
          type: "error"
        });
        // Do NOT clear form on error - user can fix and resubmit
      }
    } catch (error) {
      console.error("Signup error:", error);
      setModal({
        isOpen: true,
        title: "Error",
        message: "An error occurred. Please try again.",
        type: "error"
      });
      // Do NOT clear form on network/unknown errors
    } finally {
      setLoading(false);
    }
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
      
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primaryText mb-2">
            Shop Owner Signup
          </h1>
          <p className="text-three">Create your Shop account</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium mb-2"
              >
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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="254712345678"
                value={formData.phone}
                onChange={handleChange}
                hasError={!!errors.phone}
                error={errors.phone}
                required
              />
            </div>

            {/* Business Name */}
            <div>
              <label
                htmlFor="business_name"
                className="block text-sm font-medium mb-2"
              >
                Business Name *
              </label>
              <Input
                id="business_name"
                name="business_name"
                type="text"
                placeholder="My Awesome Shop"
                value={formData.business_name}
                onChange={handleChange}
                hasError={!!errors.business_name}
                error={errors.business_name}
                required
              />
            </div>

            {/* Business County */}
            

            {/* Business Town */}
            <div>
              <label
                htmlFor="business_town"
                className="block text-sm font-medium mb-2"
              >
                Business Town *
              </label>
              <Input
                id="business_town"
                name="business_town"
                type="text"
                placeholder="e.g., Westlands"
                value={formData.business_town}
                onChange={handleChange}
                hasError={!!errors.business_town}
                error={errors.business_town}
                required
              />
            </div>
          </div>

          {/* Business Address - Full Width */}
          <div>
            <label
              htmlFor="business_address"
              className="block text-sm font-medium mb-2"
            >
              Business Address *
            </label>
            <Input
              id="business_address"
              name="business_address"
              type="text"
              placeholder="Street name, building, floor"
              value={formData.business_address}
              onChange={handleChange}
              hasError={!!errors.business_address}
              error={errors.business_address}
              required
            />
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
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
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium mb-2"
              >
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
              <Link href="/terms" className="text-three hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-three hover:underline">
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
            <Link
              href="/auth/login"
              className="text-three font-medium hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}