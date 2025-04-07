/**
 * App Router API Route Helper
 * 
 * Helper utilities for creating API routes in the App Router
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * Gets the Auth0 session for use in API route handlers
 */
export async function getApiSession(request) {
  // Get the cookie store
  const cookieStore = cookies();
  
  // Create a mock request object with the cookies
  const req = {
    headers: {
      cookie: cookieStore.toString()
    }
  };
  
  try {
    // Get session using the auth0 client
    const session = await auth0.getSession(req, {});
    return session;
  } catch (error) {
    console.error('Error getting Auth0 session in API Route:', error);
    return null;
  }
}

/**
 * Protect an API route with authentication
 * Automatically returns unauthorized if no session exists
 * 
 * @param {Function} handler - The route handler function
 * @returns {Function} - Protected route handler
 */
export function withAuth(handler) {
  return async function protectedRouteHandler(request, context) {
    try {
      // Get the Auth0 session
      const session = await getApiSession(request);
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Call the handler with the session
      return handler(request, { ...context, session });
    } catch (error) {
      console.error('API authentication error:', error);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }
  };
}

/**
 * Helper to create a JSON response
 */
export function json(data, options = {}) {
  return NextResponse.json(data, options);
}