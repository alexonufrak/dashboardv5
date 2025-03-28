// Auth0 Management API utilities
import { getSession } from '@auth0/nextjs-auth0';

// Cache for the Auth0 token
let cachedToken = null;
let tokenExpiration = 0;

// Export helper functions for the Management API
export const getManagementClient = async () => {
  try {
    // For v3, we need to dynamically import the ManagementClient
    const { ManagementClient } = await import('auth0');
    
    // Check if we have a cached token that hasn't expired
    const now = Date.now();
    if (cachedToken && tokenExpiration > now) {
      console.log('Using cached Auth0 token');
      
      // Create and return the Management Client with cached token
      return new ManagementClient({
        domain: process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, ''),
        token: cachedToken
      });
    }
    
    // Get domain and credentials
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    
    if (!domain || !clientId || !clientSecret) {
      throw new Error('Missing required Auth0 environment variables');
    }
    
    // Get token using client credentials grant
    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
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
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData || !tokenData.access_token) {
      throw new Error('Failed to get Auth0 token');
    }
    
    // Cache the token
    cachedToken = tokenData.access_token;
    if (tokenData.expires_in) {
      tokenExpiration = now + (tokenData.expires_in * 1000) - (5 * 60 * 1000);
    }
    
    // Create and return the Management Client
    return new ManagementClient({
      domain,
      token: tokenData.access_token
    });
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
};

// Helper function to check if a user exists by email
export const checkUserExistsByEmail = async (email) => {
  try {
    if (!email) return false;
    
    // Normalize the email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Checking if user exists in Auth0 with email: ${normalizedEmail}`);
    
    // Get management client
    const client = await getManagementClient();
    
    // Search for the user by email
    const users = await client.users.getAll({
      q: `email:"${normalizedEmail}"`,
      search_engine: 'v3'
    });
    
    const exists = Array.isArray(users) && users.length > 0;
    console.log(`User exists in Auth0: ${exists}`);
    
    return exists;
  } catch (error) {
    console.error('Error checking user existence:', error);
    // Return false on error to allow signup flow to continue
    return false;
  }
};

// Helper function to get signup metadata for a user
export const getSignupMetadata = async (email, airtableUser = null) => {
  try {
    // If we have Airtable data, use it directly
    if (airtableUser) {
      console.log("Preparing detailed signup metadata with education information");
      
      // Initialize education data
      let educationData = {};
      
      // Use basic profile data and any education-related fields
      if (airtableUser['Degree Type']) {
        educationData.degreeType = airtableUser['Degree Type'];
      }
      
      if (airtableUser['Graduation Year']) {
        educationData.graduationYear = String(airtableUser['Graduation Year']);
      }
      
      if (airtableUser['Graduation Semester']) {
        educationData.graduationSemester = airtableUser['Graduation Semester'];
      }
      
      // Extract educational information from lookup fields
      if (airtableUser['Degree Type (from Education)']) {
        educationData.degreeType = airtableUser['Degree Type (from Education)'];
      }
      
      if (airtableUser['Graduation Year (from Education)']) {
        educationData.graduationYear = String(airtableUser['Graduation Year (from Education)']);
      }
      
      if (airtableUser['Graduation Semester (from Education)']) {
        educationData.graduationSemester = airtableUser['Graduation Semester (from Education)'];
      }
      
      // Major (only store if it's a record ID)
      if (airtableUser['Major (from Education)'] && 
          typeof airtableUser['Major (from Education)'][0] === 'string' && 
          airtableUser['Major (from Education)'][0].startsWith('rec')) {
        educationData.major = airtableUser['Major (from Education)'][0];
      }
      
      // Include education record ID for updating later
      if (airtableUser.Education && airtableUser.Education.length > 0) {
        educationData.educationId = airtableUser.Education[0];
      }
      
      return {
        contactId: airtableUser.contactId,
        airtableId: airtableUser.contactId,
        firstName: airtableUser['First Name'],
        lastName: airtableUser['Last Name'],
        institution: airtableUser['Institution (from Education)']?.[0],
        // Include all education data fields
        ...educationData,
        // Add any additional user metadata field that might be useful
        referralSource: airtableUser['Referral Source'] || ''
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
};