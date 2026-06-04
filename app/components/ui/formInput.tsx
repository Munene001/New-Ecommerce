"use client"

import { ReactNode, FocusEvent } from "react";
import { User, Mail, Phone, MapPin, Home, MessageSquare } from "lucide-react";

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (field: string, value: string) => void;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder: string;
  required?: boolean;
  icon?: ReactNode;
  rows?: number;
  onFocus?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void; // ADDED
}

const iconMap = {
  user: <User className="w-4 h-4 text-gray-500" />,
  mail: <Mail className="w-4 h-4 text-gray-500" />,
  phone: <Phone className="w-4 h-4 text-gray-500" />,
  mapPin: <MapPin className="w-4 h-4 text-gray-500" />,
  home: <Home className="w-4 h-4 text-gray-500" />,
  message: <MessageSquare className="w-4 h-4 text-gray-500" />,
};

export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  icon,
  rows = 3,
  onFocus, // ADDED
}: FormInputProps) {
  const iconElement = typeof icon === "string" ? iconMap[icon as keyof typeof iconMap] : icon;

  const commonProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(name, e.target.value),
    placeholder,
    onFocus, // ADDED – will be undefined if not provided
    className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-black",
  };

  return (
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {iconElement && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {iconElement}
          </div>
        )}
        {type === "textarea" ? (
          <textarea
            {...commonProps}
            rows={rows}
            className={commonProps.className + " resize-none"}
          />
        ) : (
          <input
            {...commonProps}
            type={type}
          />
        )}
      </div>
    </div>
  );
}