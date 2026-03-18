"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";

interface SimpleToastProps {
  message: { type: 'success' | 'error'; text: string } | null;
  onClose: () => void;
  duration?: number;
}

export default function SimpleToast({ message, onClose, duration = 5000 }: SimpleToastProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (message) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onClose, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="fixed lg:bottom-6 bottom-[20vh] left-1/2 transform -translate-x-1/2 md:w-auto w-[80vw] z-50 animate-slideUp">
      <div
        className={`flex items-center justify-between gap-4 px-6 md:py-3 py-2 md:rounded-full rounded-lg shadow-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon 
            icon={message.type === 'success' ? "mdi:check-circle" : "mdi:alert-circle"} 
            className={`md:w-5 hmd:h-5 h-9 w-9 ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`} 
          />
          <span className="md:text-sm text-[16px] font-medium">{message.text}</span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-full hover:bg-black/5 transition-colors ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <Icon icon="mdi:close" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}