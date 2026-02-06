// app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false,
  });

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
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
      if (!supabase) throw new Error("Supabase not configured");

      // 1. Supabase login
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw new Error(signInError.message);
      if (!data.user || !data.session) throw new Error("Login failed");

      // 2. Get user role and onboarding status from MySQL
      const userInfoResponse = await fetch("/api/auth/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabase_uid: data.user.id }),
      });

      const userInfo = await userInfoResponse.json();

      if (!userInfo.success) {
        throw new Error(userInfo.error || "Failed to get user information");
      }

      // 3. Update auth context with user info
      login(
        {
          id: data.user.id,
          name: userInfo.fullName || data.user.email?.split("@")[0] || "User",
          email: data.user.email!,
          role: userInfo.role,
          onboardingComplete: userInfo.onboardingComplete,
        },
        data.session.access_token
      );

      // 4. Redirect based on role and onboarding status
      if (userInfo.role === "shop_owner") {
        if (userInfo.onboardingComplete && userInfo.shopSlug) {
          router.push(`/dashboard/${userInfo.shopSlug}`);
        } else {
          router.push("/shopType");
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      setFieldErrors({ email: true, password: true });
    } finally {
      setIsLoading(false);
    }
  };

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

        <p className="mb-7 md:mb-5 text-left text-sm text-white/90">
          Enter your details
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-5">
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
              <Link
                href="/auth/shopowner/signup"
                className="hover:underline text-three"
              >
                Sign up here
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
