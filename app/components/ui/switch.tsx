"use client";

import { useState, useEffect } from "react";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  labelPosition?: "left" | "right";
  className?: string;
  description?: string;
}

export default function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  label,
  labelPosition = "left",
  className = "",
  description,
}: SwitchProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleToggle = () => {
    if (disabled) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onCheckedChange?.(newChecked);
  };

  const renderLabel = () => (
    <div className="flex flex-col select-none">
      <span className="text-sm font-semibold text-gray-800 transition-colors duration-200">
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500 mt-0.5 leading-normal">
          {description}
        </span>
      )}
    </div>
  );

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {label && labelPosition === "left" && renderLabel()}

      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full p-0
          transition-all duration-200 ease-in-out
          /* Permanent subtle ring structure for depth */
          border border-gray-300/70 shadow-inner
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          ${isChecked ? "bg-orange-500 border-orange-600" : "bg-gray-200"}
          ${disabled ? "opacity-40 cursor-not-allowed" : "hover:brightness-95 active:scale-[0.98]"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md
            transform transition-transform duration-200 ease-in-out
            /* Center vertically perfectly, flush to the edges */
            absolute top-[1px]
            ${isChecked ? "left-[25px]" : "left-[1px]"}
          `}
        />
      </button>

      {label && labelPosition === "right" && renderLabel()}
    </div>
  );
}