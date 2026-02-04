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
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    
    const user = data.user
    
    if (user.user_metadata?.role !== 'shop_owner') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    connection = await getConnection()
    
    const [existing] = await connection.execute(
      'SELECT user_id FROM users WHERE supabase_uid = ?',
      [user.id]
    ) as [any[], any]
    
    if (existing.length > 0) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    await connection.beginTransaction()

    try {
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
      
      await connection.execute(
        `INSERT INTO tenant (user_id, business_name, business_slug, business_county, business_town, business_address) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          businessName,
          slug,
          user.user_metadata?.business_county || '',  // Add these
          user.user_metadata?.business_town || '',    // Add these
          user.user_metadata?.business_address || ''  // Add these
        ]
      )

      await connection.commit()
    } catch (dbError) {
      await connection.rollback()
      throw dbError
    }
    
    return NextResponse.redirect(new URL('/login', request.url))
    
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/login?error=system_failure', request.url))
  } finally {
    if (connection) await connection.end()
  }
}