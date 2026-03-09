// app/components/ui/NavIcon.tsx
import Link from "next/link";
import { ReactNode } from "react";

interface NavIconProps {
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  isMobile?: boolean; // Add this prop to distinguish mobile vs desktop
}

export default function NavIcon({ 
  href, 
  icon, 
  label, 
  onClick,
  isMobile = false,
  className = "",
  iconClassName = "",
  labelClassName = ""
}: NavIconProps) {
  
  // Desktop styles (default)
  const desktopClasses = "text-[var(--primary)] hover:text-[var(--secondary)] md:text-lg transition flex items-center gap-2";
  const desktopIconClasses = "[&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5";
  
  // Mobile styles (for the menu)
  const mobileClasses = "flex items-center gap-4 px-4 pb-3 text-xl font-medium border-b border-gray-400 hover:bg-gray-50 transition-colors w-full";
  const mobileIconClasses = "text-gray-700 [&>svg]:w-6 [&>svg]:h-6";
  const mobileLabelClasses = "text-[var(--primary)]";

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={isMobile ? mobileClasses : (className || desktopClasses)}
    >
      <span className={isMobile ? mobileIconClasses : (iconClassName || desktopIconClasses)}>
        {icon}
      </span>
      <span className={isMobile ? mobileLabelClasses : labelClassName}>
        {label}
      </span>
    </Link>
  );
}