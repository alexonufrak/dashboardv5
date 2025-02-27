import { getSession } from "@auth0/nextjs-auth0"
import { ManagementClient } from "auth0";

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

