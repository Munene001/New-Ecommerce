// app/components/layout/header.tsx
"use client";

import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";
import Button from "../ui/button";
import Link from "next/link";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="h-[85px] bg-black flex items-center justify-between px-6">
      {/* Logo/Left side */}
      <div className="text-white font-bold text-xl">
        <Link href="/">Your Logo</Link>
      </div>

      {/* Right side - Auth buttons */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span className="text-white mr-4">Welcome, {user?.name}</span>
            <Button
              onClick={handleLogout}
              variant="primary"
              
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            onClick={handleLogin}
            variant="primary"
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
}