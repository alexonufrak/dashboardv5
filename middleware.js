import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

/**
 * Next.js Middleware for handling redirects
 * This middleware handles redirects from legacy routes to the new URL structure
 * and redirects users to onboarding page if needed
 */
export async function middleware(request) {
  // First, get the Auth0 response to handle auth routes and session management
  const authResponse = await auth0.middleware(request);
  
  /**
   * Simple helper function to ensure URLs always have a protocol
   * Simplified since we know the specific issue was with protocol handling
   */
  const getBaseUrl = () => {
    // Get hostname from request headers
    const host = request.headers.get('host') || '';
    
    // Add correct protocol based on environment
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  };
  
  const { pathname, search } = request.nextUrl;
  
  // If path starts with /auth, let the auth middleware handle it
  if (pathname.startsWith('/auth')) {
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
  
  // For protected routes, can check session and redirect to login if needed
  // Uncomment and modify as needed
  /*
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/program') || pathname === '/onboarding' || pathname === '/profile') {
    const session = await auth0.getSession(request);
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login?returnTo=' + encodeURIComponent(pathname), getBaseUrl()));
    }
  }
  */
  
  // Return the auth response to ensure cookies are handled correctly
  return authResponse;
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
};