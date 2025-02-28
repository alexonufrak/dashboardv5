import { getSession } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";

// Module for Auth0 Management API
const auth0 = {
  // Get the domain from the environment variables
  getDomain: () => {
    const fullDomain = process.env.AUTH0_ISSUER_BASE_URL || '';
    return fullDomain.includes('https://') 
      ? fullDomain.replace('https://', '') 
      : fullDomain;
  },
  
  // Management API client functions
  management: {
    // Get a user by ID
    getUser: async (params) => {
      const client = await auth0.getManagementClient();
      return client.getUser(params);
    },
    
    // Update user metadata
    updateUserMetadata: async (params, metadata) => {
      const client = await auth0.getManagementClient();
      return client.updateUserMetadata(params, metadata);
    }
  },
  
  // Create and cache the Management Client
  _managementClient: null,
  getManagementClient: async () => {
    // Return cached client if available
    if (auth0._managementClient) {
      return auth0._managementClient;
    }
    
    // Get domain from environment variables
    const domain = auth0.getDomain();
    
    if (!domain || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
      throw new Error('Missing required Auth0 environment variables');
    }
    
    try {
      // Create the Auth0 Management client
      auth0._managementClient = new ManagementClient({
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
      
      return auth0._managementClient;
    } catch (error) {
      console.error('Error creating Auth0 Management client:', error);
      throw error;
    }
  }
};

// Export the module
export default auth0;

