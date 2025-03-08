import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for handling redirects
 * This middleware handles redirects from legacy routes to the new URL structure
 */
export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  
  // Legacy routes that need to be redirected
  
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

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Run on these paths
    '/dashboard',
    '/dashboard-shell',
    '/program-dashboard',
  ],
};