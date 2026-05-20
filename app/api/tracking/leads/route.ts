import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { event_type } = body;
    
    // Validate required field
    if (!event_type) {
        return NextResponse.json(
            { error: "event_type is required" },
            { status: 400 }
        );
    }
    
    // Get or create session
    let session_id = request.cookies.get('shopowner_session_id')?.value;
    const isNewSession = !session_id;
    if (!session_id) {
        session_id = randomUUID();
    }
    
    // Get IP and referrer from headers
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      null;
    const referrer_url = request.headers.get('referer') || null;
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    // Set session cookie if new
    if (isNewSession) {
        response.cookies.set('shopowner_session_id', session_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            sameSite: 'lax'
        });
    }
    
    // Insert in background (fire and forget)
    (async () => {
        try {
            await pool.query(
                `INSERT INTO shopowner_leads 
                 (event_type, session_id, ip_address, referrer_url, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [event_type, session_id, ip_address, referrer_url]
            );
        } catch (error) {
            console.error('Failed to insert shopowner lead:', error);
        }
    })();
    
    return response;
}