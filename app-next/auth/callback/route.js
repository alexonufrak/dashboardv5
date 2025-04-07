import { auth0 } from '@/lib/auth0';

/**
 * Auth Callback Route Handler
 * Processes Auth0 callback after login
 */
export async function GET(request) {
  try {
    // Create response object to capture Auth0 redirect
    let redirectUrl;
    const res = {
      redirect: (url) => {
        redirectUrl = url;
        return { end: () => {} };
      },
    };
    
    // Handle callback
    await auth0.handleCallback(request, res);
    
    // Return redirect to dashboard
    return Response.redirect(redirectUrl || '/dashboard');
  } catch (error) {
    console.error('Auth0 callback error:', error);
    return Response.redirect('/auth/login?error=callback');
  }
}

export const dynamic = 'force-dynamic';