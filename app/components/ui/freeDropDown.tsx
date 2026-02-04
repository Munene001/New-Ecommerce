"use client";
import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

interface FreeDropDownProps {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ id: string | number; name: string }>;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onSearch?: (query: string) => Promise<void>;
  isLoading?: boolean;
}

export default function FreeDropDown({
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  onSearch,
  isLoading = false,
}: FreeDropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localOptions, setLocalOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update local options when parent options change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens with search
  useEffect(() => {
    if (isOpen && onSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, onSearch]);

  // Debounced search
  useEffect(() => {
    if (!onSearch || !searchQuery.trim()) return;

    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

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
    setSearchQuery("");
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && onSearch) {
      setSearchQuery("");
    }
  };

  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption ? selectedOption.name : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden select for form submission */}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="hidden"
      >
        <option value=""></option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full rounded-[10px] bg-[#10323b]  h-[50px] px-3 text-left focus:outline-none focus:border-tunga-contrast-three focus:ring-1 focus:ring-tunga-contrast-three hover:border-tunga-contrast-three transition-colors flex items-center justify-between pr-10"
      >
        {/* Text with overflow handling */}
        <span 
          className={`text-xs truncate flex-1 ${
            !selectedOption ? 'text-gray-300' : 'text-white'
          }`}
          title={displayValue}
        >
          {displayValue}
        </span>
        
        {/* Dropdown Icon */}
        <div className="absolute right-3 flex items-center">
          <Icon
            icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
            className="text-[#A0AEC0] w-5 h-5 flex-shrink-0"
          />
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          style={{
            scrollbarColor: "#374748 #092126",
            scrollbarWidth: "thin",
          }}
          className="absolute top-full left-0 w-full mt-1 rounded-md max-h-70 overflow-y-auto z-20 border-2 border-white/50 bg-[#374748] [scrollbar-gutter:stable]"
        >
          {/* Search Input - Only show when onSearch is provided */}
          {onSearch && (
            <div className="p-2 border-b border-white/20">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-transparent text-white placeholder:text-gray-300 border border-white/30 rounded-md focus:outline-none focus:ring-1 focus:ring-tunga-contrast-three text-xs"
              />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-3 py-3 text-center text-xs text-[#A0AEC0]">
              Searching...
            </div>
          )}

          {/* Options */}
          {!isLoading && (
            <>
              {/* Placeholder option */}
              <div
                onClick={() => handleSelect("")}
                className={`px-3 py-3 cursor-pointer text-xs mx-1 my-[2px] rounded-[8px] border-b border-white/10 ${
                  !value
                    ? "bg-[#1b2c30] text-white font-medium" 
                    : "text-[#A0AEC0] hover:bg-tunga-contrast-three hover:text-white" 
                }`}
              >
                {placeholder}
              </div>
              
              {/* Options List */}
              {localOptions.length > 0 ? (
                localOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`px-3 py-3 cursor-pointer text-xs mx-1 my-[2px] rounded-[8px] border-b border-white/10 ${
                      value === option.id
                        ? "bg-[#1b2c30] text-white font-medium" 
                        : "text-white hover:bg-tunga-contrast-three" 
                    }`}
                  >
                    {option.name}
                  </div>
                ))
              ) : (
                // No results message
                <div className="px-3 py-3 text-center text-xs text-[#A0AEC0]">
                  {searchQuery ? 'No countries found' : 'No options available'}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}