import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for handling redirects
 * This middleware handles redirects from legacy routes to the new URL structure
 * and redirects users to onboarding page if needed
 */
export async function middleware(request) {
  // Helper function to get base URL with appropriate protocol
  const getBaseUrl = () => {
    // Get hostname from request headers
    const host = request.headers.get('host') || '';
    
    // Add correct protocol based on environment
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  };

  const { pathname, search } = request.nextUrl;

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
  // Note: In Auth0 v3, we need to handle authentication checks ourselves
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/program') || 
      pathname === '/onboarding' || 
      pathname === '/profile') {
    
    try {
      // Try to get the session, but don't throw on error
      // In v3, the getSession function is handled directly in API routes, not middleware
      // So we can't use it here, but we also don't need to since Auth0 v3 handles this differently
      // For v3, we'll handle authentication in the pages with getServerSideProps or API routes
      
      // We'll let the page's getServerSideProps handle auth checks via withPageAuthRequired
      return NextResponse.next();
    } catch (error) {
      console.error('Error in middleware:', error);
      // On error, just continue to the page
      // Auth0 v3 will handle authentication at the page level
      return NextResponse.next();
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
};