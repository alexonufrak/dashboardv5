import { getSession } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";
const { AuthenticationClient } = require('auth0');

// Cache for the Management API client instance
let managementClientInstance = null;

/**
 * Create a new Auth0 Management API client
 * This uses the same credentials as the web application to ensure we have access to all users.
 * 
 * Required environment variables:
 * - AUTH0_ISSUER_BASE_URL: Your Auth0 tenant domain with https:// (e.g. 'https://your-tenant.auth0.com')
 * - AUTH0_CLIENT_ID: Client ID for the web application
 * - AUTH0_CLIENT_SECRET: Client secret for the web application
 * 
 * Make sure the web application has been granted the required API permissions:
 * - read:users
 * - read:user_idp_tokens
 * - update:users
 * - update:users_app_metadata
 * - create:users
 * 
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
async function createManagementClient() {
  // Get domain directly from the issuer URL
  const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
  
  // Use the same client credentials as the web application
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  
  if (!domain || !clientId || !clientSecret) {
    throw new Error('Missing required Auth0 environment variables');
  }
  
  console.log(`Creating Auth0 Management client for domain: ${domain}`);
  console.log(`Client ID: ${clientId.substring(0, 5)}... (partially hidden)`);
  
  // Create the Auth0 Management client using the main application credentials
  // This ensures we're using the same Auth0 tenant and can see all users
  const client = new ManagementClient({
    domain: domain,
    clientId: clientId,
    clientSecret: clientSecret,
    audience: `https://${domain}/api/v2/`
  });
  
  // Test if the client can authenticate and get a token manually
  try {
    console.log('Testing Management API token acquisition with Authentication client...');
    
    // Create authentication client for token acquisition
    const authClient = new AuthenticationClient({
      domain: domain,
      clientId: clientId,
      clientSecret: clientSecret
    });
    
    // Get token manually using client credentials flow
    const tokenResponse = await authClient.clientCredentialsGrant({
      audience: `https://${domain}/api/v2/`
    });
    
    if (tokenResponse && tokenResponse.access_token) {
      console.log('Successfully obtained Auth0 Management API token manually');
      
      // Try to make a test call with the obtained token
      try {
        // Create new client with the token
        const testClient = new ManagementClient({
          domain: domain,
          token: tokenResponse.access_token
        });
        
        // Get a list of connections to verify API access works
        const connections = await testClient.connections.getAll({
          per_page: 1,
          page: 0
        });
        
        console.log(`API connection verified. Found ${connections?.length || 0} connections.`);
        
        if (connections && connections.length > 0) {
          console.log('Sample connection:', connections[0].name);
          console.log('Connection types available:', connections[0].strategy);
        }
      } catch (callError) {
        console.error('Error making test API call:', callError);
      }
    }
  } catch (error) {
    console.error('Error testing Auth0 Management API connection:', error);
    // Continue despite error to try the actual user operations
  }
  
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
   * Get user by email from Auth0
   * @param {string} email - User email to check
   * @returns {Promise<Object|null>} User object or null if not found
   */
  getUserByEmail: async (email) => {
    try {
      const client = await getManagementClient();
      
      // Normalize the email for searching
      const normalizedEmail = email.toLowerCase().trim();
      
      // Search for the user by email
      const users = await client.users.getAll({
        q: `email:"${normalizedEmail}"`,
        search_engine: 'v3'
      });
      
      // Return the first user if found, null otherwise
      return (Array.isArray(users) && users.length > 0) ? users[0] : null;
    } catch (error) {
      console.error('Error getting user by email from Auth0:', error);
      return null;
    }
  },
  
  /**
   * Check if a user exists in Auth0 by email
   * @param {string} email - User email to check
   * @returns {Promise<boolean>} True if user exists in Auth0, false otherwise
   */
  checkUserExistsByEmail: async (email) => {
    try {
      // First try to get a Management API client
      const client = await getManagementClient();
      
      // Normalize the email to lowercase for searching
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Checking user exists in Auth0 with normalized email: ${normalizedEmail}`);
      
      console.log('Creating direct token-based client for user search');
      
      try {
        // Get token directly using Authentication Client
        const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
        const clientId = process.env.AUTH0_CLIENT_ID;
        const clientSecret = process.env.AUTH0_CLIENT_SECRET;
        
        // Create authentication client
        const authClient = new AuthenticationClient({
          domain: domain,
          clientId: clientId,
          clientSecret: clientSecret
        });
        
        // Get token with proper scopes
        const tokenResponse = await authClient.clientCredentialsGrant({
          audience: `https://${domain}/api/v2/`,
          scope: 'read:users read:user_idp_tokens'
        });
        
        if (!tokenResponse || !tokenResponse.access_token) {
          console.error('Failed to get Auth0 token for user search');
          return false;
        }
        
        console.log('Successfully obtained token for user search');
        
        // Create client with direct token
        const directClient = new ManagementClient({
          domain: domain,
          token: tokenResponse.access_token
        });
        
        // Check for users with direct token approach
        try {
          console.log('DIRECT APPROACH: Using token-based client to search users');
          const users = await directClient.users.getAll({
            q: `email:"${normalizedEmail}"`,
            search_engine: 'v3'
          });
          
          console.log(`Direct token search results: Found ${users?.length || 0} users`);
          
          // Return true if users found
          if (Array.isArray(users) && users.length > 0) {
            console.log('Found user with direct token approach');
            return true;
          }
          
          // Try to get a list of all users to see if the API works
          const allUsers = await directClient.users.getAll({ 
            per_page: 5,
            page: 0,
            include_totals: true 
          });
          
          if (allUsers && allUsers.total) {
            console.log(`Auth0 tenant has ${allUsers.total} total users (showing ${allUsers.users?.length || 0} in sample)`);
            
            if (allUsers.users && allUsers.users.length > 0) {
              // Show available user properties to understand structure
              const sampleUser = allUsers.users[0];
              console.log('Sample user email domain:', sampleUser.email?.split('@')[1] || 'unknown');
              console.log('Sample user auth type:', 
                sampleUser.identities?.[0]?.provider || 'unknown');
              
              // Try direct email comparison as a fallback
              const matchingUsers = allUsers.users.filter(
                u => u.email && u.email.toLowerCase() === normalizedEmail
              );
              
              if (matchingUsers.length > 0) {
                console.log('Found user with direct email comparison');
                return true;
              }
            }
          }
        } catch (directError) {
          console.error('Error with direct token search:', directError);
        }
      } catch (tokenError) {
        console.error('Error getting Auth0 token:', tokenError);
      }
      
      // At this point, we've tried multiple approaches but found no matching users
      console.log('No matching users found in Auth0');
      return false;
    } catch (error) {
      console.error('Error checking user existence in Auth0:', error);
      // In case of error, return false to allow signup process to continue
      return false;
    }
  },
  
  /**
   * Get user metadata for signup
   * This can be used during signup to prepare metadata to send to Auth0
   * @param {string} email - User email 
   * @param {Object} airtableUser - Optional Airtable user data if already fetched
   * @returns {Promise<Object>} Metadata object to include during signup
   */
  getSignupMetadata: async (email, airtableUser = null) => {
    try {
      // If we have Airtable data, use it directly
      if (airtableUser) {
        return {
          contactId: airtableUser.contactId,
          airtableId: airtableUser.contactId,
          firstName: airtableUser['First Name'],
          lastName: airtableUser['Last Name'],
          institution: airtableUser['Institution (from Education)']?.[0],
          educationId: airtableUser.Education?.[0]
        };
      }
      
      // Otherwise, return a basic metadata object
      return {
        signupSource: 'web',
        signupTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error preparing signup metadata:', error);
      return {}; // Return empty object on error
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
  },
  
  /**
   * Prepare Airtable user data for Auth0 signup
   * @param {string} email - User email address
   * @param {Object} airtableData - User data from Airtable
   * @returns {Object} Metadata to be used during signup
   */
  prepareAirtableMetadata: async (email, airtableData) => {
    try {
      console.log('Preparing Airtable metadata for Auth0 signup:', email);
      
      // Prepare metadata from Airtable data
      return {
        contactId: airtableData.contactId,
        firstName: airtableData['First Name'],
        lastName: airtableData['Last Name'],
        institution: airtableData['Institution (from Education)']?.[0],
        graduationYear: airtableData['Graduation Year (from Education)']?.[0],
        degreeType: airtableData['Degree Type (from Education)']?.[0],
        major: airtableData['Major (from Education)']?.[0],
        educationId: airtableData.Education?.[0],
        dataSource: 'airtable'
      };
    } catch (error) {
      console.error('Error preparing Airtable metadata:', error);
      return {}; // Return empty object on error
    }
  },
  
  /**
   * Update Auth0 user metadata from Airtable data
   * @param {string} email - User email address
   * @param {Object} airtableData - User data from Airtable
   * @returns {Promise<Object|null>} Result of the update operation or null if user not found
   */
  updateUserFromAirtable: async (email, airtableData) => {
    try {
      const client = await getManagementClient();
      
      // Normalize the email
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user exists in Auth0
      const users = await client.users.getAll({
        q: `email:"${normalizedEmail}"`,
        search_engine: 'v3'
      });
      
      const auth0User = (Array.isArray(users) && users.length > 0) ? users[0] : null;
      
      if (auth0User) {
        // User exists in Auth0, update their metadata
        console.log('Updating existing Auth0 user metadata from Airtable for:', normalizedEmail);
        
        // Prepare metadata from Airtable data
        const userMetadata = {
          contactId: airtableData.contactId,
          firstName: airtableData['First Name'],
          lastName: airtableData['Last Name'],
          institution: airtableData['Institution (from Education)']?.[0],
          graduationYear: airtableData['Graduation Year (from Education)']?.[0],
          degreeType: airtableData['Degree Type (from Education)']?.[0],
          major: airtableData['Major (from Education)']?.[0],
          educationId: airtableData.Education?.[0],
          lastSyncedAt: new Date().toISOString()
        };
        
        // Update the user's metadata
        return client.users.update({ id: auth0User.user_id }, {
          user_metadata: userMetadata
        });
      } else {
        // User doesn't exist in Auth0, we'll return null
        // This data will need to be passed during signup
        console.log('No Auth0 user found for:', normalizedEmail);
        return null;
      }
    } catch (error) {
      console.error('Error updating Auth0 user from Airtable:', error);
      return null;
    }
  }
};

