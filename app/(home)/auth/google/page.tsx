"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type UserType = 'shop_owner' | 'customer' | 'admin';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [user, setUser] = useState<any>(null);
  const [needsBusinessName, setNeedsBusinessName] = useState(false);
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.user) {
          router.push("/auth/login");
          return;
        }

        let userType = sessionStorage.getItem("oauth_user_type") as UserType | null;
        if (!userType || (userType !== 'shop_owner' && userType !== 'customer')) {
          userType = 'shop_owner';
        }
        sessionStorage.removeItem("oauth_user_type");

        const response = await fetch("/api/auth/user-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const userInfo = await response.json();

        if (userInfo.success) {
          const role = userInfo.role;
          const storedRedirect = sessionStorage.getItem("oauthRedirectUrl");
          sessionStorage.removeItem("oauthRedirectUrl");

          if (storedRedirect) {
            router.push(storedRedirect);
            return;
          }

          if (role === 'shop_owner') {
            router.push(userInfo.shopSlug ? `/dashboard/${userInfo.shopSlug}` : "/shopType");
          } else if (role === 'customer') {
            const currentShopSlug = sessionStorage.getItem("currentShopSlug");
            router.push(currentShopSlug ? `/${currentShopSlug}` : "/");
          } else if (role === 'super_admin') {
            router.push("/view");
          } else {
            router.push("/");
          }
          return;
        }

        if (userType === 'shop_owner') {
          setUser(session.user);
          setNeedsBusinessName(true);
        } else if (userType === 'customer') {
          setUser(session.user);
          setNeedsPhoneNumber(true);
        } else {
          await createAccount(session.user, userType);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Authentication failed. Please try again.");
      }
    };

    handleCallback();
  }, [router]);

  const createAccount = async (user: any, type: UserType, extraData?: { business_name?: string; phone?: string }) => {
    try {
      const payload: any = {
        email: user.email,
        userType: type,
      };
      if (type === 'shop_owner' && extraData?.business_name) {
        payload.business_name = extraData.business_name;
      }
      if (type === 'customer' && extraData?.phone) {
        payload.phone = extraData.phone;
      }

      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const storedRedirect = sessionStorage.getItem("oauthRedirectUrl");
        sessionStorage.removeItem("oauthRedirectUrl");

        if (storedRedirect) {
          router.push(storedRedirect);
          return;
        }

        if (type === 'shop_owner') {
          router.push("/shopType");
        } else {
          const currentShopSlug = sessionStorage.getItem("currentShopSlug");
          router.push(currentShopSlug ? `/${currentShopSlug}` : "/");
        }
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      console.error("Account creation error:", err);
      setError("Failed to create account. Please try again.");
    }
  };

  const handleBusinessSubmit = () => {
    if (!businessName.trim()) return;
    createAccount(user, 'shop_owner', { business_name: businessName });
  };

  const handlePhoneSubmit = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 9) {
      setError("Please enter a valid phone number (at least 9 digits)");
      return;
    }
    createAccount(user, 'customer', { phone: phoneNumber });
  };

  if (error) {
    return (
      <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
        <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <Button
              onClick={() => router.push("/auth/login")}
              variant="secondary"
              className="bg-yellow hover:bg-[#d1901e] font-semibold"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (needsBusinessName) {
    return (
      <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
        <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome!</h2>
          <p className="text-white/90 mb-6">One more detail to set up your shop</p>

          <Input
            label="Business Name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business name"
            className="w-full"
            required
            autoFocus
          />

          <Button
            onClick={handleBusinessSubmit}
            disabled={!businessName.trim()}
            variant="secondary"
            className="w-full mt-6 bg-yellow hover:bg-[#d1901e] font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (needsPhoneNumber) {
    return (
      <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
        <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome!</h2>
          <p className="text-white/90 mb-6">We need your phone number for order updates.</p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white">Phone Number *</label>
            <PhoneInput
              international
              defaultCountry="KE"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || "+254")}
              placeholder="+254XXXXXXXXX"
              className="bg-transparent"
            />
            {phoneNumber.length < 9 && (
              <p className="mt-1 text-sm text-red-400">Please enter a valid phone number (at least 9 digits)</p>
            )}
          </div>

          <Button
            onClick={handlePhoneSubmit}
            disabled={phoneNumber.length < 9}
            variant="secondary"
            className="w-full bg-yellow hover:bg-[#d1901e] font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
      <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md text-center">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}