import { initAuth0 } from "@auth0/nextjs-auth0"
import { ManagementClient } from "auth0";

export default initAuth0({
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  clockTolerance: 60,
  httpTimeout: 5000,
  authorizationParams: {
    scope: "openid profile email",
  },
  routes: {
    callback: "/api/auth/callback",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours in seconds
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days in seconds
  },
})

/**
 * Create an Auth0 Management API client
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
export async function auth0ManagementClient() {
  // Extract domain from the issuer URL (remove https:// if present)
  const fullDomain = process.env.AUTH0_ISSUER_BASE_URL || '';
  const domain = fullDomain.includes('https://') 
    ? fullDomain.replace('https://', '') 
    : fullDomain;
  
  if (!domain || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
    throw new Error('Missing required Auth0 environment variables');
  }
  
  try {
    // Create management client with client credentials grant
    return new ManagementClient({
      domain: domain,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      scope: 'read:users',
      audience: `https://${domain}/api/v2/`,
      tokenProvider: {
        enableCache: true,
        cacheTTLInSeconds: 3600
      }
    });
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
}

