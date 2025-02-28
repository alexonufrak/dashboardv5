import { getSession } from "@auth0/nextjs-auth0"
import { ManagementClient } from "auth0";

// Create a singleton instance of the Auth0 Management API client
let managementClient = null;

/**
 * Create an Auth0 Management API client
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
async function createManagementClient() {
  try {
    // Get domain from environment variables
    const fullDomain = process.env.AUTH0_ISSUER_BASE_URL || '';
    const domain = fullDomain.includes('https://') 
      ? fullDomain.replace('https://', '') 
      : fullDomain;
    
    if (!domain || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
      throw new Error('Missing required Auth0 environment variables');
    }
    
    // Create the Auth0 Management client
    const client = new ManagementClient({
      domain: domain,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      scope: 'read:users read:user_idp_tokens update:users update:users_app_metadata',
      audience: `https://${domain}/api/v2/`,
      tokenProvider: {
        enableCache: true,
        cacheTTLInSeconds: 3600
      }
    });
    
    return client;
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
}

// Create an auth0 object with properties to export
const auth0 = {
  // Lazily initialize the management client
  get management() {
    return (async () => {
      if (!managementClient) {
        managementClient = await createManagementClient();
      }
      return managementClient;
    })();
  },
  
  /**
   * Get an Auth0 Management API client (for backwards compatibility)
   * @returns {Promise<ManagementClient>} Auth0 Management API client
   */
  auth0ManagementClient: async () => {
    if (!managementClient) {
      managementClient = await createManagementClient();
    }
    return managementClient;
  }
};

export default auth0;

