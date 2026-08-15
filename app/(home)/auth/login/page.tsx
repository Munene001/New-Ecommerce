"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useAuth } from "@/context/authcontext";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import GoogleSignIn from "@/app/components/auth/googleSigIn";
import {
  storeRedirect,
  getAndClearRedirect,
} from "@/lib/redirect/helper";

function LoginFormContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false,
  });
  const [verifiedMessage, setVerifiedMessage] = useState("");

  const { setUserProfile, isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    const verified = searchParams.get("verified");

    if (verified === "true") {
      setVerifiedMessage("Email verified! Please log in.");
    }

    if (redirect) {
      storeRedirect(redirect);
    }
  }, [searchParams]);

  const handleRedirect = (role: string, shopSlug?: string) => {
    const storedRedirect = getAndClearRedirect();
    const redirectParam = searchParams.get("redirect");
    const targetRedirect = storedRedirect || redirectParam;
    const normalizedRole = role?.toLowerCase()?.trim();

    // Shop Owner
    if (normalizedRole === "shop_owner") {
      if (targetRedirect && targetRedirect.includes("/profile")) {
        return router.replace(shopSlug ? `/dashboard/${shopSlug}` : "/shopType");
      }
      if (targetRedirect && targetRedirect.startsWith("/dashboard")) {
        return router.replace(targetRedirect);
      }
      return router.replace(shopSlug ? `/dashboard/${shopSlug}` : "/shopType");
    }

    // Customer
    if (normalizedRole === "customer") {
      const paymentRedirect = sessionStorage.getItem('payment_page_after_signin');
      if (paymentRedirect) {
        sessionStorage.removeItem('payment_page_after_signin');
        return router.replace(paymentRedirect);
      }
      if (targetRedirect) {
        return router.replace(targetRedirect);
      }
      const currentShopSlug = sessionStorage.getItem("currentShopSlug");
      return router.replace(currentShopSlug ? `/${currentShopSlug}` : "/profile");
    }

    // Super Admin
    if (normalizedRole === "super_admin") {
      return router.replace(targetRedirect || "/view");
    }

    // Affiliate - now respects targetRedirect
    if (normalizedRole === "affiliate") {
      if (targetRedirect) {
        return router.replace(targetRedirect);
      }
      return router.replace("/affiliate/tenants");
    }

    // Smart fallback
    if (shopSlug) {
      return router.replace(`/dashboard/${shopSlug}`);
    }

    return router.replace("/");
  };

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (loading) return;

    const currentPath = window.location.pathname;
    if (!currentPath.includes("/auth/login")) return;

    if (isAuthenticated && profile) {
      handleRedirect(profile.role, profile.shopSlug);
    }
  }, [isAuthenticated, profile, router, loading, searchParams]);

  if (!loading && isAuthenticated && profile) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifiedMessage("");
    setFieldErrors({ email: false, password: false });

    if (!email || !password) {
      setFieldErrors({
        email: !email,
        password: !password,
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw new Error(signInError.message);
      if (!data.user) throw new Error("Login failed");

      const userInfoResponse = await fetch("/api/auth/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const userInfo = await userInfoResponse.json();

      if (!userInfo.success) {
        throw new Error(userInfo.error || "Failed to get user information");
      }

      const profileData = {
        fullName: userInfo.fullName || data.user.email?.split("@")[0] || "User",
        role: userInfo.role,
        onboardingComplete: userInfo.onboardingComplete,
        shopSlug: userInfo.shopSlug,
      };

      setUserProfile(profileData);
      handleRedirect(profileData.role, profileData.shopSlug);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(errorMessage);
      setFieldErrors({ email: true, password: true });
    } finally {
      setIsLoading(false);
    }
  };

  const context = searchParams.get("context");
  const redirectParam = searchParams.get("redirect");

  const signupHref =
    context === "customer"
      ? `/auth/customer/signup${
          redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""
        }`
      : "/auth/shopowner/signup";

  const signupText =
    context === "customer" ? "Sign up as customer" : "Sign up here";

  return (
    <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
      <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md md:mt-0 mt-[80px]">
        <h1 className="mb-2 md:mb-1 text-left font-[Poppins] text-[48px] font-bold leading-[60px] text-white">
          Login
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {verifiedMessage && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            {verifiedMessage}
          </div>
        )}

        <p className="mb-7 md:mb-5 text-left text-sm text-white/90">
          Enter your details
        </p>

        <GoogleSignIn
          fullWidth={true}
          onError={(error) => setError(error)}
          redirectUrl={redirectParam || undefined}
        />

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-5 mt-7">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email *"
            required
            className="w-full"
            hasError={fieldErrors.email}
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password *"
            required
            className="w-full"
            hasError={fieldErrors.password}
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full bg-yellow hover:bg-[#d1901e] font-semibold"
            loading={isLoading}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-5 space-y-8 text-center">
          <div className="flex md:flex-row flex-col gap-4 md:gap-0 justify-between">
            <p className="text-sm md:text-xs text-white">
              Don&apos;t have an account?{" "}
              <Link href={signupHref} className="hover:underline text-three">
                {signupText}
              </Link>
            </p>

            <p className="text-sm md:text-xs text-white">
              <Link
                href="/auth/resetpassword"
                className="text-three hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
          <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md md:mt-0 mt-[80px]">
            <div className="text-center text-white">Loading...</div>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}