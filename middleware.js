import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

/**
 * Next.js Middleware for App Router Migration
 * 
 * This middleware:
 * 1. Handles Auth0 authentication
 * 2. Routes requests to the App Router
 * 3. Protects routes that require authentication
 * 4. Enables feature flag for App Router
 */
export async function middleware(request) {
  // Process Auth0 authentication routes - handles login, callback, logout
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }
  
  const url = request.nextUrl;
  const { pathname, search } = url;
  const host = request.headers.get('host') || '';
  const baseUrl = `https://${host}`;
  
  // Check if the App Router feature flag is enabled (via query param or cookie)
  const useAppRouter = url.searchParams.get('useAppRouter') === 'true' || 
                      request.cookies.get('useAppRouter')?.value === 'true';
  
  // Only allow static assets and api routes from the Pages Router
  // Everything else should be handled by the App Router
  const isPagesApiRoute = pathname.startsWith('/api/');
  const isStaticAsset = pathname.startsWith('/_next/') || 
                       pathname.includes('/public/') ||
                       pathname === '/favicon.ico' ||
                       pathname === '/sitemap.xml' ||
                       pathname === '/robots.txt';
  
  // If this is a Pages Router page (not an API or static asset), redirect to App Router
  const isPagesRoute = pathname.startsWith('/pages/') || 
                      (pathname.includes('.') && !isStaticAsset && !isPagesApiRoute);
  
  if (isPagesRoute) {
    // Convert pages route to app route
    // For example: /pages/about -> /about
    const appRoute = pathname.replace('/pages/', '/');
    return NextResponse.redirect(new URL(appRoute + search, baseUrl));
  }
  
  // Add App Router header for feature-flagged routes if enabled
  if (useAppRouter) {
    // Add header for main app routes that have both Pages and App Router implementations
    const appRouterCapableRoutes = ['/dashboard', '/profile', '/'];
    const isAppRouterCapable = appRouterCapableRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isAppRouterCapable) {
      // Clone request headers and add App Router feature flag
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-use-app-router', 'true');
      
      // Create new request with modified headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
      // Set cookie if it was enabled via query param
      if (url.searchParams.get('useAppRouter') === 'true' && 
          !request.cookies.get('useAppRouter')) {
        response.cookies.set('useAppRouter', 'true', { 
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
      }
      
      return response;
    }
  }
  
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