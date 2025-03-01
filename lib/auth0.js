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
  console.log(`Client ID: ${clientId.substring(0, 5)}... (partially hidden)`);
  
  // Create the Auth0 Management client using the main application credentials
  // This ensures we're using the same Auth0 tenant and can see all users
  const client = new ManagementClient({
    domain: domain,
    clientId: clientId,
    clientSecret: clientSecret,
    scope: 'read:users read:user_idp_tokens update:users update:users_app_metadata create:users',
    audience: `https://${domain}/api/v2/`,
    tokenProvider: {
      enableCache: true,
      cacheTTLInSeconds: 3600
    }
  });
  
  // Test if the client can authenticate and get a token
  try {
    // Get token explicitly to validate authorization
    const tokenProvider = client.tokenProvider;
    console.log('Testing Management API token acquisition...');
    const token = await tokenProvider.getAccessToken();
    
    // Don't log the actual token for security reasons, just confirm it exists
    if (token) {
      console.log('Successfully obtained Auth0 Management API token');
      
      // Get tenant settings to verify API access
      const tenantSettings = await client.getTenantSettings();
      console.log('API connection verified. Tenant name:', tenantSettings?.friendly_name || 'Unknown');
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
      const client = await getManagementClient();
      
      // Normalize the email to lowercase for searching
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Checking user exists in Auth0 with normalized email: ${normalizedEmail}`);
      
      // Log client info for debugging (no sensitive data)
      console.log('Management client initialized with proper scopes');
      
      // We'll try multiple search approaches to diagnose the issue
      
      // Approach 1: Search with default search engine (using email exact match)
      console.log('APPROACH 1: Using default search with email field exact match');
      const searchParams1 = {
        q: `email:"${normalizedEmail}"`,
      };
      console.log('Search params:', JSON.stringify(searchParams1));
      
      try {
        const users1 = await client.users.getAll(searchParams1);
        console.log(`Approach 1 results: Found ${users1?.length || 0} users`);
        
        // If found users, return immediately
        if (Array.isArray(users1) && users1.length > 0) {
          console.log('Found user with Approach 1');
          return true;
        }
      } catch (err1) {
        console.error('Error with Approach 1:', err1);
      }
      
      // Approach 2: Search with v3 search engine (Auth0's recommendation)
      console.log('APPROACH 2: Using v3 search engine with email field exact match');
      const searchParams2 = {
        q: `email:"${normalizedEmail}"`,
        search_engine: 'v3'
      };
      console.log('Search params:', JSON.stringify(searchParams2));
      
      try {
        const users2 = await client.users.getAll(searchParams2);
        console.log(`Approach 2 results: Found ${users2?.length || 0} users`);
        
        // If found users, return immediately
        if (Array.isArray(users2) && users2.length > 0) {
          console.log('Found user with Approach 2');
          return true;
        }
      } catch (err2) {
        console.error('Error with Approach 2:', err2);
      }
      
      // Approach 3: Search with v3 search engine (less strict matching, no quotes)
      console.log('APPROACH 3: Using v3 search engine with less strict matching');
      const searchParams3 = {
        q: `email:${normalizedEmail}`,
        search_engine: 'v3'
      };
      console.log('Search params:', JSON.stringify(searchParams3));
      
      try {
        const users3 = await client.users.getAll(searchParams3);
        console.log(`Approach 3 results: Found ${users3?.length || 0} users`);
        
        // If found users, return immediately
        if (Array.isArray(users3) && users3.length > 0) {
          console.log('Found user with Approach 3');
          return true;
        }
      } catch (err3) {
        console.error('Error with Approach 3:', err3);
      }
      
      // Approach 4: Search focusing on social identities
      console.log('APPROACH 4: Using v3 search with identities focus (for social logins)');
      const searchParams4 = {
        q: `identities.connection:"google-oauth2" AND email:${normalizedEmail}`,
        search_engine: 'v3'
      };
      console.log('Search params:', JSON.stringify(searchParams4));
      
      try {
        const users4 = await client.users.getAll(searchParams4);
        console.log(`Approach 4 results: Found ${users4?.length || 0} users`);
        
        // If found users, return immediately
        if (Array.isArray(users4) && users4.length > 0) {
          console.log('Found user with Approach 4');
          return true;
        }
      } catch (err4) {
        console.error('Error with Approach 4:', err4);
      }
      
      // Approach 5: Try to get all users and search manually (LIMIT TO SMALL BATCHES)
      console.log('APPROACH 5: Getting a sample of users to check Auth0 content');
      try {
        // Get just a few users to confirm API is working, but not too many to overload
        const allUsers = await client.users.getAll({ per_page: 5, page: 0 });
        console.log(`Auth0 tenant has at least ${allUsers?.length || 0} users`);
        
        if (allUsers && allUsers.length > 0) {
          console.log('Sample user fields available:', Object.keys(allUsers[0]).join(', '));
          
          // For social logins, check the identity provider type
          const socialUsers = allUsers.filter(u => 
            u.identities && 
            u.identities.some(i => i.provider === 'google-oauth2')
          );
          
          console.log(`Found ${socialUsers.length} users with Google authentication`);
        }
      } catch (err5) {
        console.error('Error with Approach 5:', err5);
      }
      
      // At this point, we've tried multiple approaches but found no matching users
      console.log('No matching users found across all search approaches');
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

