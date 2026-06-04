import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Block requests with suspiciously short 'next-action' header
  const actionHeader = request.headers.get('next-action') || request.headers.get('x-nextjs-action');
  
  if (actionHeader && actionHeader.length < 10) {
    console.warn(`Blocked malicious action header: ${actionHeader}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  return NextResponse.next();
}