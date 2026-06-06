// context/affiliateContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/authcontext';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from '@/app/components/layout/skeletonDash';

interface AffiliateContextType {
  isAffiliate: boolean;
  affiliateId: number | null;
  refCode: string | null;
  conversionCount: number;
  affiliateLogout: () => void;
}

const AffiliateContext = createContext<AffiliateContextType | null>(null);

export function AffiliateProvider({ children }: { children: React.ReactNode }) {
  const { profile, isAuthenticated, loading, logout } = useAuth(); // from your AuthProvider
  const router = useRouter();
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateId, setAffiliateId] = useState<number | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [conversionCount, setConversionCount] = useState(0);
  const [fetching, setFetching] = useState(true);

  const affiliateLogout = () => {
    logout(); // call the logout from AuthProvider
    router.push('/');
  };

  useEffect(() => {
    if (loading) return; // wait until AuthProvider knows if user is logged in

    // Not logged in – redirect to login with return URL
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/affiliate/tenant');
      return;
    }

    // Logged in but not an affiliate – redirect to home
    if (profile?.role !== 'affiliate') {
      router.push('/');
      return;
    }

    // Fetch affiliate-specific data from API
    const fetchAffiliateData = async () => {
      try {
        const res = await fetch('/api/affiliate/me');
        const data = await res.json();
        if (data.success) {
          setAffiliateId(data.affiliate_id);
          setRefCode(data.ref_code);
          setConversionCount(data.conversion_count);
          setIsAffiliate(true);
        } else {
          // User has role 'affiliate' but no affiliate record – redirect
          router.push('/');
        }
      } catch (err) {
        console.error(err);
        router.push('/');
      } finally {
        setFetching(false);
      }
    };

    fetchAffiliateData();
  }, [isAuthenticated, profile, loading, router]);

  // Show skeleton while loading auth or fetching affiliate data
  if (loading || fetching) {
    return <DashboardSkeleton />;
  }

  // If not affiliate, return null (will redirect because the useEffect already pushed)
  if (!isAffiliate) {
    return null;
  }

  return (
    <AffiliateContext.Provider value={{ isAffiliate, affiliateId, refCode, conversionCount, affiliateLogout }}>
      {children}
    </AffiliateContext.Provider>
  );
}

export function useAffiliate() {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error("useAffiliate must be used within AffiliateProvider");
  }
  return context;
}