import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

interface ExistingUserRow extends RowDataPacket {
  user_id: number;
}

interface UserInsertResult extends ResultSetHeader {
  insertId: number;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectParam = requestUrl.searchParams.get('redirect') || ''
  
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.user) {
      console.error('Auth error:', error?.message)
      return NextResponse.redirect(new URL('/errors/emailverification', request.url))
    }
    
    const user = data.user
    const role = user.user_metadata?.role

    // Only allow known roles
    if (role !== 'shop_owner' && role !== 'customer') {
      console.error('Invalid role:', role)
      return NextResponse.redirect(new URL('/errors/emailverification', request.url))
    }
    
    // Check if user already exists in MySQL
    const [existing] = await pool.execute<ExistingUserRow[]>(
      'SELECT user_id FROM users WHERE supabase_uid = ?',
      [user.id]
    )
    
    if (existing.length > 0) {
      // ✅ User already registered – redirect to login with verified flag
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('verified', 'true');
      if (redirectParam) {
        loginUrl.searchParams.set('redirect', redirectParam);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Handle based on role
    if (role === 'shop_owner') {
      // --- Shop owner flow – use a transaction with a dedicated connection ---
      let conn;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Insert user
        const [userResult] = await conn.execute<UserInsertResult>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'shop_owner')`,
          [
            user.id,
            user.user_metadata?.full_name || '',
            user.email,
            user.user_metadata?.phone || ''
          ]
        );
        
        const userId = userResult.insertId;
        const businessName = user.user_metadata?.business_name || 'My Business';
        const slug = `${businessName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        
        // 2. Insert tenant
        await conn.execute(
          `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            businessName,
            slug,
            user.user_metadata?.business_town || '',
            user.user_metadata?.business_address || ''
          ]
        );

        // 3. Get the shop_id that was created (assuming a trigger creates it)
        const [shopRows] = await conn.execute<ShopRow[]>(
          'SELECT shop_id FROM shops WHERE tenant_id = ?',
          [userId]
        );
        
        if (shopRows.length > 0) {
          const shopId = shopRows[0].shop_id;
          
          // 4. Insert default shop settings
          await conn.execute(
            `INSERT INTO shop_settings 
             (shop_id, primary_color, secondary_color, product_card_style, cart_icon) 
             VALUES (?, '#3B82F6', '#10B981', 'standard', 'cart')`,
            [shopId]
          );
          
          // 5. Insert default banner
          await conn.execute(
            `INSERT INTO shop_banners 
             (shop_id, banner_url, banner_type, start_date, end_date, is_active) 
             VALUES (?, '/assets/banners/default-shop-banner.jpg', 'default', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE)`,
            [shopId]
          );
        }

        await conn.commit();
        
        return NextResponse.redirect(new URL('/auth/login?verified=true', request.url));
        
      } catch (dbError) {
        if (conn) await conn.rollback();
        console.error('Database error:', dbError);
        return NextResponse.redirect(new URL('/errors/emailverification', request.url));
      } finally {
        if (conn) conn.release();
      }
    } 
    else { // role === 'customer'
      // --- Customer flow – simple insert, no transaction needed ---
      try {
        await pool.execute(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'customer')`,
          [
            user.id,
            user.user_metadata?.full_name || '',
            user.email,
            user.user_metadata?.phone || ''
          ]
        );

        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('verified', 'true');
        if (redirectParam) {
          loginUrl.searchParams.set('redirect', redirectParam);
        }
        return NextResponse.redirect(loginUrl);
      } catch (dbError) {
        console.error('Customer insert error:', dbError);
        return NextResponse.redirect(new URL('/errors/emailverification', request.url));
      }
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/errors/emailverification', request.url));
  }
}