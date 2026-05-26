import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface VerifyBody {
  email: string;
  code?: string;
  business_name?: string;
  resend?: boolean;
  userType?: 'shop_owner' | 'customer';
  redirect?: string;
}

export async function POST(request: NextRequest) {
  const body: VerifyBody = await request.json();

  try {
    const supabase = await createSupabaseServerClient();

    if (body.resend) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: body.email,
      });
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        message: 'Verification code resent successfully'
      });
    }

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'Verification code required' },
        { status: 400 }
      );
    }
    
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.code,
      type: 'signup'
    });

    if (verifyError) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const user = verifyData.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = body.userType || 'shop_owner';
    let conn;
    
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      if (userType === 'shop_owner') {
        // 1. Derive full_name from email
        let fullName = body.email.split('@')[0];
        fullName = fullName.replace(/\./g, ' ');
        fullName = fullName.replace(/\b\w/g, (c) => c.toUpperCase());
        
        // 2. Placeholder for phone
        const phone = '0712345678';
        
        // 3. Insert into users table
        const [userResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'shop_owner')`,
          [user.id, fullName, body.email, phone]
        );
        
        const userId = userResult.insertId;
        
        // 4. Generate clean slug from business_name
        let slug = body.business_name!
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // 5. Check for slug uniqueness
        const [existingSlugs] = await conn.query<RowDataPacket[]>(
          `SELECT business_slug FROM tenant WHERE business_slug = ? OR business_slug LIKE ?`,
          [slug, `${slug}-%`]
        );
        
        if (existingSlugs.length > 0) {
          let maxNumber = 0;
          existingSlugs.forEach((row: any) => {
            const match = row.business_slug.match(/-(\d+)$/);
            if (match) {
              const num = parseInt(match[1]);
              if (num > maxNumber) maxNumber = num;
            }
          });
          slug = `${slug}-${maxNumber + 1}`;
        }
        
        // 6. Placeholders for town and address
        const businessTown = 'Not set';
        const businessAddress = 'Not set';
        
        // 7. Insert into tenant table
        await conn.execute(
          `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
           VALUES (?, ?, ?, ?, ?)`,
          [userId, body.business_name, slug, businessTown, businessAddress]
        );

        await conn.commit();

        const response = NextResponse.json({
          success: true,
          message: 'Email verified successfully!',
          userId: userId,
          business_slug: slug
        });
        
        response.headers.set('Set-Cookie', '');
        return response;
      } 
      else {
        // Customer flow
        let fullName = body.email.split('@')[0];
        fullName = fullName.replace(/\./g, ' ');
        fullName = fullName.replace(/\b\w/g, (c) => c.toUpperCase());
        
        await conn.execute<ResultSetHeader>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'customer')`,
          [user.id, fullName, body.email, '0712345678']
        );

        await conn.commit();

        const response = NextResponse.json({
          success: true,
          message: 'Email verified successfully! You can now log in.',
          redirect: body.redirect
        });
        
        response.headers.set('Set-Cookie', '');
        return response;
      }
      
    } catch (dbError) {
      if (conn) await conn.rollback();
      console.error('DB Error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create account records' },
        { status: 500 }
      );
    } finally {
      if (conn) conn.release();
    }

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}