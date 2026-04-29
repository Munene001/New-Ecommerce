"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";

interface VerifyOTPProps {
  savedFormData: any;
  onBack: () => void;
  userType?: "shop_owner" | "customer";
}

export default function VerifyOTP({
  savedFormData,
  onBack,
  userType = "shop_owner",
}: VerifyOTPProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState<{ text: string; type: string } | null>(
    null,
  );
  const [resendCooldown, setResendCooldown] = useState(120);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!otpCode || otpCode.length !== 8) {
      setMessage({
        text: "Please enter the 8-digit verification code",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...savedFormData,
          code: otpCode,
          userType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (userType === "shop_owner") {
          router.push("/shopType");
        } else {
          const redirectTo = data.redirect || "/";
          router.push(
            `/auth/login?verified=true&redirect=${encodeURIComponent(redirectTo)}`,
          );
        }
      } else {
        setMessage({
          text: data.error || "Invalid verification code",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Verification failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      setMessage({
        text: `Please wait ${formatTime(resendCooldown)} before requesting another code`,
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: savedFormData?.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCooldown(120);
        setMessage({ text: "✓ New verification code sent!", type: "success" });
      } else {
        setMessage({
          text: data.error || "Failed to resend code",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Failed to resend code", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primaryText mb-2">
          Verify Your Email
        </h1>
        <p className="text-white mt-4">
          We've sent an 8-digit verification code to:
        </p>
        <p className="text-three font-medium mt-1 text-lg">
          {savedFormData?.email}
        </p>
        <p className="text-white text-sm mt-2">
          Check your inbox and spam folder for the code.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === "error"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-green-500/20 text-green-400 border border-green-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Verification Code *
          </label>
          <Input
            type="text"
            placeholder="Enter 8-digit code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            maxLength={8}
            className="w-full text-center text-2xl tracking-widest"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-400">
              Enter the 8-digit code sent to your email
            </p>
            {resendCooldown > 0 ? (
              <p className="text-sm text-yellow-500 font-medium">
                Resend available in: {formatTime(resendCooldown)}
              </p>
            ) : (
              <p className="text-sm text-green-500 font-medium">
                Ready to resend
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            type="button"
            disabled={loading}
            variant="secondary"
            className="w-full"
            onClick={handleVerify}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>

          <Button
            type="button"
            disabled={loading || resendCooldown > 0}
            className="w-full"
            onClick={handleResend}
          >
            Resend Code
          </Button>

          <Button
            type="button"
            disabled={loading}
            className="w-full"
            onClick={onBack}
          >
            Back to Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}
