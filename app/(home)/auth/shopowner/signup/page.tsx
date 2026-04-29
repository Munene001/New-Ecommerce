"use client";

import { useState } from "react";
import SignupForm from "./components/signUpForm";
import VerifyOTP from "./components/verifyOtp";

type Step = "form" | "verify";

export default function ShopOwnerSignupPage() {
  const [step, setStep] = useState<Step>("form");
  const [savedFormData, setSavedFormData] = useState<any>(null);

  const handleSignupSuccess = (formData: any) => {
    setSavedFormData(formData);
    setStep("verify");
  };

  const handleBackToSignup = () => {
    setStep("form");
  };

  return (
    <div className="min-h-screen text-white font-[Plus_Jakarta_Sans] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl">
        {step === "form" && (
          <SignupForm onSuccess={handleSignupSuccess} />
        )}
        
        {step === "verify" && (
          <VerifyOTP 
            savedFormData={savedFormData}
            onBack={handleBackToSignup}
          />
        )}
      </div>
    </div>
  );
}