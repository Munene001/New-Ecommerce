"use client";

import { useState, useEffect } from "react";
import RequestStep from "./components/requestStep";
import EmailSentStep from "./components/emailSentStep";
import NewPasswordStep from "./components/newPasswordStep";
import SuccessStep from "./components/successStep";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export type ResetPasswordStep = "request" | "email-sent" | "new-password" | "success";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<ResetPasswordStep>("request");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create the browser client once per component (re‑creation is cheap)
  const supabase = createSupabaseBrowserClient();

  // Check for recovery token in URL
  useEffect(() => {
    const checkRecoverySession = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes('type=recovery')) {
        setIsLoading(true);
        setError("");
        
        try {
          // Wait a moment for Supabase to process the token
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            throw new Error('Invalid or expired reset link');
          }

          if (session?.user) {
            setEmail(session.user.email || '');
            setStep("new-password");
            setSuccess("Please set your new password");
            window.history.replaceState({}, document.title, '/resetpassword');
          } else {
            throw new Error('Invalid reset token');
          }
        } catch {
          setError("Failed to process reset link");
          setStep("request");
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkRecoverySession();
  }, [supabase]); // Include supabase in dependencies

  const handleSendEmail = async (email: string) => {
    setIsLoading(true);
    setError("");

    try {
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/resetpassword`,
        }
      );

      if (resetError) throw new Error(resetError.message);

      setEmail(email);
      setStep("email-sent");
      setSuccess(`Reset link sent to ${email}`);
    } catch {
      setError("Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
    setIsLoading(true);
    setError("");

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw new Error(updateError.message);

      // Sign out to clear any session
      await supabase.auth.signOut();
      
      setStep("success");
      setSuccess("Password reset successfully! You can now login.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="w-full max-w-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Processing...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case "request":
        return <RequestStep onSubmit={handleSendEmail} isLoading={isLoading} error={error} setError={setError} />;
      case "email-sent":
        return <EmailSentStep email={email} onChangeEmail={() => setStep("request")} isLoading={isLoading} success={success} setStep={setStep} setError={setError} />;
      case "new-password":
        return <NewPasswordStep email={email} onSubmit={handleResetPassword} isLoading={isLoading} error={error} setError={setError} />;
      case "success":
        return <SuccessStep success={success} />;
    }
  };

  return (
    <div className="flex min-h-screen items-center font-[Plus_Jakarta_Sans] justify-center bg-transparent p-4">
      <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md">
        {renderStep()}
      </div>
    </div>
  );
}