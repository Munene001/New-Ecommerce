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
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ email: false, password: false });

    if (!email || !password) {
      setFieldErrors({
        email: !email,
        password: !password
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) throw new Error("Supabase not configured");

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw new Error(signInError.message);
      if (!data.user || !data.session) throw new Error("Login failed");

      login(
        {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
          email: data.user.email!,
        },
        data.session.access_token
      );

      router.push("/films");

    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      setFieldErrors({ email: true, password: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex md:min-h-screen font-[poppins] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
      <div className="w-full max-w-md p-8 diagonal-gradient-border bg-[#122e32] shadow-md md:mt-0 mt-[80px]">
        <h1 className="mb-2 md:mb-1 text-left font-[caveat] text-[48px] font-bold leading-[60px] text-white">
          Login
        </h1>
        
        {error && <div className="text-sm text-red-500 mb-3">{error}</div>}
        
        <p className="mb-7 md:mb-5 text-left text-xs text-[#A0AEC0]">
          Enter your details
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email *"
            required
            className="w-full"
            hasError={fieldErrors.email}
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
          />

          <Button
            type="submit"
            className="w-full bg-yellow hover:bg-[#d1901e] font-semibold"
            loading={isLoading}
            disabled={isLoading}
            variant="secondary"
          >
            Login
          </Button>
        </form>

        <div className="mt-5 space-y-8 text-center">
          <div className="flex flex-row justify-between">
            <p className="text-sm md:text-xs text-white">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-tunga-yellow hover:underline">
                Sign up here
              </Link>
            </p>
            
            <p className="text-sm md:text-xs">
              <Link
                href="/resetpassword"
                className="text-tunga-yellow hover:underline"
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