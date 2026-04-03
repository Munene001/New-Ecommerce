"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import SimpleToast from "@/app/components/ui/simpleToast";

export type ToastType = 'success' | 'error';

interface ToastMessage {
  type: ToastType;
  text: string;
}

interface ToastContextType {
  showToast: (text: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [mounted, setMounted] = useState(false);

  // For portal - this is a valid use case for setState in useEffect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => {
       
      setMounted(false);
    };
  }, []);

  const showToast = useCallback((text: string, type: ToastType = 'success') => {
    setToast({ type, text });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {mounted && createPortal(
        <SimpleToast message={toast} onClose={hideToast} />,
        document.body
      )}
    </ToastContext.Provider>
  );
};