import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { ManagementClient } from "auth0";
import axios from 'axios';

// Export withApiAuthRequired so it's available from the same import
export { withApiAuthRequired };

// Cache for the Auth0 token
let cachedToken = null;
let tokenExpiration = 0;

/**
 * Get a direct Auth0 Management API token using fetch
 * This is the most reliable way to get a token in serverless environments
 * 
 * @returns {Promise<string>} Auth0 Management API token
 */
async function getDirectAuth0TokenImpl() {
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
    const token = await getDirectAuth0TokenImpl();
    
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

// Individual function exports
export const getDirectAuth0Token = async () => {
  // Implementation is in the function above, but for export compatibility we wrap it
  try {
    return await getDirectAuth0TokenImpl();
  } catch (error) {
    console.error('Error in getDirectAuth0Token:', error);
    throw error;
  }
};

export const checkUserExistsByEmail = async (email) => {
  // We'll pass this to the default export's implementation
  return defaultExport.checkUserExistsByEmail(email);
};

export const getSignupMetadata = async (email, airtableUser = null) => {
  // We'll pass this to the default export's implementation
  return defaultExport.getSignupMetadata(email, airtableUser);
};

export const getManagementClient = async () => {
  // We'll delegate to the getDirectManagementClient function
  try {
    return await getDirectManagementClient();
  } catch (error) {
    console.error('Error in getManagementClient:', error);
    throw error;
  }
};

// Keep the default export for backward compatibility
const defaultExport = {
  // Make sure we can access the functions from the export object within the module itself
  // This is a circular reference but only happens at runtime
  /**
   * Get a direct Auth0 Management API token
   * @returns {Promise<string|null>} Auth0 Management API token
   */
  getDirectAuth0Token: getDirectAuth0TokenImpl,
  
  /**
   * Get user details from Auth0
   * @param {Object} params - User lookup parameters (e.g. {id: 'user_id'})
   * @returns {Promise<Object>} User data from Auth0
   */
  getUser: async (params) => {
    const client = await getDirectManagementClient();
    return client.users.get(params);
  },
  
  /**
   * Get user by email from Auth0
   * @param {string} email - User email to check
   * @returns {Promise<Object|null>} User object or null if not found
   */
  getUserByEmail: async (email) => {
    try {
      const client = await getDirectManagementClient();
      
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
      console.log(`Checking if user exists in Auth0 with email: ${normalizedEmail}`);
      
      // Get authorization token
      const token = await getDirectAuth0Token();
      if (!token) {
        console.log('Failed to get Auth0 token, assuming user does not exist');
        return false;
      }
      
      // Use the Auth0 Users by Email endpoint directly with axios
      console.log('Using direct Auth0 API call to users-by-email endpoint');
      const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
      
      const config = {
        method: 'get',
        url: `https://${domain}/api/v2/users-by-email`,
        params: { email: normalizedEmail },
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      try {
        console.log(`Making API request to: ${config.url}?email=${encodeURIComponent(normalizedEmail)}`);
        const response = await axios(config);
        
        // Check if we got a successful response with data
        if (response.status === 200 && response.data) {
          const users = response.data;
          console.log(`Auth0 returned ${users.length} users for this email`);
          
          // If we found users, return true
          if (Array.isArray(users) && users.length > 0) {
            console.log('Found matching user(s) in Auth0');
            
            // Log sample user info for debugging, but don't include sensitive data
            if (users[0]) {
              const sampleUser = users[0];
              console.log('User properties available:', Object.keys(sampleUser).join(', '));
              console.log('User connection type:', 
                sampleUser.identities?.[0]?.connection || 'unknown');
              console.log('User identity provider:', 
                sampleUser.identities?.[0]?.provider || 'unknown');
            }
            
            return true;
          }
        }
        
        // If we reach here, no users were found
        console.log('Auth0 API returned no matching users');
        return false;
        
      } catch (apiError) {
        console.error('Error calling Auth0 API:', apiError.message);
        
        // Log more details about the error if available
        if (apiError.response) {
          console.error('API error details:', {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            data: apiError.response.data
          });
        }
        
        // If there was an error, we'll assume the user doesn't exist
        console.log('Assuming user does not exist due to API error');
        return false;
      }
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
    try {
      // First attempt to use the Management API SDK
      const client = await getDirectManagementClient();
      
      // According to Auth0 Node.js SDK v4 documentation, the method to update user_metadata
      // is part of the patch method with a specific payload format
      console.log('Updating user metadata via patch method for user ID:', params.id);
      
      return client.users.update(params, {
        user_metadata: metadata
      });
    } catch (error) {
      // Fallback to direct API call if Management client fails
      console.error('Error using Management client, falling back to direct API call:', error);
      
      try {
        // Get token
        const token = await getDirectAuth0Token();
        if (!token) {
          throw new Error('Failed to get Auth0 token for metadata update');
        }
        
        // Use direct API call
        const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
        const axios = require('axios');
        
        const response = await axios({
          method: 'PATCH',
          url: `https://${domain}/api/v2/users/${params.id}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: {
            user_metadata: metadata
          }
        });
        
        return response.data;
      } catch (fallbackError) {
        console.error('Error in direct API fallback:', fallbackError);
        throw fallbackError;
      }
    }
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
      const client = await getDirectManagementClient();
      
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
        
        try {
          // Update the user's metadata using the SDK
          return client.users.update({ id: auth0User.user_id }, {
            user_metadata: userMetadata
          });
        } catch (sdkError) {
          console.error('Error using SDK to update metadata, falling back to direct API:', sdkError);
          
          // Fallback to direct API call
          const token = await getDirectAuth0Token();
          if (!token) {
            throw new Error('Failed to get Auth0 token for metadata update');
          }
          
          const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
          const axios = require('axios');
          
          const response = await axios({
            method: 'PATCH',
            url: `https://${domain}/api/v2/users/${auth0User.user_id}`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            data: {
              user_metadata: userMetadata
            }
          });
          
          return response.data;
        }
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

