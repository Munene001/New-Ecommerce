// app/components/layout/header.tsx
"use client";

import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, Home, Phone, HelpCircle } from "lucide-react";
import Button from "../ui/button";
import Link from "next/link";
import Image from "next/image";

export default function HomeHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setIsMenuOpen(false);
  };

  const handleLinkClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  const navItems = [
    { title: "Home", href: "/", icon: Home },
    { title: "Contact Us", href: "/contact", icon: Phone },
    { title: "Help", href: "/help", icon: HelpCircle },
  ];

  return (
    <>
      {/* ==================== DESKTOP HEADER ==================== */}
      <div className="hidden md:flex h-[85px] bg-black items-center justify-between px-6 relative z-50">
        {/* Logo */}
        <Link href="/" className="inline-block rounded-lg leading-none">
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={40}
            className="object-cover block"
          />
        </Link>

        {/* Desktop Navigation - with icons */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 text-white hover:text-white/80 transition-colors text-sm font-medium"
              >
                <Icon size={16} className="text-three" />
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          ) : (
            <Button onClick={handleLogin} variant="secondary">
              Login
            </Button>
          )}
        </div>
      </div>

      {/* ==================== MOBILE HEADER ==================== */}
      <div className="md:hidden flex h-[85px] bg-black items-center justify-between px-4 relative z-50">
        {/* Logo + Mobile Login */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Icon */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="inline-block rounded-lg leading-none">
            <Image
              src="/logo.png"
              alt="Logo"
              width={70}
              height={35}
              className="object-cover block"
            />
          </Link>
        </div>

        {/* Mobile Login Button */}
        {isAuthenticated ? (
          <Button onClick={handleLogout} variant="secondary">
            Logout
          </Button>
        ) : (
          <Button onClick={handleLogin} variant="secondary">
            Login
          </Button>
        )}
      </div>

      {/* ==================== MOBILE SLIDE MENU ==================== */}
      <div
        className={`fixed top-0 left-0 h-full w-[80vw] bg-black z-50 shadow-xl md:hidden transition-all duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Menu Header with X icon */}
        <div className="flex justify-between items-center p-6 border-b border-white/70">
          <div className="text-white text-xl font-semibold">PaziaTech</div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Navigation Items */}
        <nav className="space-y-2 px-6 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleLinkClick(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/50 rounded-lg transition-all duration-200 group"
              >
                <Icon
                  size={18}
                  className="text-three group-hover:scale-110 transition-transform"
                />
                <span className="text-[17px] font-medium text-white">
                  {item.title}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}