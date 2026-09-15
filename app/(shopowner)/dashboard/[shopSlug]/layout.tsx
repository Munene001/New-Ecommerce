"use client";
import BaseLeftMenu from "@/app/components/layout/leftNav";
import DashHeader from "@/app/components/layout/dashHeader";
import { useParams } from "next/navigation";
import { ShopProvider, useShop } from "../../shopownerContext";
import { ToastProvider } from "@/context/toastContext";
import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from "next/navigation";
import { useDashboardOrders } from "./orders/hooks/useDashboardOrders";
import Wizard from "@/app/components/layout/wizard";
import DashboardSkeleton from "@/app/components/layout/skeletonDash";
import { CartProvider } from "@/context/shopCartContext";

// Component that uses useDashboardOrders (only rendered when shopId is ready)
function DashboardContentWithOrders({ children, shopId, shopSlug, isMobile, isMobileMenuOpen, setIsMobileMenuOpen, pageTitle, isPOSPage }: any) {
  const { unviewedCount } = useDashboardOrders(shopId.toString());
  
  // ✅ If POS page - render WITHOUT left menu (full width)
  if (isPOSPage) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 h-[85px] bg-white z-50 shadow-sm">
          <DashHeader 
            shopSlug={shopSlug || ""} 
            isMobile={isMobile}
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title={pageTitle}
          />
        </header>
        
        <div className="pt-[85px] min-h-screen relative">
          {/* ✅ NO LEFT MENU - full width */}
          <main className="w-full bg-gray-50 min-h-[calc(100vh-85px)]">
            {children}
          </main>
        </div>
      </>
    );
  }

  // ✅ Regular dashboard layout (with left menu)
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-[85px] bg-white z-50 shadow-sm">
        <DashHeader 
          shopSlug={shopSlug || ""} 
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title={pageTitle}
        />
      </header>
      
      <div className="pt-[85px] flex min-h-screen relative">
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <aside className={`${isMobile ? `fixed left-0 top-[85px] bottom-0 w-[85%] z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}` : 'sticky top-16 w-64'} h-[calc(100vh-85px)] md:h-[100vh] bg-[url('/assets/mazehex4.svg')] bg-black text-white overflow-y-auto md:sticky`}>
          <BaseLeftMenu 
            onMenuClicked={() => isMobile && setIsMobileMenuOpen(false)}  
            shopSlug={shopSlug || ""}
            unviewedCount={unviewedCount} 
          />
        </aside>
        
        <main className={`flex-1 md:p-6 px-1 bg-gray-50 overflow-y-auto ${isMobile ? 'w-full' : ''}`}>
          {shopId && <Wizard shopSlug={shopSlug} shopId={shopId} onComplete={() => {}} />}
          {children}
        </main>
      </div>
    </>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;
  const shopData = useShop();
  const shopId = shopData?.shopId;
  const pathname = usePathname();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const previousParamsRef = useRef(params);

  // ✅ Check if current page is POS
  const isPOSPage = pathname?.includes('/pos');

  const getPageTitle = (path: string) => {
    if (path.includes('/products')) return 'Products';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/sales')) return 'Sales & Analytics';
    if (path.includes('/appearance')) return 'Appearance';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/pos')) return 'Point of Sale'; // ✅ Add POS title
    return 'Dashboard';
  };
  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (previousParamsRef.current !== params) {
      setIsMobileMenuOpen(false);
      previousParamsRef.current = params;
    }
  }, [params]);

  // Guard: if shopId is not ready yet, show skeleton
  if (!shopId) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardContentWithOrders 
      shopId={shopId} 
      shopSlug={shopSlug} 
      isMobile={isMobile}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      pageTitle={pageTitle}
      isPOSPage={isPOSPage} // ✅ Pass the flag
    >
      {children}
    </DashboardContentWithOrders>
  );
}

// Main layout component
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;

  return (
    <ShopProvider shopSlug={shopSlug}>
      <ToastProvider>
        <CartProvider>
          <div className="min-h-screen">
            <DashboardContent>{children}</DashboardContent>
          </div>
        </CartProvider>
      </ToastProvider>
    </ShopProvider>
  );
}