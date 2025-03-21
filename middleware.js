import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

/**
 * Next.js Middleware for handling redirects
 * This middleware handles redirects from legacy routes to the new URL structure
 * and redirects users to onboarding page if needed
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  
  // Legacy routes that need to be redirected
  
  // 1. Handle dashboard?program=X -> /dashboard/programs/X
  if (pathname === '/dashboard' && search.includes('program=')) {
    const params = new URLSearchParams(search);
    const programId = params.get('program');
    
    if (programId) {
      return NextResponse.redirect(
        new URL(`/dashboard/programs/${encodeURIComponent(programId)}`, request.url)
      );
    }
  }
  
  // 2. Handle /program-dashboard -> /dashboard/programs
  if (pathname === '/program-dashboard') {
    return NextResponse.redirect(
      new URL('/dashboard/programs', request.url)
    );
  }
  
  // 3. Handle /dashboard-shell -> /dashboard
  if (pathname === '/dashboard-shell') {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }
  
  // 4. Handle /program/[id] -> /dashboard/programs/[id]
  if (pathname.startsWith('/program/') && !pathname.startsWith('/program-dashboard')) {
    const programPath = pathname.replace('/program/', '');
    return NextResponse.redirect(
      new URL(`/dashboard/programs/${programPath}${search}`, request.url)
    );
  }
  
  // 5. Handle /dashboard/program/[id] -> /dashboard/programs/[id]
  if (pathname.startsWith('/dashboard/program/')) {
    const programPath = pathname.replace('/dashboard/program/', '');
    return NextResponse.redirect(
      new URL(`/dashboard/programs/${programPath}${search}`, request.url)
    );
  }
  
  // 6. Onboarding check moved to client-side to avoid auth0 edge compatibility issues
  // We'll handle onboarding check in _app.js or a layout component instead
  
  // Continue to the requested page
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Run on these paths
    '/dashboard',
    '/dashboard-shell',
    '/program-dashboard',
    '/program/:path*', // Legacy program routes
    '/dashboard/program/:path*', // Old dashboard program routes that should redirect to programs
  ],
};