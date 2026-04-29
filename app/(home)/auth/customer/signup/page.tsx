"use client";

import { useState } from "react";
import CustomerSignupForm from "./components/customerSignUp";
import VerifyOTP from "../../shopowner/signup/components/verifyOtp";
import { getRedirect } from "@/lib/redirect/helper"; // Reuse the same component

type Step = "form" | "verify";

export default function CustomerSignupPage() {
  const [step, setStep] = useState<Step>("form");
  const [savedFormData, setSavedFormData] = useState<any>(null);
  const redirect = getRedirect() || undefined;

  const handleSignupSuccess = (formData: any) => {
     setSavedFormData({ ...formData, redirect });
    setStep("verify");
  };

  const handleBackToSignup = () => {
    setStep("form");
  };

  return (
    <div className="min-h-screen text-white font-[Plus_Jakarta_Sans] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl">
        {step === "form" && (
         <CustomerSignupForm onSuccess={handleSignupSuccess} redirect={redirect} />
        )}
        
        {step === "verify" && (
          <VerifyOTP 
            savedFormData={savedFormData}
            onBack={handleBackToSignup}
            userType="customer"
          />
        )}
      </div>
    </div>
  );
}