// components/ui/FormInput.tsx
"use client";

import { ReactNode } from "react";
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
}: FormInputProps) {
  const iconElement = typeof icon === "string" ? iconMap[icon as keyof typeof iconMap] : icon;

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
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-black resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 text-black"
          />
        )}
      </div>
    </div>
  );
}