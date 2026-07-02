import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import pool from "@/lib/db";
import ProductGallery from "./components/productGallery";
import ProductWrapper from "./components/productWrapper";
import ProductTabs from "./components/productTabs";
import RecentlyViewed from "./components/recentlyViewed";
import MobileProductWrapper from "./components/mobileProductWrapper";
import PageBar from "@/app/components/layout/pageBar";
import TrackProductView from "./components/trackProduct";
import RelatedProducts from "./components/relatedProducts";
import { TrackProductAnalytics } from "./components/trackProductView";
import {
  Product,
  ProductImage,
  ProductVariant,
  DisplayPrice,
  StockInfo,
} from "@/lib/types/product";

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

interface ReviewReply {
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
  replies: ReviewReply[];
}

interface RelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  product_type: 'simple' | 'variable';
  effective_stock: number;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shopSlug, productSlug } = await params;

  const [shopRows] = await pool.query(
    `SELECT shop_id FROM shops WHERE shop_slug = ?`,
    [shopSlug],
  );

  if (!shopRows || (shopRows as unknown[]).length === 0) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const shopId = (shopRows as unknown[])[0] as { shop_id: number };

  const [productRows] = await pool.query(
    `SELECT 
        p.product_name,
        p.description,
        p.product_id
     FROM products p
     WHERE p.product_slug = ? AND p.shop_id = ?`,
    [productSlug, shopId.shop_id],
  );

  if (!productRows || (productRows as unknown[]).length === 0) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
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
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.product_name,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { shopSlug, productSlug } = await params;

  const shopApiUrl = new URL(
    `/api/shops/${shopSlug}`,
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  );
  const shopRes = await fetch(shopApiUrl.toString(), {
    next: { revalidate: 60 },
  });

  if (!shopRes.ok) notFound();

  const shopData = await shopRes.json();
  const shopId = shopData.shopId;
  const secondaryColor = shopData.secondaryColor || "#000000";

  const [productRows] = await pool.query(
    `SELECT 
        p.product_id,
        p.shop_id,
        p.shop_type,
        p.product_name,
        p.product_slug,
        p.description,
        p.price,
        p.discount_price,
        p.stock_quantity,
        p.product_type,
        p.status,
        p.attributes,
        p.created_at,
        p.updated_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'image_id', pi.image_id,
              'image_path', pi.image_path,
              'is_primary', pi.is_primary,
              'created_at', pi.created_at
            )
          )
          FROM product_images pi
          WHERE pi.product_id = p.product_id
        ) as images,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'variant_id', pv.variant_id,
              'attributes', pv.attributes,
              'price', pv.price,
              'discount_price', pv.discount_price,
              'stock_quantity', pv.stock_quantity,
              'created_at', pv.created_at,
              'updated_at', pv.updated_at
            )
          )
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as variants,
        (
          SELECT MIN(COALESCE(pv.discount_price, pv.price))
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as min_effective_price,
        (
          SELECT MAX(COALESCE(pv.discount_price, pv.price))
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as max_effective_price,
        (
          SELECT MIN(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as min_original_price,
        (
          SELECT MAX(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as max_original_price,
        (
          SELECT SUM(pv.stock_quantity)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as total_stock
     FROM products p
     WHERE p.product_slug = ? AND p.shop_id = ?`,
    [productSlug, shopId],
  );

  if (!productRows || (productRows as unknown[]).length === 0) notFound();

  const row = (productRows as unknown[])[0] as {
    product_id: number;
    shop_id: number;
    shop_type: string;
    product_name: string;
    product_slug: string;
    description: string;
    price: number;
    discount_price: number | null;
    stock_quantity: number;
    product_type: "simple" | "variable";
    status: "draft" | "published";
    attributes: string | ProductAttributes;
    created_at: string;
    updated_at: string;
    images: string | null;
    variants: string | null;
    min_effective_price: number | null;
    max_effective_price: number | null;
    min_original_price: number | null;
    max_original_price: number | null;
    total_stock: number | null;
  };

  const [imageRows] = await pool.query(
    `SELECT 
        image_id,
        image_path,
        is_primary
     FROM product_images 
     WHERE product_id = ?
     ORDER BY is_primary DESC, image_id ASC`,
    [row.product_id],
  );

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
    [row.product_id],
  );

  const reviewsMap = new Map<number, Review>();
  const mainReviews: Review[] = [];

  for (const reviewRow of reviewRows as unknown[]) {
    const typedRow = reviewRow as {
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

  const totalReviews = mainReviews.length;
  const avgRating = totalReviews
    ? mainReviews.reduce((sum: number, rev: Review) => sum + rev.rating, 0) /
      totalReviews
    : 0;

  let parsedAttributes: ProductAttributes = {};
  if (row.attributes) {
    const raw = row.attributes;
    parsedAttributes =
      typeof raw === "string" ? JSON.parse(raw) : (raw as ProductAttributes);
  }

  const images: ProductImage[] = (imageRows as unknown[]).map(
    (imgRow: unknown) => {
      const typed = imgRow as {
        image_id: number;
        image_path: string;
        is_primary: boolean;
      };
      return {
        image_id: typed.image_id,
        image_path: typed.image_path,
        is_primary: typed.is_primary,
        created_at: new Date().toISOString(),
      };
    },
  );

  const variants: ProductVariant[] = row.variants
    ? (typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants)
    : [];

  let displayPrice: DisplayPrice;
  if (row.product_type === "variable") {
    const minEffective = row.min_effective_price || 0;
    const maxEffective = row.max_effective_price || 0;
    const minOriginal = row.min_original_price || 0;
    const maxOriginal = row.max_original_price || 0;
    
    const hasDiscount = (minOriginal !== minEffective) || (maxOriginal !== maxEffective);
    
    const effectiveFormatted = minEffective === maxEffective 
      ? `${minEffective}` 
      : `${minEffective} - ${maxEffective}`;
    
    let originalFormatted: string | null = null;
    if (hasDiscount) {
      originalFormatted = minOriginal === maxOriginal 
        ? `${minOriginal}` 
        : `${minOriginal} - ${maxOriginal}`;
    }
    
    displayPrice = {
      min: minEffective,
      max: maxEffective,
      formatted: effectiveFormatted,
      isRange: minEffective !== maxEffective,
      original_min: hasDiscount ? minOriginal : null,
      original_max: hasDiscount ? maxOriginal : null,
      original_formatted: originalFormatted,
      hasDiscount: hasDiscount
    };
  } else {
    const effectivePrice = row.discount_price || row.price;
    const originalPrice = row.price;
    const hasDiscount = !!(row.discount_price && row.discount_price < row.price);
    
    displayPrice = {
      min: effectivePrice,
      max: effectivePrice,
      formatted: `${effectivePrice}`,
      isRange: false,
      original_min: hasDiscount ? originalPrice : null,
      original_max: hasDiscount ? originalPrice : null,
      original_formatted: hasDiscount ? `${originalPrice}` : null,
      hasDiscount: hasDiscount
    };
  }

  let stockInfo: StockInfo;
  if (row.product_type === "variable") {
    stockInfo = {
      type: "varies",
      total: row.total_stock || 0,
    };
  } else {
    stockInfo = {
      type: "simple",
      total: row.stock_quantity,
      quantity: row.stock_quantity,
    };
  }

  const product: Product = {
    product_id: row.product_id,
    shop_id: row.shop_id,
    shop_type: row.shop_type,
    product_name: row.product_name,
    product_slug: row.product_slug,
    description: row.description,
    price: row.product_type === "variable" ? 0 : row.price,
    discount_price: row.product_type === "variable" ? null : row.discount_price,
    stock_quantity: row.product_type === "variable" ? 0 : row.stock_quantity,
    product_type: row.product_type,
    status: row.status,
    attributes: parsedAttributes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: images,
    variants: variants,
    display_price: displayPrice,
    stock_info: stockInfo,
    in_stock:
      row.product_type === "variable"
        ? (row.total_stock || 0) > 0
        : row.stock_quantity > 0,
    can_publish: false,
  };

  const [categoryRows] = await pool.query(
    `SELECT category_id FROM product_categories WHERE product_id = ?`,
    [row.product_id],
  );

  const categoryIds = (categoryRows as unknown[]).map(
    (catRow) => (catRow as { category_id: number }).category_id,
  );

  let relatedProducts: RelatedProduct[] = [];

  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map(() => "?").join(",");
    const [relatedRows] = await pool.query(
      `SELECT DISTINCT 
          p.product_id, 
          p.product_name, 
          p.product_slug, 
          p.price, 
          p.discount_price, 
          p.stock_quantity, 
          p.product_type,
          CASE 
            WHEN p.product_type = 'variable' 
            THEN COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.product_id), 0)
            ELSE p.stock_quantity
          END as effective_stock
       FROM products p
       JOIN product_categories pc ON p.product_id = pc.product_id
       WHERE p.shop_id = ? 
         AND p.product_id != ?
         AND pc.category_id IN (${placeholders})
         AND p.status = 'published'
       ORDER BY RAND()
       LIMIT 6`,
      [shopId, row.product_id, ...categoryIds],
    );
    relatedProducts = relatedRows as RelatedProduct[];
  }

  if (relatedProducts.length < 6) {
    const needed = 6 - relatedProducts.length;
    const excludeIds = [
      row.product_id,
      ...relatedProducts.map((p) => p.product_id),
    ];
    const excludePlaceholders = excludeIds.map(() => "?").join(",");
    const [randomRows] = await pool.query(
      `SELECT 
          product_id, 
          product_name, 
          product_slug, 
          price, 
          discount_price, 
          stock_quantity, 
          product_type,
          CASE 
            WHEN product_type = 'variable' 
            THEN COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = products.product_id), 0)
            ELSE stock_quantity
          END as effective_stock
       FROM products
       WHERE shop_id = ? 
         AND product_id NOT IN (${excludePlaceholders})
         AND status = 'published'
       ORDER BY RAND()
       LIMIT ?`,
      [shopId, ...excludeIds, needed],
    );
    relatedProducts = [...relatedProducts, ...(randomRows as RelatedProduct[])];
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialWishlistStatus = false;
  let isShopOwner = false;

  if (user) {
    const [userRows] = await pool.query(
      "SELECT user_id, role FROM users WHERE supabase_uid = ?",
      [user.id],
    );
    if (userRows && (userRows as unknown[]).length) {
      const userId = (userRows as unknown[])[0] as {
        user_id: number;
        role: string;
      };
      isShopOwner = userId.role === "shop_owner";

      const [wishlistRows] = await pool.query(
        "SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?",
        [userId.user_id, product.product_id],
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
              images={images.map((img) => ({
                id: img.image_id,
                path: img.image_path,
                is_primary: img.is_primary,
              }))}
              productId={product.product_id}
              secondaryColor={secondaryColor}
            />
          </div>
          <div className="lg:w-[50%] lg:overflow-y-auto lg:pr-2">
            <ProductWrapper
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

      <MobileProductWrapper
        product={product}
        secondaryColor={secondaryColor}
        
      />
      <TrackProductAnalytics productId={product.product_id} />
      <TrackProductView product={product} />
    </>
  );
}