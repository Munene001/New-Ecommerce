"use client";

import { useState } from "react";
import Link from "next/link";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import GoogleSignIn from "@/app/components/auth/googleSigIn";

interface SignupFormProps {
  onSuccess: (formData: any) => void;
  redirect?: string;
}

export default function CustomerSignupForm({ onSuccess, redirect }: SignupFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/shops/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          // full_name is NOT sent; backend will derive it from email
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess({
          email: formData.email,
          phone: formData.phone,
          redirect: redirect
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
        <h1 className="text-3xl font-bold text-primaryText mb-2">Customer Signup</h1>
        <p className="text-three">Create your customer account</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          message.type === "error" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#1a1a2e] text-gray-400">Or continue with</span>
        </div>
      </div>

      <GoogleSignIn 
        userType="customer"
        fullWidth={true}
        onError={(error) => setMessage({ text: error, type: "error" })}
        redirectUrl={redirect || undefined}
      />

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-three font-medium hover:underline">Sign in here</Link>
        </p>
      </div>
    </>
  );
}