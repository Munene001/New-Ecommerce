// app/[shopSlug]/[productSlug]/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import pool from "@/lib/db";
import ProductGallery from "./components/productGallery";
import ProductSidebar from "./components/productSideBar";
import ProductTabs from "./components/productTabs";
import RecentlyViewed from "./components/recentlyViewed";
import MobileProductBar from "./components/mobileProductBar";
import PageBar from "@/app/components/layout/pageBar";
import TrackProductView from "./components/trackProduct";
import RelatedProducts from "./components/relatedProducts";
import { TrackProductAnalytics } from './components/trackProductView';

interface PageProps {
  params: Promise<{
    shopSlug: string;
    productSlug: string;
  }>;
}

type ProductAttributes = Record<
  string,
  string | number | boolean | string[] | null
>;

interface ProductImage {
  id: number;
  path: string;
  is_primary: boolean;
}

interface Reply {
  review_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
  is_owner_reply: boolean;
}

interface Review {
  review_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_owner_reply: boolean;
  replies: Reply[];
}

interface Product {
  product_id: number;
  product_name: string;
  description: string;
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  attributes: ProductAttributes;
  product_slug: string;
}

interface RelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shopSlug, productSlug } = await params;

  // Get shopId directly from database
  const [shopRows] = await pool.query(
    `SELECT shop_id FROM shops WHERE shop_slug = ?`,
    [shopSlug]
  );
  
  if (!shopRows || (shopRows as unknown[]).length === 0) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }
  
  const shopId = (shopRows as unknown[])[0] as { shop_id: number };

  // Fetch product data
  const [productRows] = await pool.query(
    `SELECT 
        p.product_name,
        p.description,
        p.product_id
     FROM products p
     WHERE p.product_slug = ? AND p.shop_id = ?`,
    [productSlug, shopId.shop_id]
  );
  
  if (!productRows || (productRows as unknown[]).length === 0) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }
  
  const product = (productRows as unknown[])[0] as {
    product_name: string;
    description: string;
    product_id: number;
  };

  const imageUrl = `/api/shopowner/products/${product.product_id}/images/primary?w=600`;
  const productUrl = `/${shopSlug}/${productSlug}`;

  return {
    title: product.product_name,
    description: product.description,
    openGraph: {
      title: product.product_name,
      description: product.description,
      images: [imageUrl],
      url: productUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.product_name,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { shopSlug, productSlug } = await params;

  // 1. Fetch shop data (includes secondaryColor and shopType)
  const shopApiUrl = new URL(
    `/api/shops/${shopSlug}`,
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  );
  const shopRes = await fetch(shopApiUrl.toString(), {
    next: { revalidate: 60 },
  });
  
  if (!shopRes.ok) notFound();
  
  const shopData = await shopRes.json();
  const shopId = shopData.shopId;
  const secondaryColor = shopData.secondaryColor || "#000000";

  // 2. Fetch product
  const [productRows] = await pool.query(
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
  
  if (!productRows || (productRows as unknown[]).length === 0) notFound();
  
  const productData = (productRows as unknown[])[0] as {
    product_id: number;
    product_name: string;
    description: string;
    price: number;
    discount_price: number | null;
    in_stock: boolean;
    attributes: string | ProductAttributes;
    product_slug: string;
  };

  // 3. Fetch images
  const [imageRows] = await pool.query(
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
  const [reviewRows] = await pool.query(
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
  const reviewsMap = new Map<number, Review>();
  const mainReviews: Review[] = [];

  for (const row of reviewRows as unknown[]) {
    const typedRow = row as {
      review_id: number;
      user_id: number;
      parent_review_id: number | null;
      rating: number;
      comment: string;
      created_at: string;
      is_owner_reply: boolean;
      full_name: string;
      email: string;
    };
    
    if (typedRow.parent_review_id === null) {
      const reviewObj: Review = {
        review_id: typedRow.review_id,
        user_id: typedRow.user_id,
        user_name: typedRow.full_name,
        rating: typedRow.rating,
        comment: typedRow.comment,
        created_at: typedRow.created_at,
        is_owner_reply: typedRow.is_owner_reply,
        replies: [],
      };
      reviewsMap.set(typedRow.review_id, reviewObj);
      mainReviews.push(reviewObj);
    } else {
      const parent = reviewsMap.get(typedRow.parent_review_id);
      if (parent) {
        parent.replies.push({
          review_id: typedRow.review_id,
          user_id: typedRow.user_id,
          user_name: typedRow.full_name,
          comment: typedRow.comment,
          created_at: typedRow.created_at,
          is_owner_reply: typedRow.is_owner_reply,
        });
      }
    }
  }

  // Compute average rating and total reviews AFTER building mainReviews
  const totalReviews = mainReviews.length;
  const avgRating = totalReviews
    ? mainReviews.reduce((sum: number, rev: Review) => sum + rev.rating, 0) / totalReviews
    : 0;

  // 5. Parse attributes
  let parsedAttributes: ProductAttributes = {};
  if (productData.attributes) {
    const raw = productData.attributes;
    parsedAttributes = typeof raw === "string" ? JSON.parse(raw) : raw as ProductAttributes;
  }

  // 6. Fetch related products 
  const [categoryRows] = await pool.query(
    `SELECT category_id FROM product_categories WHERE product_id = ?`,
    [productData.product_id]
  );
  
  const categoryIds = (categoryRows as unknown[]).map(row => (row as { category_id: number }).category_id);

  let relatedProducts: RelatedProduct[] = [];

  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => '?').join(',');
    const [relatedRows] = await pool.query(
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
    relatedProducts = relatedRows as RelatedProduct[];
  }

  if (relatedProducts.length < 6) {
    const needed = 6 - relatedProducts.length;
    const excludeIds = [productData.product_id, ...relatedProducts.map(p => p.product_id)];
    const excludePlaceholders = excludeIds.map(() => '?').join(',');
    const [randomRows] = await pool.query(
      `SELECT product_id, product_name, product_slug, price, discount_price
       FROM products
       WHERE shop_id = ? 
         AND product_id NOT IN (${excludePlaceholders})
       ORDER BY RAND()
       LIMIT ?`,
      [shopId, ...excludeIds, needed]
    );
    relatedProducts = [...relatedProducts, ...(randomRows as RelatedProduct[])];
  }

  const product: Product = {
    product_id: productData.product_id,
    product_name: productData.product_name,
    description: productData.description,
    price: productData.price,
    discount_price: productData.discount_price,
    in_stock: productData.in_stock,
    attributes: parsedAttributes,
    product_slug: productData.product_slug,
  };

  const images: ProductImage[] = (imageRows as unknown[]).map((row: unknown) => {
    const typedRow = row as { image_id: number; image_path: string; is_primary: boolean };
    return {
      id: typedRow.image_id,
      path: typedRow.image_path,
      is_primary: typedRow.is_primary,
    };
  });

  // ===== GET USER SESSION & WISHLIST STATUS =====
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialWishlistStatus = false;
  let isShopOwner = false;

  if (user) {
    const [userRows] = await pool.query(
      'SELECT user_id, role FROM users WHERE supabase_uid = ?',
      [user.id]
    );
    if (userRows && (userRows as unknown[]).length) {
      const userId = (userRows as unknown[])[0] as { user_id: number; role: string };
      isShopOwner = userId.role === 'shop_owner';

      const [wishlistRows] = await pool.query(
        'SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?',
        [userId.user_id, product.product_id]
      );
      initialWishlistStatus = (wishlistRows as unknown[]).length > 0;
    }
  }

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
              initialWishlistStatus={initialWishlistStatus}
              isShopOwner={isShopOwner}
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
            avgRating={avgRating}
            totalReviews={totalReviews}
            secondaryColor={secondaryColor}
            productId={product.product_id}
            shopSlug={shopSlug}
            productSlug={product.product_slug}
          />
        </div>

        <RelatedProducts 
          products={relatedProducts} 
          secondaryColor={secondaryColor} 
          shopSlug={shopSlug} 
        />

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
        in_stock={product.in_stock} // ← ONLY THIS LINE ADDED
      />
      <TrackProductAnalytics productId={product.product_id} />
      <TrackProductView product={product} /> 
    </>
  );
}