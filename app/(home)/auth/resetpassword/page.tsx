"use client";

import { useState, useEffect } from "react";
import RequestStep from "./components/requestStep";
import EmailSentStep from "./components/emailSentStep";
import NewPasswordStep from "./components/newPasswordStep";
import SuccessStep from "./components/successStep";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export type ResetPasswordStep =
  | "request"
  | "email-sent"
  | "new-password"
  | "success";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<ResetPasswordStep>("request");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    // If there's a PKCE code (password reset callback), exchange it for a session
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            setStep("new-password");
            setEmail(data.session.user.email || "");
            setSuccess("Please set your new password");
            // Clean the URL (remove code param)
            window.history.replaceState({}, document.title, "/auth/resetpassword");
          }
        });
      });
      return; // Wait for exchange, don't run other checks yet
    }

    // Existing recovery param detection (for backward compatibility)
    const hash = window.location.hash;
    const hasRecoveryParam = params.get("type") === "recovery" || 
                             hash.includes("type=recovery") ||
                             params.get("code");
    
    if (hasRecoveryParam) {
      setIsRecoveryFlow(true);
    }

    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && hasRecoveryParam) {
        setStep("new-password");
        setEmail(session.user.email || "");
        setSuccess("Please set your new password");
      } else if (session && !hasRecoveryParam) {
        await supabase.auth.signOut();
        setStep("request");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isRecovery = event === "PASSWORD_RECOVERY" || 
                         session?.user?.recovery_sent_at !== undefined;
      
      if (isRecovery && session) {
        setIsRecoveryFlow(true);
        setStep("new-password");
        setEmail(session.user.email || "");
        setSuccess("Please set your new password");
        window.history.replaceState({}, document.title, "/auth/resetpassword");
      }
    });

    checkExistingSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSendEmail = async (email: string) => {
    setIsLoading(true);
    setError("");

    try {
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      // Use the correct redirect URL for localhost (or production)
      const redirectUrl = `${window.location.origin}/auth/resetpassword`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: redirectUrl }
      );

      if (resetError) throw new Error(resetError.message);

      setEmail(email);
      setStep("email-sent");
      setSuccess(`Reset link sent to ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (
    newPassword: string,
    confirmPassword: string,
  ) => {
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

      await supabase.auth.signOut();
      setIsRecoveryFlow(false);
      
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
        return (
          <RequestStep
            onSubmit={handleSendEmail}
            isLoading={isLoading}
            error={error}
            setError={setError}
          />
        );
      case "email-sent":
        return (
          <EmailSentStep
            email={email}
            onChangeEmail={() => setStep("request")}
            isLoading={isLoading}
            success={success}
            setStep={setStep}
            setError={setError}
          />
        );
      case "new-password":
        return (
          <NewPasswordStep
            email={email}
            onSubmit={handleResetPassword}
            isLoading={isLoading}
            error={error}
            setError={setError}
          />
        );
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