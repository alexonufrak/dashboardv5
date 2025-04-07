import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    // Mock response object to capture the redirection
    let redirectUrl;
    const res = {
      redirect: (url) => {
        redirectUrl = url;
        return { end: () => {} };
      },
    };
    
    // Call Auth0 to handle callback
    await auth0.handleCallback(request, res);
    
    // Return the redirect using NextResponse
    return NextResponse.redirect(redirectUrl || '/dashboard');
  } catch (error) {
    console.error('Callback error:', error);
    
    // On error, redirect to login with error message
    const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
    return NextResponse.redirect(
      new URL(`/auth/login?error=${errorMessage}`, request.url)
    );
  }
}