import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

/**
 * Next.js Middleware for Auth0 authentication
 * Following Auth0 v4 best practices
 */
export async function middleware(request) {
  // Process Auth0 authentication routes - handles login, callback, logout
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }
  
  const { pathname, search } = request.nextUrl;
  
  // Get hostname from request headers for creating URLs
  const host = request.headers.get('host') || '';
  const baseUrl = `https://${host}`;
  
  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/onboarding'];
  
  // Check if current path should be protected
  const shouldProtect = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (shouldProtect) {
    try {
      // Get Auth0 session using recommended method
      const session = await auth0.getSession(request);
      
      // If no session, redirect to login with return URL
      if (!session) {
        const returnPath = encodeURIComponent(pathname + search);
        return NextResponse.redirect(
          new URL(`/auth/login?returnTo=${returnPath}`, baseUrl)
        );
      }
      
      // Session exists, allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Auth session error:', error);
      
      // On error, redirect to login
      return NextResponse.redirect(
        new URL('/auth/login', baseUrl)
      );
    }
  }

  // For non-protected routes, continue normally
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};