import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/merchant') && !path.startsWith('/merchant/login')) {
    const apiKey = request.cookies.get('merchant_api_key')?.value;
    
    if (!apiKey) {
      return NextResponse.redirect(new URL('/merchant/login', request.url));
    }
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-api-key', apiKey);
    
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/merchant/:path*'],
};