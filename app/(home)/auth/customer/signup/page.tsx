"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CustomerSignupForm from "./components/customerSignUp";
import VerifyOTP from "../../shopowner/signup/components/verifyOtp";

type Step = "form" | "verify";

function CustomerSignupContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || undefined;
  const [step, setStep] = useState<Step>("form");
  const [savedFormData, setSavedFormData] = useState<any>(null);

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

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CustomerSignupContent />
    </Suspense>
  );
}