// app/affiliate/layout.tsx
"use client";

import { AffiliateProvider, useAffiliate } from "./affiliateContext";
import { ToastProvider } from "@/context/toastContext";
import BaseLeftMenu from "@/app/components/layout/leftNav";
import DashHeader from "@/app/components/layout/dashHeader";
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, Users, Link2, Settings, LogOut } from "lucide-react";


const affiliateNavItems = [

  {
    href: "/affiliate/tenants",
    title: "My Tenants",
    icon: Users
  },
  {
    href: "/affiliate/shops",
    title: "My Shops",
    icon: Store
  },
 
];

function AffiliateContent({ children }: { children: React.ReactNode }) {
  const { affiliateLogout } = useAffiliate();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const previousPathnameRef = useRef("");
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path.includes('/tenants')) return 'My Tenants';
    if (path.includes('/shops')) return 'My Shops';
    if (path.includes('/referral')) return 'Referral Link';
    if (path.includes('/settings')) return 'Settings';
    return 'Affiliate Dashboard';
  };

  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      setIsMobileMenuOpen(false);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  const handleMenuClick = () => {
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    affiliateLogout();
    router.push("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-[85px] bg-white z-50 shadow-sm">
        <DashHeader 
          shopSlug={undefined} 
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title={pageTitle}
        />
      </header>

      <div className="pt-[85px] flex min-h-screen relative">
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside 
          className={`
            ${isMobile 
              ? `fixed left-0 top-[85px] bottom-0 w-[85%] z-50 transform transition-transform duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'sticky top-16 w-64'
            } 
            h-[calc(100vh-85px)] md:h-[100vh] 
            bg-[url('/assets/mazehex4.svg')] 
            bg-black 
            text-white 
            overflow-y-auto
            md:sticky
          `}
        >
          <BaseLeftMenu 
            onMenuClicked={handleMenuClick}  
            navItems={affiliateNavItems}
            unviewedCount={0}
          />
        </aside>

        <main className={`
          flex-1 md:p-6 px-1 bg-gray-50 overflow-y-auto
          ${isMobile ? 'w-full' : ''}
        `}>
          {children}
        </main>
      </div>
    </>
  );
}

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AffiliateProvider>
      <ToastProvider>
        <div className="min-h-screen">
          <AffiliateContent>{children}</AffiliateContent>
        </div>
      </ToastProvider>
    </AffiliateProvider>
  );
}