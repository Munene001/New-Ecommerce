"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

type UserProfile = {
  fullName: string;
  role: string;
  onboardingComplete: boolean;
  shopSlug?: string;
  phone?: string;
};

type AuthContextType = {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUserProfile: (profile: UserProfile) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Module-scoped so the instance is stable across renders.
const supabase = createSupabaseBrowserClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingProfile = useRef(false);

  // Server route reads the session cookie, so userId isn't sent.
  const fetchUserProfile = async (_userId: string) => {
    if (fetchingProfile.current) return;

    fetchingProfile.current = true;
    try {
      const response = await fetch("/api/auth/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Session expired.
      if (response.status === 401) {
        setUser(null);
        setProfile(null);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setProfile({
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
          onboardingComplete: data.onboardingComplete,
          shopSlug: data.shopSlug,
        });
      } else {
        console.error("Failed to fetch profile:", data.error);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      fetchingProfile.current = false;
    }
  };

  useEffect(() => {
    // Boot: verify token with Supabase, then load profile.
    const initAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setUser(null);
        setProfile(null);
      } else {
        setUser(user);
        await fetchUserProfile(user.id);
      }

      setLoading(false);
    };

    initAuth();

    // Ongoing: sync user on sign-in, sign-out, token refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Already handled by initAuth.
      if (event === "INITIAL_SESSION") return;

      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    isAuthenticated: !!user,
    loading,
    setUserProfile: setProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}