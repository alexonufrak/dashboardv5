import { getSession } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";

// Cache for the Management API client instance
let managementClientInstance = null;

/**
 * Create a new Auth0 Management API client
 * This uses separate environment variables from the authentication client
 * to avoid conflicts and ensure proper API access.
 * 
 * Required environment variables:
 * - AUTH0_MGMT_API_DOMAIN: Your Auth0 tenant domain without https:// (e.g. 'your-tenant.auth0.com')
 * - AUTH0_MGMT_API_CLIENT_ID: Client ID for a Machine-to-Machine application with Management API access
 * - AUTH0_MGMT_API_CLIENT_SECRET: Client secret for the M2M application
 * 
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
async function createManagementClient() {
  // Use dedicated Management API environment variables
  // Fall back to regular Auth0 vars if not available (for backward compatibility)
  const domain = process.env.AUTH0_MGMT_API_DOMAIN || 
    (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
  
  const clientId = process.env.AUTH0_MGMT_API_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGMT_API_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;
  
  if (!domain || !clientId || !clientSecret) {
    throw new Error('Missing required Auth0 Management API environment variables');
  }
  
  console.log(`Creating Auth0 Management client for domain: ${domain}`);
  
  // Create the Auth0 Management client
  const client = new ManagementClient({
    domain: domain,
    clientId: clientId,
    clientSecret: clientSecret,
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
   * Check if a user exists in Auth0 by email
   * @param {string} email - User email to check
   * @returns {Promise<boolean>} True if user exists in Auth0, false otherwise
   */
  checkUserExistsByEmail: async (email) => {
    try {
      const client = await getManagementClient();
      
      // Search for users with the provided email
      const users = await client.users.getAll({
        q: `email:"${email}"`,
        search_engine: 'v3'
      });
      
      // Return true if at least one user was found
      return Array.isArray(users) && users.length > 0;
    } catch (error) {
      console.error('Error checking user existence in Auth0:', error);
      // In case of error, return false to allow signup process to continue
      return false;
    }
  },
  
  /**
   * Update user metadata in Auth0
   * @param {Object} params - User lookup parameters (e.g. {id: 'user_id'})
   * @param {Object} metadata - The metadata to update
   * @returns {Promise<Object>} Updated user data
   */
  updateUserMetadata: async (params, metadata) => {
    const client = await getManagementClient();
    
    // According to Auth0 Node.js SDK v4 documentation, the method to update user_metadata
    // is part of the patch method with a specific payload format
    console.log('Updating user metadata via patch method for user ID:', params.id);
    
    return client.users.update(params, {
      user_metadata: metadata
    });
  }
};

