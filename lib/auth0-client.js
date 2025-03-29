// Auth0 Management API utilities
import { getSession } from '@auth0/nextjs-auth0';

// Cache for the Auth0 token
let cachedToken = null;
let tokenExpiration = 0;

// Get application base URL for Auth0
const appBaseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';
console.log('Auth0 appBaseUrl:', appBaseUrl);

// Configure Auth0 with SDK V3 requires
export const auth0Config = {
  baseURL: appBaseUrl,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  authorizationParams: {
    scope: 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  },
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
  },
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours
  },
};

// Export helper functions for the Management API
export const getManagementClient = async () => {
  try {
    // For v3, we need to dynamically import the ManagementClient
    const { ManagementClient } = await import('auth0');
    
    // Check if we have a cached token that hasn't expired
    const now = Date.now();
    if (cachedToken && tokenExpiration > now) {
      console.log('Using cached Auth0 token');
      
      // Create and return the Management Client with cached token
      return new ManagementClient({
        domain: process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, ''),
        token: cachedToken
      });
    }
    
    // Get domain and credentials
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    
    if (!domain || !clientId || !clientSecret) {
      throw new Error('Missing required Auth0 environment variables');
    }
    
    // Get token using client credentials grant
    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData || !tokenData.access_token) {
      throw new Error('Failed to get Auth0 token');
    }
    
    // Cache the token
    cachedToken = tokenData.access_token;
    if (tokenData.expires_in) {
      tokenExpiration = now + (tokenData.expires_in * 1000) - (5 * 60 * 1000);
    }
    
    // Create and return the Management Client
    return new ManagementClient({
      domain,
      token: tokenData.access_token
    });
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
};