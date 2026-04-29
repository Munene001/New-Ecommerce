"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";

interface SignupFormProps {
  onSuccess: (formData: any) => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    business_name: "",
    business_town: "",
    business_address: "",
    slug: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Generate slug when business name changes
    if (name === "business_name" && value) {
      const slug = `${value.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      setFormData((prev) => ({ ...prev, slug }));
    }
    
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
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
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
    if (!formData.business_name.trim()) newErrors.business_name = "Business name is required";
    if (!formData.business_town.trim()) newErrors.business_town = "Business town is required";
    if (!formData.business_address.trim()) newErrors.business_address = "Business address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/shopowner/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          business_name: formData.business_name,
          business_town: formData.business_town,
          business_address: formData.business_address,
          slug: formData.slug,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          business_name: formData.business_name,
          business_town: formData.business_town,
          business_address: formData.business_address,
          slug: formData.slug,
        });
      } else {
        setMessage({ text: data.error || "Signup failed", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primaryText mb-2">Shop Owner Signup</h1>
        <p className="text-three">Create your Shop account</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          message.type === "error" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <Input 
              name="full_name" 
              placeholder="John Doe"
              value={formData.full_name} 
              onChange={handleChange} 
              hasError={!!errors.full_name} 
              error={errors.full_name} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email Address *</label>
            <Input 
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
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number *</label>
            <PhoneInput 
              international 
              defaultCountry="KE" 
              value={phoneValue} 
              onChange={handlePhoneChange} 
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Business Name *</label>
            <Input 
              name="business_name" 
              placeholder="My Awesome Shop"
              value={formData.business_name} 
              onChange={handleChange} 
              hasError={!!errors.business_name} 
              error={errors.business_name} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Business Town *</label>
            <Input 
              name="business_town" 
              placeholder="e.g., Westlands"
              value={formData.business_town} 
              onChange={handleChange} 
              hasError={!!errors.business_town} 
              error={errors.business_town} 
              required 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Business Address *</label>
          <Input 
            name="business_address" 
            placeholder="Street name, building, floor"
            value={formData.business_address} 
            onChange={handleChange} 
            hasError={!!errors.business_address} 
            error={errors.business_address} 
            required 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <Input 
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
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password *</label>
            <Input 
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
        
        <div className="flex items-center">
          <input type="checkbox" id="terms" className="mr-2" required />
          <label className="text-sm text-gray-300">
            I agree to the <Link href="/terms" className="text-three hover:underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-three hover:underline">Privacy Policy</Link>
          </label>
        </div>
        
        <Button type="submit" disabled={loading} variant="secondary" className="w-full">
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-three font-medium hover:underline">Sign in here</Link>
        </p>
      </div>
    </>
  );
}