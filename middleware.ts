import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const actionHeader = request.headers.get('next-action');
  if (actionHeader && actionHeader.length < 10) {
    return new NextResponse('Forbidden', { status: 403 });
  }
}