/**
 * Auth0 utilities for App Router
 * This file provides helper functions for working with Auth0 in the App Router
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth0 } from './auth0'

/**
 * Gets the Auth0 session for the current request
 * To be used in Server Components and Route Handlers
 */
export async function getServerSession() {
  // Get the cookie store
  const cookieStore = cookies()
  
  // Create a mock request object with the appSession cookie
  const req = {
    headers: {
      cookie: cookieStore.toString()
    }
  }
  
  // Empty response object
  const res = {}
  
  try {
    // Get session using the auth0 client
    const session = await auth0.getSession(req, res)
    return session
  } catch (error) {
    console.error('Error getting Auth0 session in Server Component:', error)
    return null
  }
}

/**
 * Checks if the user is authenticated, redirects if not
 * To be used in Server Components and Route Handlers
 */
export async function requireAuth(redirectTo = '/auth/login') {
  const session = await getServerSession()
  
  if (!session) {
    // If there's no session, redirect to login
    const returnPath = encodeURIComponent(redirectTo)
    redirect(`/auth/login?returnTo=${returnPath}`)
  }
  
  return session
}

/**
 * Gets the current user from the Auth0 session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession()
  return session?.user || null
}

/**
 * Updates the user's Auth0 session
 * To be used in Route Handlers
 */
export async function updateSession(request, updatedSession) {
  try {
    return await auth0.updateSession(request, updatedSession)
  } catch (error) {
    console.error('Error updating Auth0 session:', error)
    throw error
  }
}

/**
 * Utility for server actions to verify authentication
 * Returns the user object if authenticated, null otherwise
 */
export async function auth() {
  return await getServerSession();
}

/**
 * Utility for server components to get user profile with Auth0 authentication
 * Includes error handling and automatic login redirect
 */
export async function getUserProfile() {
  try {
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Get the user profile using the existing userProfile util
    const { getCompleteUserProfile } = await import('@/lib/userProfile.refactored');
    const userProfile = await getCompleteUserProfile(user);
    
    return userProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Creates Auth handlers for App Router
 * Use in route.js files
 */
export function createAuthRouteHandlers() {
  // Login handler
  async function handleLogin(request) {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/dashboard';
    
    try {
      // Create a mock response object to capture the redirect
      let redirectUrl;
      const res = {
        redirect: (url) => {
          redirectUrl = url;
          return { end: () => {} };
        },
      };
      
      // Call Auth0 login handler
      await auth0.handleLogin(request, res, {
        returnTo
      });
      
      // Return the redirect
      return Response.redirect(redirectUrl);
    } catch (error) {
      console.error('Login error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  
  // Logout handler
  async function handleLogout(request) {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get('returnTo') || '/';
    
    try {
      // Create a mock response object to capture the redirect
      let redirectUrl;
      const res = {
        redirect: (url) => {
          redirectUrl = url;
          return { end: () => {} };
        },
      };
      
      // Call Auth0 logout handler
      await auth0.handleLogout(request, res, {
        returnTo
      });
      
      // Return the redirect
      return Response.redirect(redirectUrl);
    } catch (error) {
      console.error('Logout error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  
  return { handleLogin, handleLogout };
}