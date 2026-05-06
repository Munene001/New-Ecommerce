// app/components/layout/header.tsx
"use client";

import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";
import Button from "../ui/button";
import Link from "next/link";
import Image from "next/image";

export default function HomeHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="h-[85px]  bg-black flex items-center justify-between px-6">
      {/* Logo/Left side */}

  <Link href="/" className="inline-block rounded-lg leading-none">
  <Image
    src="/logo.png"
    alt="Logo"
    width={80}
    height={40}
    className="object-cover block"
  />
</Link>

      {/* Right side - Auth buttons */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </>
        ) : (
          <Button onClick={handleLogin} variant="secondary">
            Login
          </Button>
        )}
      </div>
    </div>
  );
}
