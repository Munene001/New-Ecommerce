"use client"
import BaseLeftMenu from "@/app/components/layout/leftNav";
import DashHeader from "@/app/components/layout/dashHeader";
import { useParams } from "next/navigation";
import { ShopProvider } from "../../shopContext";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;

  const handleMenuClick = (bool: boolean) => {
    console.log("Menu clicked:", bool);
  };

  return (
    <ShopProvider shopSlug={shopSlug}>
      <div className="min-h-screen">
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
    </ShopProvider>
  );
}