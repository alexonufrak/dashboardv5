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
  
  // 1. Handle dashboard?program=X -> /dashboard/program/X
  if (pathname === '/dashboard' && search.includes('program=')) {
    const params = new URLSearchParams(search);
    const programId = params.get('program');
    
    if (programId) {
      return NextResponse.redirect(
        new URL(`/dashboard/program/${encodeURIComponent(programId)}`, request.url)
      );
    }
  }
  
  // 2. Handle /program-dashboard -> /dashboard/program
  if (pathname === '/program-dashboard') {
    return NextResponse.redirect(
      new URL('/dashboard/program', request.url)
    );
  }
  
  // 3. Handle /dashboard-shell -> /dashboard
  if (pathname === '/dashboard-shell') {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }
  
  // 4. Handle /program/[id] -> /dashboard/program/[id]
  if (pathname.startsWith('/program/') && !pathname.startsWith('/program-dashboard')) {
    const programPath = pathname.replace('/program/', '');
    return NextResponse.redirect(
      new URL(`/dashboard/program/${programPath}${search}`, request.url)
    );
  }
  
  // 4. Check if user should be redirected to onboarding
  // Skip this check for the onboarding page itself and API routes
  if (pathname === '/dashboard' && !pathname.startsWith('/api') && pathname !== '/onboarding') {
    try {
      // Get the session
      const session = await getSession(request);
      
      if (session && session.user) {
        // Make an API call to check onboarding status
        const onboardingCheckResponse = await fetch(
          new URL('/api/user/onboarding-completed', request.url),
          { headers: { cookie: request.headers.get('cookie') || '' } }
        );
        
        if (onboardingCheckResponse.ok) {
          const onboardingStatus = await onboardingCheckResponse.json();
          
          // If onboarding is not completed, redirect to onboarding page
          if (!onboardingStatus.completed) {
            return NextResponse.redirect(
              new URL('/onboarding', request.url)
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status in middleware:', error);
      // Continue to the dashboard on error (fail open)
    }
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
    '/program/:path*', // Add this to handle any program route
  ],
};