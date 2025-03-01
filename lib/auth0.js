import { getSession } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";

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
  
  // Create the Auth0 Management client using the main application credentials
  // This ensures we're using the same Auth0 tenant and can see all users
  const client = new ManagementClient({
    domain: domain,
    clientId: clientId,
    clientSecret: clientSecret,
    scope: 'read:users read:user_idp_tokens update:users update:users_app_metadata create:users',
    audience: 'https://dev-0xkzyv10aserirvb.us.auth0.com/api/v2/',
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
      const client = await getManagementClient();
      
      // Normalize the email to lowercase for searching
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Checking user exists in Auth0 with normalized email: ${normalizedEmail}`);
      
      // Use the exact query format as recommended by Auth0
      const users = await client.users.getAll({
        q: `email:"${normalizedEmail}"`,
        search_engine: 'v3'
      });
      
      // Log the results for debugging
      console.log(`Auth0 user search results: Found ${users?.length || 0} users`);
      if (users?.length > 0) {
        // Don't log sensitive data, but log the presence of users
        console.log(`Found user(s) in Auth0 with matching email`);
      }
      
      // Return true if at least one user was found
      const exists = Array.isArray(users) && users.length > 0;
      console.log(`User existence in Auth0: ${exists}`);
      return exists;
    } catch (error) {
      console.error('Error checking user existence in Auth0:', error);
      // In case of error, return false to allow signup process to continue
      return false;
    }
  },
  
  /**
   * Create a new user in Auth0
   * @param {Object} userData - User data for creation
   * @returns {Promise<Object>} Created user data
   */
  createUser: async (userData) => {
    try {
      const client = await getManagementClient();
      console.log('Creating new Auth0 user with email:', userData.email);
      
      return client.users.create(userData);
    } catch (error) {
      console.error('Error creating Auth0 user:', error);
      throw error;
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
   * Sync Airtable user data to Auth0
   * @param {string} email - User email address
   * @param {Object} airtableData - User data from Airtable
   * @returns {Promise<Object>} Result of the sync operation
   */
  syncAirtableToAuth0: async (email, airtableData) => {
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
        console.log('Updating existing Auth0 user metadata for:', normalizedEmail);
        
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
        // User doesn't exist in Auth0, create a new user
        console.log('Creating new Auth0 user from Airtable data for:', normalizedEmail);
        
        // Prepare data for user creation
        const newUserData = {
          email: normalizedEmail,
          name: `${airtableData['First Name'] || ''} ${airtableData['Last Name'] || ''}`.trim(),
          given_name: airtableData['First Name'],
          family_name: airtableData['Last Name'],
          connection: 'Username-Password-Authentication', // Default database connection
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4), // Random secure password
          email_verified: false, // User will need to verify their email
          user_metadata: {
            contactId: airtableData.contactId,
            institution: airtableData['Institution (from Education)']?.[0],
            graduationYear: airtableData['Graduation Year (from Education)']?.[0],
            degreeType: airtableData['Degree Type (from Education)']?.[0],
            major: airtableData['Major (from Education)']?.[0],
            educationId: airtableData.Education?.[0],
            source: 'airtable_sync',
            createdAt: new Date().toISOString()
          }
        };
        
        return client.users.create(newUserData);
      }
    } catch (error) {
      console.error('Error syncing Airtable data to Auth0:', error);
      throw error;
    }
  }
};

