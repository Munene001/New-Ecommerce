import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/db'

async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, business_name, business_county, business_town, business_address } = await request.json()
    const requestUrl = new URL(request.url)
    const origin = requestUrl.origin

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${origin}/api/auth/shopowner/callback`,
        data: { 
          full_name, 
          phone, 
          business_name,
          business_county,    
          business_town,      
          business_address,
          role: 'shop_owner'
        } 
      }
    })
    
    if (error) throw error
    if (!data.user) throw new Error('No user created')
    
    if (data.user.email_confirmed_at) {
      const connection = await getConnection()
      try {
        const [userResult] = await connection.execute(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'shop_owner')`,
          [data.user.id, full_name, email, phone]
        )
        
        const userId = (userResult as any).insertId

        await connection.execute(
            `INSERT INTO tenant (user_id, business_name, business_slug, business_county, business_town, business_address) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId,
              business_name,
              `${business_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
              business_county,
              business_town,
              business_address
            ]
          )
       
      } finally {
        await connection.end()
      }
      
      return NextResponse.json({
        success: true,
        message: 'Account verified and created!',
        verified: true,
        mysql_saved: true
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Check your email to verify your account.',
      verified: false,
      mysql_saved: false,
      user_id: data.user.id
    })
    
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
}