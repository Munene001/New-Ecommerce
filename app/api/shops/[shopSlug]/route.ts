import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;
  
  
  if (!shopSlug || shopSlug === 'undefined') {
    return NextResponse.json(
      { error: 'Invalid shop slug' }, 
      { status: 400 }
    );
  }
  
  let connection;
  try {
    connection = await getConnection();
    
    // Query shops with left joins to settings and banners
    const query = `
      SELECT 
        -- Shop info
        s.shop_id, 
        s.shop_name,
        s.shop_slug, 
        s.shop_type,
        s.contact_email,
        s.contact_phone,
        
        -- Settings info
        ss.primary_color,
        ss.secondary_color,
        ss.logo_url,
        ss.whatsapp_number,
        ss.header_message,
        ss.product_card_style,
        ss.cart_icon,
        
        -- Banner info (aggregated as JSON array)
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'banner_id', sb.banner_id,
              'banner_url', sb.banner_url,
              'banner_type', sb.banner_type,
              'category_id', sb.category_id,
              'start_date', sb.start_date,
              'end_date', sb.end_date,
              'is_active', sb.is_active
            )
          )
          FROM shop_banners sb
          WHERE sb.shop_id = s.shop_id
            AND sb.is_active = TRUE
            AND sb.start_date <= NOW()
            AND sb.end_date >= NOW()
        ) as active_banners
        
      FROM shops s
      LEFT JOIN shop_settings ss ON s.shop_id = ss.shop_id
      WHERE s.shop_slug = ?
    `;
    
    const [rows] = await connection.query(query, [shopSlug]);
    
    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shop = (rows as any[])[0];
    
    // Parse the JSON string for banners (MySQL returns as string)
    const banners = shop.active_banners ? JSON.parse(shop.active_banners) : [];
    
    // Return complete shop data
    return NextResponse.json({
      shopId: shop.shop_id,
      shopName: shop.shop_name,
      shopSlug: shop.shop_slug,
      shopType: shop.shop_type,
      contactEmail: shop.contact_email,
      contactPhone: shop.contact_phone,
      
      // Settings with defaults
      primaryColor: shop.primary_color || '#3B82F6',
      secondaryColor: shop.secondary_color || '#10B981',
      logoUrl: shop.logo_url,
      whatsappNumber: shop.whatsapp_number,
      headerMessage: shop.header_message,
      productCardStyle: shop.product_card_style || 'standard',
      cartIcon: shop.cart_icon || 'cart',
      
      // Active banners
      banners: banners
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}