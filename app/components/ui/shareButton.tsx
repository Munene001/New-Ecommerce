'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  variant?: 'default' | 'primary';
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  color?: string; // hover color for default variant
  onSuccess?: () => void; // callback for successful share/copy
  onError?: () => void;   // callback for error
}

export default function ShareButton({
  title,
  text,
  url,
  variant = 'default',
  showLabel = true,
  className = '',
  iconClassName = 'w-5 h-5',
  labelClassName = 'text-sm',
  color,
  onSuccess,
  onError,
}: ShareButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleShare = async () => {
    const shareData = { title, text, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onSuccess?.(); // notify parent
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          onError?.();
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        if (variant === 'primary') {
          setShowTooltip(true);
          setTimeout(() => setShowTooltip(false), 2000);
        }
        onSuccess?.();
      } catch (err) {
        onError?.();
      }
    }
  };

  // Primary variant (dashboard style)
  if (variant === 'primary') {
    return (
      <div className="relative">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 bg-[#0FA965] hover:bg-[#0c8a52] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          {showLabel && <span>Share Shop</span>}
        </button>
        {showTooltip && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
            Link copied!
          </div>
        )}
      </div>
    );
  }

  // Default variant (product page style)
  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1 text-gray-600 transition-colors ${className}`}
      style={color ? { color: 'inherit' } : undefined}
      onMouseEnter={(e) => color && (e.currentTarget.style.color = color)}
      onMouseLeave={(e) => color && (e.currentTarget.style.color = '')}
    >
      <Share2 className={iconClassName} />
      {showLabel && <span className={labelClassName}>Share</span>}
    </button>
  );
}