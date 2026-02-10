"use client"
import BaseLeftMenu from "@/app/components/layout/leftNav";
import DashHeader from "@/app/components/layout/dashHeader";
import { useParams } from "next/navigation";

export default function DashboardLayout({
  children,
  params, 
}: Readonly<{
  children: React.ReactNode;
  params: { shopSlug: string };
}>) {
  const urlParams = useParams();
  
  // Simple fallback without state - prevents re-renders
  const shopSlug = params?.shopSlug || urlParams?.shopSlug as string;

  const handleMenuClick = (bool: boolean) => {
    console.log("Menu clicked:", bool);
  };

  return (
    <div className="min-h-screen">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 h-[85px] bg-white z-50 shadow-sm">
        <DashHeader shopSlug={shopSlug || ""} />
      </header>
      
   
      <div className="pt-[85px] flex min-h-screen">
        
        <aside className="sticky top-16 w-64 h-[calc(100vh-4rem)] bg-[url('/assets/mazehex4.svg')] bg-black text-white overflow-y-auto">
          <BaseLeftMenu 
            onMenuClicked={handleMenuClick}  
            shopSlug={shopSlug || ""}
          />
        </aside>
        
      
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}