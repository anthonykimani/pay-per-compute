import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect merchant routes
 * Requires merchant_api_key cookie for all /merchant/* routes except /merchant/login and /merchant/register
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // ✅ Public routes that don't require authentication
  const publicMerchantPaths = ['/merchant/login', '/merchant/register'];
  
  // Skip auth check for public routes
  if (publicMerchantPaths.includes(path)) {
    return NextResponse.next();
  }
  
  // ✅ Protect all other merchant routes
  if (path.startsWith('/merchant')) {
    const apiKey = request.cookies.get('merchant_api_key')?.value;
    
    if (!apiKey) {
      return NextResponse.redirect(new URL('/merchant/login', request.url));
    }
    
    // ✅ Inject API key into headers for backend validation
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