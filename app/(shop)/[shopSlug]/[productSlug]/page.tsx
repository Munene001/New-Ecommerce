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

    // 4. Fetch reviews (main and replies)
    const [reviewRows] = await connection.query(
      `SELECT 
        r.review_id,
        r.user_id,
        r.parent_review_id,
        r.rating,
        r.comment,
        r.created_at,
        r.is_owner_reply,
        u.full_name,
        u.email
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY COALESCE(r.parent_review_id, r.review_id), r.created_at ASC`,
      [productData.product_id]
    );

    // Build a map: main review id -> review object with replies array
    const reviewsMap = new Map();
    const mainReviews: any[] = [];

    for (const row of reviewRows as any[]) {
      if (row.parent_review_id === null) {
        const reviewObj = {
          review_id: row.review_id,
          user_id: row.user_id,
          user_name: row.full_name,
          rating: row.rating,
          comment: row.comment,
          created_at: row.created_at,
          is_owner_reply: row.is_owner_reply,
          replies: [],
        };
        reviewsMap.set(row.review_id, reviewObj);
        mainReviews.push(reviewObj);
      } else {
        const parent = reviewsMap.get(row.parent_review_id);
        if (parent) {
          parent.replies.push({
            review_id: row.review_id,
            user_id: row.user_id,
            user_name: row.full_name,
            comment: row.comment,
            created_at: row.created_at,
            is_owner_reply: row.is_owner_reply,
          });
        }
      }
    }

    // 5. Parse attributes
    let parsedAttributes: ProductAttributes = {};
    if (productData.attributes) {
      const raw = productData.attributes;
      parsedAttributes = typeof raw === "string" ? JSON.parse(raw) : raw;
    }

    // 6. Fetch related products 
    const [categoryRows] = await connection.query(
      `SELECT category_id FROM product_categories WHERE product_id = ?`,
      [productData.product_id]
    );
    const categoryIds = (categoryRows as any[]).map(row => row.category_id);

    let relatedProducts: any[] = [];

    if (categoryIds.length > 0) {
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

    if (relatedProducts.length < 6) {
      const needed = 6 - relatedProducts.length;
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
            <div className="lg:w-[38%]">
              <ProductGallery
                images={images}
                productId={product.product_id}
                secondaryColor={secondaryColor}
              />
            </div>
            <div className="lg:w-[50%] lg:overflow-y-auto lg:pr-2">
              <ProductSidebar
                product={product}
                secondaryColor={secondaryColor}
                shopSlug={shopSlug}
              />
            </div>
            <div className="hidden lg:block lg:w-[12%] lg:overflow-y-auto">
              <RecentlyViewed
                currentProductId={product.product_id}
                secondaryColor={secondaryColor}
              />
            </div>
          </div>

          <div className="mt-12">
            <ProductTabs
              attributes={product.attributes}
              reviews={mainReviews}
              secondaryColor={secondaryColor}
              productId={product.product_id}
              shopSlug={shopSlug}
              productSlug={product.product_slug}
            />
          </div>

          <RelatedProducts products={relatedProducts} secondaryColor={secondaryColor} shopSlug={shopSlug} />

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