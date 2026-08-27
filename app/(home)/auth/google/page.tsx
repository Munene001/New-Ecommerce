"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type UserType = 'shop_owner' | 'customer' | 'admin';

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasRun = useRef(false);
  const executionCount = useRef(0);

  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [user, setUser] = useState<any>(null);
  const [needsBusinessName, setNeedsBusinessName] = useState(false);
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    executionCount.current += 1;
    console.log(`\n========================================`);
    console.log(`🔄 [OAUTH DIAGNOSTIC] useEffect triggered (Run #${executionCount.current})`);
    console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);

    if (hasRun.current) {
      console.warn(`🛑 [OAUTH DIAGNOSTIC] Guard activated! Blocked duplicate execution #${executionCount.current}.`);
      console.log(`========================================\n`);
      return;
    }
    hasRun.current = true;
    console.log(`🔒 [OAUTH DIAGNOSTIC] Execution locked. Proceeding with callback logic...`);

    const handleCallback = async () => {
      try {
        console.log(`📡 [1/5] Initializing Supabase browser client...`);
        const supabase = createSupabaseBrowserClient();

        console.log(`🔑 [2/5] Fetching Supabase session...`);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(`❌ [OAUTH DIAGNOSTIC] Session error:`, sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.warn(`⚠️ [OAUTH DIAGNOSTIC] No active session found. Redirecting to /auth/login`);
          router.push("/auth/login");
          return;
        }

        console.log(`✅ [OAUTH DIAGNOSTIC] Session found for user ID: ${session.user.id}`);
        console.log(`📧 User Email: ${session.user.email}`);

        const userEmail = session.user.email || '';
        const cleanUser = {
          id: session.user.id,
          email: userEmail,
          aud: session.user.aud || 'authenticated',
          role: session.user.role || 'authenticated',
          user_metadata: {
            full_name: session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url || '',
          },
        };

        let userType = sessionStorage.getItem("oauth_user_type") as UserType | null;
        console.log(`🏷️ [3/5] Read oauth_user_type from sessionStorage: "${userType}"`);

        if (!userType || (userType !== 'shop_owner' && userType !== 'customer')) {
          userType = 'shop_owner';
          console.log(`ℹ️ [OAUTH DIAGNOSTIC] Fallback userType set to: "shop_owner"`);
        }
        sessionStorage.removeItem("oauth_user_type");

        console.log(`🌐 [4/5] Calling backend API: POST /api/auth/user-info...`);
        const startTime = Date.now();
        const response = await fetch("/api/auth/user-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const duration = Date.now() - startTime;

        console.log(`📥 [OAUTH DIAGNOSTIC] /api/auth/user-info responded in ${duration}ms with status ${response.status}`);

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const userInfo = await response.json();
        console.log(`📊 [OAUTH DIAGNOSTIC] User Info payload:`, userInfo);

        if (userInfo.success) {
          const role = userInfo.role;
          const storedRedirect = sessionStorage.getItem("oauthRedirectUrl");
          sessionStorage.removeItem("oauthRedirectUrl");

          console.log(`🚀 [5/5] Existing user found. Determining target route...`);
          console.log(`   - DB Role: ${role}`);
          console.log(`   - Stored Redirect: ${storedRedirect || 'None'}`);

          let targetPath = "/";
          if (storedRedirect) {
            targetPath = storedRedirect;
          } else if (role === 'shop_owner') {
            targetPath = userInfo.shopSlug ? `/dashboard/${userInfo.shopSlug}` : "/shopType";
          } else if (role === 'customer') {
            const currentShopSlug = sessionStorage.getItem("currentShopSlug");
            targetPath = currentShopSlug ? `/${currentShopSlug}` : "/";
          } else if (role === 'super_admin') {
            targetPath = "/view";
          }

          console.log(`➡️ [OAUTH DIAGNOSTIC] Executing router.push("${targetPath}")`);
          console.log(`========================================\n`);
          router.push(targetPath);
          return;
        }

        console.log(`🆕 [5/5] New user setup required for type: "${userType}"`);
        if (userType === 'shop_owner') {
          console.log(`📋 Prompting for Business Name...`);
          setUser(cleanUser);
          setNeedsBusinessName(true);
        } else if (userType === 'customer') {
          console.log(`📞 Prompting for Phone Number...`);
          setUser(cleanUser);
          setNeedsPhoneNumber(true);
        } else {
          console.log(`⚡ Creating account automatically...`);
          await createAccount(cleanUser, userType);
        }
        console.log(`========================================\n`);

      } catch (err) {
        console.error(`💥 [OAUTH DIAGNOSTIC] Fatal error in handleCallback:`, err);
        setError("Authentication failed. Please try again.");
        console.log(`========================================\n`);
      }
    };

    handleCallback();
  }, [router]);

  const createAccount = async (user: any, type: UserType, extraData?: { business_name?: string; phone?: string }) => {
    try {
      console.log(`📝 [OAUTH DIAGNOSTIC] Creating account via /api/auth/callback...`);
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

      console.log(`📤 Sending payload:`, payload);
      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(`📥 /api/auth/callback response:`, data);

      if (data.success) {
        const storedRedirect = sessionStorage.getItem("oauthRedirectUrl");
        sessionStorage.removeItem("oauthRedirectUrl");

        let targetPath = "/";
        if (storedRedirect) {
          targetPath = storedRedirect;
        } else if (type === 'shop_owner') {
          targetPath = "/shopType";
        } else {
          const currentShopSlug = sessionStorage.getItem("currentShopSlug");
          targetPath = currentShopSlug ? `/${currentShopSlug}` : "/";
        }

        console.log(`➡️ [OAUTH DIAGNOSTIC] Account created. Redirecting to "${targetPath}"`);
        router.push(targetPath);
      } else {
        console.error(`❌ [OAUTH DIAGNOSTIC] Account creation failed:`, data.error);
        setError(data.error || "Failed to create account");
      }
    } catch (err) {
      console.error("Account creation exception:", err);
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
          <p className="text-xs text-gray-200 mt-1">You can change this later in settings</p>

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