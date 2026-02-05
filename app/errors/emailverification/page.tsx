"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/app/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmailVerificationErrorPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  // Close modal and redirect to signup
  const handleClose = () => {
    setIsVisible(false);
    router.push("/signup");
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Don't render anything if modal is closed (page will redirect)
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 font-[Poppins] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Verification Failed</h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-700/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        
        <p className="mb-6 text-white">
          Email verification failed or the link has expired. Please try signing up again.
        </p>
        
        <div className="flex justify-end gap-3">
         
          <Button variant="secondary">
            <Link href="/signup">Sign up Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}