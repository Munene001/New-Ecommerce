// app/(shop)/[shopSlug]/page.tsx
import ShopProductsClient from "./shopProductsClient";

export default async function ShopPage() {
  // No data fetching needed – layout provides ShopProvider and ShopFilterProvider
  return <ShopProductsClient />;
}