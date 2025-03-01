import { getSession } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";

// Cache for the Management API client instance
let managementClientInstance = null;

/**
 * Create a new Auth0 Management API client
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
async function createManagementClient() {
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
}

/**
 * Get a cached or new instance of the Management API client
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
const getManagementClient = async () => {
  if (!managementClientInstance) {
    try {
      managementClientInstance = await createManagementClient();
    } catch (error) {
      console.error('Error creating Auth0 Management client:', error);
      throw error;
    }
  }
  return managementClientInstance;
};

// Directly export the Management API functions
export default {
  /**
   * Get user details from Auth0
   * @param {Object} params - User lookup parameters (e.g. {id: 'user_id'})
   * @returns {Promise<Object>} User data from Auth0
   */
  getUser: async (params) => {
    const client = await getManagementClient();
    return client.users.get(params);
  },
  
  /**
   * Update user metadata in Auth0
   * @param {Object} params - User lookup parameters (e.g. {id: 'user_id'})
   * @param {Object} metadata - The metadata to update
   * @returns {Promise<Object>} Updated user data
   */
  updateUserMetadata: async (params, metadata) => {
    const client = await getManagementClient();
    return client.users.updateUserMetadata(params, metadata);
  }
};

