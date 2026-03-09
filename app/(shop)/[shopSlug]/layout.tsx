// app/(shop)/[shopSlug]/layout.tsx
import { ShopProvider } from "../ShopContext";
import ShopLayoutClient from "./components/shopLayoutClient";

// Server function to fetch shop data
async function getShopData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/shops/${slug}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) return null;
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
}

// Server Component Layout - FIXED: await params
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopSlug: string }>; // params is a Promise
}) {
  // Await the params Promise to get the actual params object
  const { shopSlug } = await params;
  
  const shopData = await getShopData(shopSlug);
  
  if (!shopData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
          <p className="text-gray-600">The shop you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }
  
  return (
    <ShopProvider initialShopData={shopData}>
      <ShopLayoutClient>
        {children}
      </ShopLayoutClient>
    </ShopProvider>
  );
}