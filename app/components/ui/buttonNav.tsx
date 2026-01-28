import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@iconify/react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "plot" | "capture" | "screenshot" | "route" | "location" | "clear" | "neutral";
  loading?: boolean;
  hasValue?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: string;
}

export default function ButtonNav({
  children,
  variant = "neutral",
  loading = false,
  hasValue = false,
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: "h-[40px] px-3 text-sm",
    md: "h-[50px] px-4 text-base", 
    lg: "h-[60px] px-6 text-lg"
  };

  const baseClasses = "font-medium transition-colors focus:outline-none py-2 rounded-[8px] flex items-center justify-center gap-2";

  // Purpose-specific variant classes for mapping app
  const getVariantClasses = () => {
    switch (variant) {
      case "plot":
        return "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 border border-blue-700";
      
      case "capture":
        return "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 border border-green-700";
      
      case "screenshot":
        return "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400 border border-purple-700";
      
      case "route":
        return "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-400 border border-orange-700";
      
      case "location":
        return "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 border border-indigo-700";
      
      case "clear":
        return "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 border border-red-700";
      
      case "neutral":
        if (hasValue) {
          return "bg-[#EAA022] text-white hover:bg-[#d1901e] disabled:bg-amber-300 border border-amber-500";
        } else {
          return "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 border border-gray-700";
        }
      
      default:
        return "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400";
    }
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${getVariantClasses()} ${className}`;

  return (
    <button
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <Icon
            icon="mdi:loading"
            className="animate-spin h-4 w-4 text-white"
          />
          Loading...
        </span>
      ) : (
        <>
          {icon && <Icon icon={icon} className="h-4 w-4" />}
          {children}
        </>
      )}
    </button>
  );
}