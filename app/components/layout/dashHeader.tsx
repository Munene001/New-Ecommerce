"use client";

import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";
import Button from "../ui/button";
import { Menu, X, Store } from "lucide-react";
import Link from "next/link";

interface DashHeaderProps {
    shopSlug?: string;
    title?: string;
    isMobile?: boolean;
    isMobileMenuOpen?: boolean;
    onMobileMenuToggle?: () => void;
}

export default function DashHeader({ 
    shopSlug,
    title,
    isMobile = false, 
    isMobileMenuOpen = false, 
    onMobileMenuToggle 
}: DashHeaderProps) {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="h-[85px] bg-[url('/assets/mazehex4.svg')] bg-black flex items-center justify-between px-6">
      {/* Left side - Menu button on mobile + Dynamic Title */}
      <div className="flex items-center gap-3">
        {isMobile ? (
          <button
            onClick={onMobileMenuToggle}
            className="text-white hover:bg-white/10 p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        ) : null}
        
        {/* Dynamic Title - Shows on both mobile and desktop */}
        {title && (
          <h1 className="text-white md:ml-64 font-semibold text-xl md:text-2xl">
            {title}
          </h1>
        )}
      </div>

      {/* Right side - View Shop & Auth buttons */}
      <div className="flex items-center gap-4">
        {/* View Shop Button - Always visible when authenticated */}
        {isAuthenticated && shopSlug && (
          <Link href={`/${shopSlug}`}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Store size={18} />
              View Shop
            </Button>
          </Link>
        )}
        
      </div>
    </div>
  );
}