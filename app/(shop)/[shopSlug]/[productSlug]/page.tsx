import { getConnection } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductGallery from "./components/productGallery";
import ProductSidebar from "./components/productSideBar";
import ProductTabs from "./components/productTabs";
import RecentlyViewed from "./components/recentlyViewed";
import MobileProductBar from "./components/mobileProductBar";
import PageBar from "@/app/components/layout/pageBar";
import TrackProductView from "./components/trackProduct";
import RelatedProducts from "./components/relatedProducts";

interface PageProps {
  params: Promise<{
    shopSlug: string;
    productSlug: string;
  }>;
}

type ProductAttributes = Record<
  string,
  string | number | boolean | null | object
>;

export default async function ProductPage({ params }: PageProps) {
  const { shopSlug, productSlug } = await params;
  const connection = await getConnection();

  try {
    // 1. Fetch shop data (includes secondaryColor and shopType)
    const shopApiUrl = new URL(
      `/api/shops/${shopSlug}`,
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    );
    const shopRes = await fetch(shopApiUrl.toString(), {
      next: { revalidate: 60 },
    });
    if (!shopRes.ok) notFound();
    const shopData = await shopRes.json();
    const shopId = shopData.shopId;
    const secondaryColor = shopData.secondaryColor || "#000000";

    // 2. Fetch product
    const [productRows] = await connection.query(
      `SELECT 
          p.product_id,
          p.product_name,
          p.description,
          p.price,
          p.discount_price,
          p.in_stock,
          p.attributes,
          p.product_slug 
       FROM products p
       WHERE p.product_slug = ? AND p.shop_id = ?`,
      [productSlug, shopId]
    );
    if (!productRows || (productRows as any[]).length === 0) notFound();
    const productData = (productRows as any[])[0];

    // 3. Fetch images
    const [imageRows] = await connection.query(
      `SELECT 
          image_id,
          image_path,
          is_primary
       FROM product_images 
       WHERE product_id = ?
       ORDER BY is_primary DESC, image_id ASC`,
      [productData.product_id]
    );

    // 4. Fetch reviews (placeholder)
    const reviews: any[] = [];

    // Parse attributes
    let parsedAttributes: ProductAttributes = {};
    if (productData.attributes) {
      const raw = productData.attributes;
      parsedAttributes = typeof raw === "string" ? JSON.parse(raw) : raw;
    }

    // 5. Fetch related products
    // Get current product's category IDs
    const [categoryRows] = await connection.query(
      `SELECT category_id FROM product_categories WHERE product_id = ?`,
      [productData.product_id]
    );
    const categoryIds = (categoryRows as any[]).map(row => row.category_id);

    let relatedProducts: any[] = [];

    if (categoryIds.length > 0) {
      // Query for related products sharing any category
      const placeholders = categoryIds.map(() => '?').join(',');
      const [relatedRows] = await connection.query(
        `SELECT DISTINCT p.product_id, p.product_name, p.product_slug, p.price, p.discount_price
         FROM products p
         JOIN product_categories pc ON p.product_id = pc.product_id
         WHERE p.shop_id = ? 
           AND p.product_id != ?
           AND pc.category_id IN (${placeholders})
         ORDER BY RAND()
         LIMIT 6`,
        [shopId, productData.product_id, ...categoryIds]
      );
      relatedProducts = relatedRows as any[];
    }

    // If we have fewer than 6, fill with random products from same shop
    if (relatedProducts.length < 6) {
      const needed = 6 - relatedProducts.length;
      // Exclude current product and already selected IDs
      const excludeIds = [productData.product_id, ...relatedProducts.map(p => p.product_id)];
      const excludePlaceholders = excludeIds.map(() => '?').join(',');
      const [randomRows] = await connection.query(
        `SELECT product_id, product_name, product_slug, price, discount_price
         FROM products
         WHERE shop_id = ? 
           AND product_id NOT IN (${excludePlaceholders})
         ORDER BY RAND()
         LIMIT ?`,
        [shopId, ...excludeIds, needed]
      );
      relatedProducts = [...relatedProducts, ...(randomRows as any[])];
    }

    const product = {
      product_id: productData.product_id,
      product_name: productData.product_name,
      description: productData.description,
      price: productData.price,
      discount_price: productData.discount_price,
      in_stock: productData.in_stock,
      attributes: parsedAttributes,
      product_slug: productData.product_slug,
    };

    const images = (imageRows as any[]).map((row: any) => ({
      id: row.image_id,
      path: row.image_path,
      is_primary: row.is_primary,
    }));

    return (
      <>
        <PageBar breadcrumb="Product" itemName={product.product_name} />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:h-[75vh]">
            {/* Gallery */}
            <div className="lg:w-[38%]">
              <ProductGallery
                images={images}
                productId={product.product_id}
                secondaryColor={secondaryColor}
              />
            </div>
    
            {/* Sidebar */}
            <div className="lg:w-[50%] lg:overflow-y-auto lg:pr-2">
              <ProductSidebar
                product={product}
                secondaryColor={secondaryColor}
                shopSlug={shopSlug}
              />
            </div>
    
            {/* Recently Viewed - DESKTOP ONLY */}
            <div className="hidden lg:block lg:w-[12%] lg:overflow-y-auto">
              <RecentlyViewed
                currentProductId={product.product_id}
                secondaryColor={secondaryColor}
              />
            </div>
          </div>
    
          {/* Tabs */}
          <div className="mt-12">
            <ProductTabs
              description={product.description}
              attributes={product.attributes}
              reviews={reviews}
              secondaryColor={secondaryColor}
            />
          </div>

          {/* Related Products */}
          <RelatedProducts products={relatedProducts} secondaryColor={secondaryColor}  shopSlug={shopSlug} />
    
          {/* Recently Viewed - MOBILE ONLY (below tabs and related) */}
          <div className="block lg:hidden mt-6">
            <RecentlyViewed
              currentProductId={product.product_id}
              secondaryColor={secondaryColor}
              variant="mobile"
            />
          </div>
        </div>
    
        <MobileProductBar
          productId={product.product_id}
          productName={product.product_name}
          price={product.price}
          discountPrice={product.discount_price}
          secondaryColor={secondaryColor}
        />
        <TrackProductView product={product} />
      </>
    );
  } catch (error) {
    console.error("Product page error:", error);
    return (
      <div className="p-5 text-red-500">
        An error occurred while loading the product.
      </div>
    );
  } finally {
    await connection.end();
  }
}