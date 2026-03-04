"use client"
import BaseLeftMenu from "@/app/components/layout/leftNav";
import DashHeader from "@/app/components/layout/dashHeader";
import { useParams } from "next/navigation";
import { ShopProvider } from "../../shopownerContext";
import * as React from 'react'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname } from "next/navigation";



export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
const getPageTitle = (path: string) => {
  if (path.includes('/products')) return 'Products';
  if (path.includes('/payments')) return 'Payments';
  if (path.includes('/sales')) return 'Sales & Analytics';
  if (path.includes('/appearance')) return 'Appearance';
  if (path.includes('/settings')) return 'Settings';
  return 'Dashboard';
};

const pageTitle = getPageTitle(pathname);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); 
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside or on navigation
  const handleMenuClick = (bool: boolean) => {
    console.log("Menu clicked:", bool);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [params]);

  return (
    <ShopProvider shopSlug={shopSlug}>
      <div className="min-h-screen">
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
          {/* Mobile menu overlay */}
          {isMobile && isMobileMenuOpen && (
            <div 
              className="fixed inset-0   bg-opacity-50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          
          {/* Sidebar - conditionally visible on mobile */}
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
              shopSlug={shopSlug || ""}
            />
          </aside>
          
          <main className={`
            flex-1 md:p-6 px-1 bg-gray-50 overflow-y-auto
            ${isMobile ? 'w-full' : ''}
          `}>
            {children}
          </main>
        </div>
      </div>
    </ShopProvider>
  );
}