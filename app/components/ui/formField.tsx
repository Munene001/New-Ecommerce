'use client';

import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

export interface FormFieldProps {
  name: string;
  label?: string;
  value: any;
  onChange: (e: React.ChangeEvent<any> | string | number) => void;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  options?: Array<{ id: string | number; name: string }>;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export default function FormField({
  name,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  disabled = false,
  rows = 4,
  options = [],
  className = '',
  labelClassName = '',
  inputClassName = '',
}: FormFieldProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle select change
  const handleSelect = (selectedValue: string | number) => {
    const syntheticEvent = {
      target: {
        name,
        value: selectedValue,
        type: 'select-one',
      },
    } as React.ChangeEvent<any>;
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  // Base input classes - increased touch target on mobile
  const baseInputClass = `w-full px-4 md:py-3 py-4 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black disabled:bg-gray-100 disabled:cursor-not-allowed ${inputClassName}`;

  // Render different input types
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange as React.ChangeEventHandler}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 text-black font-[Poppins] cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              name={name}
              checked={value || false}
              onChange={onChange as React.ChangeEventHandler}
              disabled={disabled}
              className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black disabled:cursor-not-allowed"
            />
            <span className="text-sm md:text-base">{placeholder || 'Yes'}</span>
          </label>
        );

      case 'select':
        const selectedOption = options.find(opt => opt.id === value);
        
        return (
          <div className="relative" ref={dropdownRef}>
            {/* Hidden select for form submission */}
            <select
              name={name}
              value={value}
              onChange={onChange as React.ChangeEventHandler}
              className="hidden"
            >
              <option value=""></option>
              {options.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            {/* Custom dropdown button - bigger touch target on mobile */}
            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              className={`${baseInputClass} text-left flex items-center justify-between min-h-[52px] md:min-h-[44px] ${
                isOpen ? 'ring-2 ring-black border-transparent' : ''
              }`}
            >
              <span className={`truncate text-[16px] ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                {selectedOption ? selectedOption.name : placeholder || 'Select an option'}
              </span>
              <Icon
                icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="w-5 h-5 text-gray-400 flex-shrink-0"
              />
            </button>

            {/* Dropdown menu - full width on mobile with better touch targets */}
            {isOpen && !disabled && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn">
                <div className="max-h-60 overflow-y-auto py-1 bg-blue-700/10">
                  {options.length > 0 ? (
                    options.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={`px-4 py-4 md:py-2.5 text-[16px] cursor-pointer transition-all duration-150 min-h-[52px] md:min-h-[44px] flex items-center ${
                          value === option.id 
                            ? 'text-black font-medium hover:bg-three border-b border-black/10' 
                            : 'text-black font-medium hover:bg-three hover:pl-5 border-b border-black/10'
                        }`}
                      >
                        {option.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-400 text-center italic min-h-[52px] flex items-center justify-center">
                      No options available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default: 
        return (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange as React.ChangeEventHandler}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClass} min-h-[52px] md:min-h-[44px]`}
          />
        );
    }
  };

  return (
    <div className={className}>
      {label && type !== 'checkbox' && (
        <label className={`block md:text-sm text-[16px] font-medium text-black mb-2 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && type !== 'select' && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}