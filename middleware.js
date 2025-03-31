import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

/**
 * Next.js Middleware for handling redirects and authentication
 * 
 * This middleware:
 * 1. Mounts Auth0 authentication routes (/auth/*)
 * 2. Handles redirects from legacy routes to the new URL structure
 * 3. Protects routes requiring authentication
 */
export async function middleware(request) {
  // Helper function to get base URL with appropriate protocol
  const getBaseUrl = () => {
    // Get hostname from request headers
    const host = request.headers.get('host') || '';
    
    // Always use HTTPS for consistency with secure cookies
    return `https://${host}`;
  };

  const { pathname, search } = request.nextUrl;
  
  // Process Auth0 authentication routes
  // This is the Auth0 v4 middleware that handles login, logout, callback, etc.
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }
  
  // Handle legacy URL redirects
  
  // 1. Handle dashboard?program=X -> /dashboard/programs/X
  if (pathname === '/dashboard' && search.includes('program=')) {
    const params = new URLSearchParams(search);
    const programId = params.get('program');
    
    if (programId) {
      return NextResponse.redirect(
        new URL(`/dashboard/programs/${encodeURIComponent(programId)}`, getBaseUrl())
      );
    }
  }
  
  // 2. Handle /program-dashboard -> /dashboard/programs
  if (pathname === '/program-dashboard') {
    return NextResponse.redirect(
      new URL('/dashboard/programs', getBaseUrl())
    );
  }
  
  // 3. Handle /dashboard-shell -> /dashboard
  if (pathname === '/dashboard-shell') {
    return NextResponse.redirect(
      new URL('/dashboard', getBaseUrl())
    );
  }
  
  // 4. Handle /program/[id] -> /dashboard/programs/[id]
  if (pathname.startsWith('/program/') && !pathname.startsWith('/program-dashboard')) {
    const programPath = pathname.replace('/program/', '');
    
    return NextResponse.redirect(
      new URL(`/dashboard/programs/${programPath}${search}`, getBaseUrl())
    );
  }
  
  // 5. Handle /dashboard/program/[id] -> /dashboard/programs/[id]
  if (pathname.startsWith('/dashboard/program/')) {
    const programPath = pathname.replace('/dashboard/program/', '');
    
    return NextResponse.redirect(
      new URL(`/dashboard/programs/${programPath}${search}`, getBaseUrl())
    );
  }
  
  // For protected routes, check authenticated session
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/program') || 
      pathname === '/onboarding' || 
      pathname === '/profile') {
    
    try {
      // Get Auth0 session - in v4 this works in middleware
      const session = await auth0.getSession(request);
      
      // If no session, redirect to login
      if (!session) {
        // Use the Auth0 login endpoint with returnTo query parameter
        const returnPath = encodeURIComponent(pathname + search);
        return NextResponse.redirect(
          new URL(`/auth/login?returnTo=${returnPath}`, getBaseUrl())
        );
      }
      
      // Session exists, allow access to the protected route
      return NextResponse.next();
    } catch (error) {
      console.error('Error in middleware auth check:', error);
      // On error, redirect to login as a fallback
      return NextResponse.redirect(
        new URL('/auth/login', getBaseUrl())
      );
    }
  }

  // For all other routes, continue the request
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
  
  // Remove unstable_allowDynamic as it's not supported in middleware config
  // We'll handle this in next.config.mjs instead
};