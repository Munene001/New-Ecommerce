"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();
  const fetchingProfile = useRef(false); // Prevent multiple simultaneous fetches

  // Fetch user profile from your database
  const fetchUserProfile = async (userId: string) => {
    // Prevent multiple simultaneous fetches
    if (fetchingProfile.current) {
      ('⏳ Profile fetch already in progress, skipping...');
      return;
    }

    fetchingProfile.current = true;
    try {
     
      const response = await fetch("/api/auth/user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Handle 401 gracefully - session expired
      if (response.status === 401) {
        ('🔑 Session expired, clearing user');
        setUser(null);
        setProfile(null);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
      
        setProfile({
          fullName: data.fullName,
          phone:data.phone,
          role: data.role,
          onboardingComplete: data.onboardingComplete,
          shopSlug: data.shopSlug,
        });
      } else {
        console.error('Failed to fetch profile:', data.error);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      fetchingProfile.current = false;
    }
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      ('🔐 Getting initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        
        setUser(session.user);
        // Fetch profile after setting user
        await fetchUserProfile(session.user.id);
      } else {
        ('❌ No session found');
        setUser(null);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile when user logs in
          await fetchUserProfile(session.user.id);
        } else {
          // Clear profile when user logs out
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange will clear user and profile automatically
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}