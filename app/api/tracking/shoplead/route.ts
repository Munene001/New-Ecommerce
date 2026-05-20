// /app/api/tracking/shop-lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shop_id, event_type, metadata } = body;
        
        // Minimal validation
        if (!shop_id || !event_type) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        
        let session_id = request.cookies.get('shop_session_id')?.value;
        const isNewSession = !session_id;
        if (!session_id) {
            session_id = randomUUID();
        }
        
        const ip_address = request.headers.get('x-forwarded-for') || null;
        const referrer_url = request.headers.get('referer') || null;
        
        const response = NextResponse.json({ success: true });
        
        if (isNewSession) {
            response.cookies.set('shop_session_id', session_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
                sameSite: 'lax'
            });
        }
        
        // Fire and forget
        (async () => {
            try {
                await pool.query(
                    `INSERT INTO shop_leads 
                     (shop_id, event_type, session_id, ip_address, referrer_url, metadata) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [shop_id, event_type, session_id, ip_address, referrer_url, JSON.stringify(metadata || {})]
                );
            } catch (error) {
                console.error('Insert failed:', error);
            }
        })();
        
        return response;
        
    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}