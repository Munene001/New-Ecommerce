// app/api/shops/shop-slugs/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

let cachedSlugs: string[] | null = null;
let lastFetch = 0;
const TTL = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedSlugs && now - lastFetch < TTL) {
    return NextResponse.json({ slugs: cachedSlugs });
  }
  const [rows] = await pool.query<RowDataPacket[]>('SELECT shop_slug FROM shops');
  cachedSlugs = rows.map(row => row.shop_slug);
  lastFetch = now;
  return NextResponse.json({ slugs: cachedSlugs });
}

export async function POST() {
  cachedSlugs = null;
  lastFetch = 0;
  return NextResponse.json({ success: true });
}