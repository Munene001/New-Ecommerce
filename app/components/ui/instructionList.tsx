"use client";

import { Icon } from "@iconify/react";

interface InstructionItem {
  text: string | React.ReactNode;
  icon?: string;
}

interface InstructionsListProps {
  items: InstructionItem[];
  variant?: 'blue' | 'yellow' | 'red' | 'green' | 'gray';
  className?: string;
}

const variantStyles = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-500',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-black',
    icon: 'text-green-500',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
};

export default function InstructionsList({ 
  items, 
  variant = 'blue',
  className = '' 
}: InstructionsListProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg md:p-4 py-3 px-4 ${className}`}>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            {item.icon ? (
              <Icon icon={item.icon} className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
            ) : (
              <span className={`text-lg font-bold leading-5 flex-shrink-0 ${styles.icon}`}>•</span>
            )}
            <span className={`text-sm ${styles.text}`}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}