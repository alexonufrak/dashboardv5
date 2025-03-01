import { getSession } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";
// Don't need AuthenticationClient anymore - direct API call is more reliable

// Cache for the Management API client instance and token
let cachedToken = null;
let tokenExpiration = 0;

/**
 * Get a direct Auth0 Management API token using fetch
 * This is the most reliable way to get a token in serverless environments
 * 
 * @returns {Promise<string>} Auth0 Management API token
 */
async function getDirectAuth0Token() {
  try {
    // Check if we have a cached token that hasn't expired
    const now = Date.now();
    if (cachedToken && tokenExpiration > now) {
      console.log('Using cached Auth0 token');
      return cachedToken;
    }
    
    // Get domain and credentials
    const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    
    if (!domain || !clientId || !clientSecret) {
      throw new Error('Missing required Auth0 environment variables');
    }
    
    console.log(`Getting Auth0 token for domain: ${domain}`);
    
    // Get token using direct fetch (more reliable in serverless environments)
    const tokenUrl = `https://${domain}/oauth/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });
    
    const data = await response.json();
    
    if (!data || !data.access_token) {
      throw new Error('Failed to get Auth0 token');
    }
    
    // Cache the token and set expiration (subtract 5 minutes for buffer)
    cachedToken = data.access_token;
    if (data.expires_in) {
      tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
      console.log(`Token will expire in ~${Math.floor(data.expires_in / 60)} minutes`);
    }
    
    console.log('Successfully obtained new Auth0 Management API token');
    return data.access_token;
  } catch (error) {
    console.error('Error getting Auth0 token:', error);
    throw error;
  }
}

/**
 * Get an Auth0 Management Client using direct token auth
 * 
 * @returns {Promise<ManagementClient>} Auth0 Management API client
 */
async function getDirectManagementClient() {
  try {
    // Get the token
    const token = await getDirectAuth0Token();
    
    // Get domain from env
    const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
    
    // Create and return the client
    return new ManagementClient({
      domain: domain,
      token: token
    });
  } catch (error) {
    console.error('Error creating direct Auth0 Management client:', error);
    throw error;
  }
}

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
      // Normalize the email to lowercase for searching
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Checking user exists in Auth0 with normalized email: ${normalizedEmail}`);
      
      try {
        // Get a direct token-based management client
        const client = await getDirectManagementClient();
        
        // Search for user with the most reliable method
        console.log('Searching for user with direct token-based client');
        
        // First try: Exact email search
        try {
          console.log('Attempt 1: Using exact email search');
          const users = await client.users.getAll({
            q: `email:"${normalizedEmail}"`,
            search_engine: 'v3',
            per_page: 1
          });
          
          if (Array.isArray(users) && users.length > 0) {
            console.log('Found user with exact email search');
            return true;
          }
        } catch (err1) {
          console.log('Error with exact email search:', err1.message);
        }
        
        // Second try: Get all users and check manually
        try {
          console.log('Attempt 2: Getting all users and checking manually');
          const allUsers = await client.users.getAll({
            per_page: 100,
            include_totals: true
          });
          
          // If we got results, display some stats
          if (allUsers && allUsers.total) {
            console.log(`Auth0 tenant has ${allUsers.total} total users (showing up to 100)`);
            
            if (allUsers.users && allUsers.users.length > 0) {
              // Try direct email comparison
              const matchingUsers = allUsers.users.filter(
                u => u.email && u.email.toLowerCase() === normalizedEmail
              );
              
              if (matchingUsers.length > 0) {
                console.log('Found user with direct comparison');
                return true;
              }
              
              // Log sample user info for debugging
              const sampleUser = allUsers.users[0];
              console.log('Sample user data available:', Object.keys(sampleUser).join(', '));
              console.log('Sample user email:', sampleUser.email);
              
              if (sampleUser.identities && sampleUser.identities.length > 0) {
                console.log('Sample user identity provider:', sampleUser.identities[0].provider);
                console.log('Sample user identity connection:', sampleUser.identities[0].connection);
              }
            }
          }
        } catch (err2) {
          console.log('Error getting all users:', err2.message);
        }
        
      } catch (tokenError) {
        console.error('Error getting Auth0 management client:', tokenError.message);
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

