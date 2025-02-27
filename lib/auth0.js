import { getSession } from "@auth0/nextjs-auth0"
import { ManagementClient } from "auth0";

/**
 * Create an Auth0 Management API client
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
export async function auth0ManagementClient() {
  try {
    // Get domain from environment variables
    const fullDomain = process.env.AUTH0_ISSUER_BASE_URL || '';
    const domain = fullDomain.includes('https://') 
      ? fullDomain.replace('https://', '') 
      : fullDomain;
    
    console.log(`Auth0 domain: ${domain}`);
    
    if (!domain || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
      throw new Error('Missing required Auth0 environment variables');
    }
    
    // Create the Auth0 Management client
    console.log("Creating Auth0 Management API client");
    const client = new ManagementClient({
      domain: domain,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      scope: 'read:users read:user_idp_tokens',
      audience: `https://${domain}/api/v2/`,
      tokenProvider: {
        enableCache: true,
        cacheTTLInSeconds: 3600
      }
    });
    
    console.log("Auth0 Management API client created successfully");
    return client;
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
}

