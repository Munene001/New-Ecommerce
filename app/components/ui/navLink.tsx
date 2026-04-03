"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

interface NavLinkProps {
  href?: string;
  title: string;
  icon: React.ElementType;
  className?: string;
  onMenuClicked?: () => void;
  hasChildren?: boolean;
  expandChildren?: () => void;
  isChildActive?: boolean;
  expanded?: boolean;
}

const inter = Inter({ subsets: ["latin"], weight: ["600"] });

const NavLink = ({
  href,
  title,
  icon: Icon,
  className = "",
  onMenuClicked,
  hasChildren,
  expandChildren,
  isChildActive,
  expanded = false,
}: NavLinkProps) => {
  const [expandedState, setExpandedState] = useState(expanded);
  const pathname = usePathname();

  useEffect(() => {
    setExpandedState(expanded);
  }, [expanded]);

  const normalize = (path: string) => {
    if (path === "/") return "/";
    return path.replace(/\/+$/, "");
  };

  const currentPath = normalize(pathname);
  const normalizedHref = normalize(href || "");

  const isActive = isChildActive ? false : currentPath === normalizedHref;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    if (expandChildren) {
      expandChildren();
    }
  };

  const handleClick = () => {
    if (onMenuClicked) {
      onMenuClicked();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          flex items-center justify-between py-[15px] px-6 rounded-r-sm transition-colors gap-3 hover:bg-gray-300/20
          ${isActive ? "text-tunga-yellow bg-three hover:bg-three" : "text-white"}
          ${className}
        `}
      >
        <Link
          href={href || ""}
          onClick={!hasChildren ? handleClick : toggleExpand}
          className="flex flex-row items-center gap-3 flex-1"
        >
          <Icon size={20} className="text-white" />
          <span className={`${inter.className} header-font`}>
            {title}
          </span>
        </Link>

        {hasChildren && (
          <button
            onClick={toggleExpand}
            className="p-1 cursor-pointer hover:bg-[#0F2326] rounded-md flex items-center justify-center"
            aria-label="Toggle submenu"
          >
            {expandedState ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default NavLink;