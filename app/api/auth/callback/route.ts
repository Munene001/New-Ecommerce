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

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const redirectParam = requestUrl.searchParams.get('redirect') || ''
  const baseUrl = getBaseUrl(request)
  
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth/login`)
  }
  
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !data.user) {
      console.error('Auth error:', error?.message)
      return NextResponse.redirect(`${baseUrl}/errors/emailverification`)
    }
    
    const user = data.user
    const role = user.user_metadata?.role

    if (role !== 'shop_owner' && role !== 'customer') {
      console.error('Invalid role:', role)
      return NextResponse.redirect(`${baseUrl}/errors/emailverification`)
    }
    
    // Check if user already exists in MySQL
    const [existing] = await pool.execute<ExistingUserRow[]>(
      'SELECT user_id FROM users WHERE supabase_uid = ?',
      [user.id]
    )
    
    if (existing.length > 0) {
      const loginUrl = new URL(`${baseUrl}/auth/login`);
      loginUrl.searchParams.set('verified', 'true');
      if (redirectParam) {
        loginUrl.searchParams.set('redirect', redirectParam);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Handle new user creation based on role
    if (role === 'shop_owner') {
      let conn;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

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
        
        await conn.execute(
          `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
           VALUES (?, ?, ?, ?, ?)`,
          [userId, businessName, slug, user.user_metadata?.business_town || '', user.user_metadata?.business_address || '']
        );

        const [shopRows] = await conn.execute<ShopRow[]>(
          'SELECT shop_id FROM shops WHERE tenant_id = ?',
          [userId]
        );
        
        if (shopRows.length > 0) {
          const shopId = shopRows[0].shop_id;
          
          await conn.execute(
            `INSERT INTO shop_settings 
             (shop_id, primary_color, secondary_color, product_card_style, cart_icon) 
             VALUES (?, '#3B82F6', '#10B981', 'standard', 'cart')`,
            [shopId]
          );
          
          await conn.execute(
            `INSERT INTO shop_banners 
             (shop_id, banner_url, banner_type, start_date, end_date, is_active) 
             VALUES (?, '/assets/banners/default-shop-banner.jpg', 'default', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE)`,
            [shopId]
          );
        }

        await conn.commit();
        
        return NextResponse.redirect(`${baseUrl}/auth/login?verified=true`);
        
      } catch (dbError) {
        if (conn) await conn.rollback();
        console.error('Database error:', dbError);
        return NextResponse.redirect(`${baseUrl}/errors/emailverification`);
      } finally {
        if (conn) conn.release();
      }
    } 
    else {
      let conn;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.execute(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'customer')`,
          [
            user.id,
            user.user_metadata?.full_name || '',
            user.email,
            user.user_metadata?.phone || ''
          ]
        );

        await conn.commit();

        const loginUrl = new URL(`${baseUrl}/auth/login`);
        loginUrl.searchParams.set('verified', 'true');
        if (redirectParam) {
          loginUrl.searchParams.set('redirect', redirectParam);
        }
        return NextResponse.redirect(loginUrl);
        
      } catch (dbError) {
        if (conn) await conn.rollback();
        console.error('Customer insert error:', dbError);
        return NextResponse.redirect(`${baseUrl}/errors/emailverification`);
      } finally {
        if (conn) conn.release();
      }
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${baseUrl}/errors/emailverification`);
  }
}