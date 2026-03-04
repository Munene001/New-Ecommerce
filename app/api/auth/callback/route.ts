import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getConnection } from '@/lib/db'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  let connection

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.user) {
      console.error('Auth error:', error?.message)
      return NextResponse.redirect(new URL('/errors/emailverification', request.url))
    }
    
    const user = data.user
    
    if (user.user_metadata?.role !== 'shop_owner') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    connection = await getConnection()
    
    const [existing] = await connection.execute(
      'SELECT user_id FROM users WHERE supabase_uid = ?',
      [user.id]
    ) as [any[], any]
    
    if (existing.length > 0) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    await connection.beginTransaction()

    try {
      // 1. Insert user
      const [userResult] = await connection.execute(
        `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
         VALUES (?, ?, ?, ?, 'shop_owner')`,
        [
          user.id,
          user.user_metadata?.full_name || '',
          user.email,
          user.user_metadata?.phone || ''
        ]
      ) as any
      
      const userId = userResult.insertId
      const businessName = user.user_metadata?.business_name || 'My Business'
      const slug = `${businessName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      
      // 2. Insert tenant
      await connection.execute(
        `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          businessName,
          slug,
          user.user_metadata?.business_town || '',
          user.user_metadata?.business_address || ''
        ]
      )

      // 3. Get the shop_id that was created (assuming a trigger creates it)
      const [shopRows] = await connection.execute(
        'SELECT shop_id FROM shops WHERE tenant_id = ?',
        [userId]
      ) as [any[], any]
      
      if (shopRows.length > 0) {
        const shopId = shopRows[0].shop_id
        
        // 4. Insert default shop settings
        await connection.execute(
          `INSERT INTO shop_settings 
           (shop_id, primary_color, secondary_color, product_card_style, cart_icon) 
           VALUES (?, '#3B82F6', '#10B981', 'standard', 'cart')`,
          [shopId]
        )
        
        // 5. Insert default banner (links to all discounted products)
        await connection.execute(
          `INSERT INTO shop_banners 
           (shop_id, banner_url, banner_type, start_date, end_date, is_active) 
           VALUES (?, '/assets/banners/default-shop-banner.jpg', 'default', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE)`,
          [shopId]
        )
      }

      await connection.commit()
      
      return NextResponse.redirect(new URL('/auth/login?verified=true', request.url))
      
    } catch (dbError) {
      await connection.rollback()
      console.error('Database error:', dbError)
      return NextResponse.redirect(new URL('/errors/emailverification', request.url))
    }
    
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/errors/emailverification', request.url))
  } finally {
    if (connection) await connection.end()
  }
}