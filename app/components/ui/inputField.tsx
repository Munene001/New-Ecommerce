"use client";

import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

export interface InputFieldProps {
  name: string;
  label?: string;
  value: string | number | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => void;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'email' | 'password' | 'tel' | 'url' | 'color';
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  options?: Array<{ id: string | number; name: string }>;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  helpText?: string;
  icon?: string;
}

export default function InputField({
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
  helpText,
  icon,
}: InputFieldProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string | number) => {
    const syntheticEvent = {
      target: {
        name,
        value: selectedValue,
        type: 'select-one',
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  const baseInputClass = `w-full px-4 py-3 border rounded-xl transition-all duration-200 font-[Poppins] text-gray-900 placeholder-gray-400 bg-white ${
    error 
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
      : isFocused 
        ? 'border-black ring-2 ring-black/10' 
        : 'border-gray-300 hover:border-gray-400'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''} ${inputClassName}`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value as string || ''}
            onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseInputClass}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 text-gray-700 cursor-pointer group">
            <input
              type="checkbox"
              name={name}
              checked={value as boolean || false}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              disabled={disabled}
              className="w-5 h-5 rounded-md border-2 border-gray-400 text-black focus:ring-2 focus:ring-black/20 focus:ring-offset-2 transition-all duration-200 disabled:cursor-not-allowed"
            />
            <span className="text-sm select-none">{placeholder || 'Yes'}</span>
          </label>
        );

      case 'select':
        const selectedOption = options.find(opt => opt.id === value);
        
        return (
          <div className="relative" ref={dropdownRef}>
            <select
              name={name}
              value={value as string | number || ''}
              onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
              className="hidden"
            >
              <option value=""></option>
              {options.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`${baseInputClass} text-left flex items-center justify-between ${isOpen ? 'border-black ring-2 ring-black/10' : ''}`}
            >
              <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                {selectedOption ? selectedOption.name : placeholder || 'Select an option'}
              </span>
              <Icon
                icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'text-black' : 'text-gray-500'}`}
              />
            </button>

            {isOpen && !disabled && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto py-2">
                  {options.length > 0 ? (
                    options.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={`px-4 py-3 text-sm cursor-pointer transition-all duration-150 flex items-center gap-2 ${
                          value === option.id 
                            ? 'bg-gray-100 text-black font-medium' 
                            : 'text-gray-600 hover:bg-gray-50 hover:pl-5'
                        }`}
                      >
                        {value === option.id && (
                          <Icon icon="mdi:check" className="w-4 h-4 text-black flex-shrink-0" />
                        )}
                        <span className={value === option.id ? '' : 'ml-6'}>{option.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No options available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'color':
        return (
          <div className="flex items-center gap-4">
            <input
              type="color"
              name={name}
              value={value as string || '#000000'}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              disabled={disabled}
              className="w-14 h-14 rounded-xl border-2 border-gray-300 cursor-pointer bg-white p-1"
            />
            <input
              type="text"
              value={value as string || '#000000'}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              placeholder="#000000"
              disabled={disabled}
              className={baseInputClass}
              name={name}
            />
          </div>
        );

      default:
        return (
          <div className="relative">
            {icon && (
              <Icon 
                icon={icon} 
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
              />
            )}
            <input
              type={type}
              name={name}
              value={value as string || ''}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              placeholder={placeholder}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`${baseInputClass} ${icon ? 'pl-10' : ''}`}
            />
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {label && type !== 'checkbox' && (
        <label className={`block text-sm font-medium text-gray-700 mb-1.5 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {renderInput()}
      {helpText && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}