import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for handling authentication and redirects
 * 
 * Note: For auth protection, we rely on the Auth0 SDK's withPageAuthRequired
 * which handles session checking. This middleware only handles redirects
 * and legacy route handling.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Check for authentication cookie to do basic auth check
  // Full auth check is done by Auth0 SDK in the pages
  const hasCookie = request.cookies.has('appSession');
  
  // Check for authentication on protected routes
  if (isProtectedRoute(pathname) && !hasCookie) {
    const loginUrl = new URL('/login', request.url);
    if (search) {
      loginUrl.search = search;
    }
    return NextResponse.redirect(loginUrl);
  }
  
  // Handle legacy route redirects
  
  // 1. Handle dashboard?program=X -> /program/X
  if (pathname === '/dashboard' && search.includes('program=')) {
    const params = new URLSearchParams(search);
    const programId = params.get('program');
    
    if (programId) {
      return NextResponse.redirect(
        new URL(`/program/${encodeURIComponent(programId)}`, request.url)
      );
    }
  }
  
  // 2. Handle /program-dashboard -> /program (will be handled by program/index.js)
  if (pathname === '/program-dashboard') {
    return NextResponse.redirect(
      new URL('/program', request.url)
    );
  }
  
  // 3. Handle /dashboard-shell -> /dashboard
  if (pathname === '/dashboard-shell') {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }
  
  // Continue to the requested page
  return NextResponse.next();
}

/**
 * Check if a route should be protected by authentication
 */
function isProtectedRoute(pathname: string): boolean {
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/api/auth',
    '/api/institution-lookup',
    '/api/user/check-email',
  ];
  
  // API routes related to auth are public
  if (pathname.startsWith('/api/auth/')) {
    return false;
  }
  
  // Check if the route is in the public routes list
  for (const route of publicRoutes) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return false;
    }
  }
  
  // Static files and favicon
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Files with extensions like .ico, .png, etc.
  ) {
    return false;
  }
  
  // All other routes require authentication
  return true;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Run on all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};