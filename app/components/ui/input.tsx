import React, { InputHTMLAttributes, forwardRef, useState } from "react";
import { Icon } from "@iconify/react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hasError?: boolean;
  light?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hasError, light = false, className = "", id, type, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };
    
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
    
    const shouldShowError = hasError && !isFocused;
    const isPasswordField = type === "password";

    // Light variant styles
    if (light) {
      return (
        <div className="flex flex-col font-[Poppins] relative">
          {label && (
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
          )}
          <input
            id={inputId}
            ref={ref}
            type={isPasswordField && showPassword ? "text" : type}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`rounded-lg bg-white border border-gray-300 md:h-[50px] h-[60px] p-3 text-black text-sm placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30 ${
              shouldShowError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            } ${isPasswordField ? "pr-10" : ""} ${className}`}
            {...props}
          />
          
          {isPasswordField && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <Icon
                icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
                className="w-5 h-5"
              />
            </button>
          )}
          
          {shouldShowError && error && <span className="mt-1 text-sm text-red-500">{error}</span>}
        </div>
      );
    }

    // Default dark variant
    return (
      <div className="flex flex-col font-[Poppins] relative">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white mb-1">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type={isPasswordField && showPassword ? "text" : type}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`rounded-[10px] bg-[#23383E] border border-gray-400 md:h-[50px] h-[60px] placeholder:text-xs p-3 text-white text-sm placeholder-gray-300 focus:outline-none focus:border-magenta focus:ring-1 focus:ring-magenta ${
            shouldShowError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-400"
          } ${isPasswordField ? "pr-10" : ""} ${className}`}
          {...props}
        />
        
        {isPasswordField && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            <Icon
              icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
              className="w-5 h-5"
            />
          </button>
        )}
        
        {shouldShowError && error && <span className="mt-1 text-sm text-red-400">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;