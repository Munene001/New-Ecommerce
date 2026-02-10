"use client";

import { useState } from "react";
import NavLink from "../ui/navLink";
import { LayoutDashboard,ShoppingCart, Plus,  SquareChartGantt, HandCoins, ChartNoAxesCombined, SunMoon, Settings, Store, LogOut  } from "lucide-react";
import Link from "next/link";




interface BaseLeftMenuProps {
    onMenuClicked: (bool: boolean) => void;
    shopSlug: string;
  }

  export default function BaseLeftMenu({ onMenuClicked, shopSlug }: BaseLeftMenuProps) {
  const [expandChildren, setExpandChildren] = useState(false);

  


  const navItems = [
    { 
      href: `/dashboard/${shopSlug}`, // Use dynamic slug
      title: "Dashboard", 
      icon: LayoutDashboard 
    }, 
    { 
      href: "#", 
      title: "Products", 
      icon: ShoppingCart, 
      children: [
        { href: `/dashboard/${shopSlug}/products/add`, title: "Add Product", icon: Plus },
        { href: `/dashboard/${shopSlug}/products`, title: "All Products", icon: SquareChartGantt },
      ] 
    },
    { 
      href: `/dashboard/${shopSlug}/payments`, 
      title: "Payments", 
      icon: HandCoins 
    },
    { 
      href: `/dashboard/${shopSlug}/sales`, 
      title: "Sales and Analytics", 
      icon: ChartNoAxesCombined 
    },
    { 
      href: `/dashboard/${shopSlug}/appearance`, 
      title: "Appearance", 
      icon: SunMoon 
    },
    { 
      href: `/dashboard/${shopSlug}/settings`, 
      title: "Settings", 
      icon: Settings 
    },
    { 
      href: `/shop/${shopSlug}`, // View public shop
      title: "View Shop", 
      icon: Store 
    },
  ];

  const handlLogout =()=> {

  }
  return (
    <nav className="space-y-3 mt-2 md:mt-0">
      <div className="">
        {navItems.map((item) => (
          <div key={item.href}>
            <NavLink
              href={item.href}
              title={item.title}
              icon={item.icon}
              className=""
              hasChildren={!!item.children}
              expandChildren={(status) => setExpandChildren(status)}
              onMenuClicked={() => onMenuClicked(false)}
              // className="py-1"
            />
            {expandChildren && item.children && (
              <div
                className={`ms-4 transition-transform duration-500 ease-in-out overflow-hidden`}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      href={child.href}
                      title={child.title}
                      icon={child.icon}
                      onMenuClicked={() => onMenuClicked(false)}
                     
                    />
                  ))}
              </div>
            )}
          </div>
        ))}

        <div className="">
          <div className="w-full">
            <div className={`flex items-center justify-between py-[15px] px-6 rounded-md transition-colors gap-3 hover:bg-[#1E3134]`}>
              <Link
                href={ ""}
                onClick={handlLogout}
                className="flex items-center gap-3 flex-1"
              >
                <LogOut size={16} className="hover:text-tunga-accent" />
                <span className={`header-font`}>
                  Logout
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}