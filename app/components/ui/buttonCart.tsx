import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@iconify/react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export default function ButtonCart({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-medium h-[40px] w-fit transition-colors duration-300 focus:outline-none px-3 rounded-lg disabled:cursor-not-allowed ";
  
 
 
  const combinedClasses = `${baseClasses}  ${className}`;

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