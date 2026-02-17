import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@iconify/react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-medium h-[50px] w-fit transition-colors duration-300 focus:outline-none px-3 rounded-lg disabled:cursor-not-allowed ";
  
  const getVariantClasses = () => {
    if (variant === "primary") {
      return "bg-magenta-dark text-white hover:bg-magenta ";
    } else {
      return "bg-three text-white hover:bg-orange-400 disabled:bg-gray-400";
    }
  };
 
  const combinedClasses = `${baseClasses} ${getVariantClasses()} ${className}`;

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
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}