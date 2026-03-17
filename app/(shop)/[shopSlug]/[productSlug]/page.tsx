import { getConnection } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductGallery from './components/productGallery';
import ProductSidebar from './components/productSideBar';
import ProductTabs from './components/productTabs';
import RecentlyViewed from './components/recentlyViewed';
import MobileProductBar from './components/mobileProductBar'; // new
import PageBar from '@/app/components/layout/pageBar';

interface PageProps {
  params: Promise<{
    shopSlug: string;
    productSlug: string;
  }>;
}

type ProductAttributes = Record<string, string | number | boolean | null | object>;

export default async function ProductPage({ params }: PageProps) {
  const { shopSlug, productSlug } = await params;
  const connection = await getConnection();

  try {
    // 1. Fetch shop data (includes secondaryColor and shopType)
    const shopApiUrl = new URL(`/api/shops/${shopSlug}`, process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const shopRes = await fetch(shopApiUrl.toString(), { next: { revalidate: 60 } });
    if (!shopRes.ok) notFound();
    const shopData = await shopRes.json();
    const shopId = shopData.shopId;
    const secondaryColor = shopData.secondaryColor || '#000000';

    // 2. Fetch product
    const [productRows] = await connection.query(
      `SELECT 
          p.product_id,
          p.product_name,
          p.description,
          p.price,
          p.discount_price,
          p.in_stock,
          p.attributes
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
      parsedAttributes = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    const product = {
      product_id: productData.product_id,
      product_name: productData.product_name,
      description: productData.description,
      price: productData.price,
      discount_price: productData.discount_price,
      in_stock: productData.in_stock,
      attributes: parsedAttributes,
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
          {/* Main content with fixed height on large screens */}
          <div className="flex flex-col lg:flex-row gap-6 lg:h-[75vh]">
            {/* Gallery – stays fixed, no scroll */}
            <div className="lg:w-[38%]">
              <ProductGallery 
                images={images} 
                productId={product.product_id} 
                secondaryColor={secondaryColor}
              />
            </div>

            {/* Sidebar – scrollable if content overflows */}
            <div className="lg:w-[50%] lg:overflow-y-auto lg:pr-2">
              <ProductSidebar 
                product={product} 
                secondaryColor={secondaryColor}
              />
            </div>

            {/* Recently Viewed – also scrollable if needed */}
            <div className="lg:w-[12%] lg:overflow-y-auto">
              <RecentlyViewed 
                currentProductId={product.product_id} 
                secondaryColor={secondaryColor}
              />
            </div>
          </div>

          {/* Tabs below */}
          <div className="mt-12">
            <ProductTabs
              description={product.description}
              attributes={product.attributes}
              reviews={reviews}
              secondaryColor={secondaryColor}
            />
          </div>
        </div>

        {/* Mobile fixed bottom bar for quantity & Add to Cart */}
        <MobileProductBar 
          productId={product.product_id} 
          secondaryColor={secondaryColor} 
        />
      </>
    );
  } catch (error) {
    console.error('Product page error:', error);
    return <div className="p-5 text-red-500">An error occurred while loading the product.</div>;
  } finally {
    await connection.end();
  }
}