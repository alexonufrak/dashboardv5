/**
 * Auth0 v4 client for xFoundry Dashboard
 */
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { ManagementClient } from "auth0";

// Define environment variable names
const ENV = {
  BASE_URL: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL,
  DOMAIN: process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, ''),
  CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  SECRET: process.env.AUTH0_SECRET || process.env.AUTH0_COOKIE_SECRET,
  AUDIENCE: process.env.AUTH0_AUDIENCE
};

// Ensure base URL has protocol
const getBaseUrlWithProtocol = (url) => {
  if (!url) return process.env.NODE_ENV === 'production' ? 'https://hub.xfoundry.org' : 'http://localhost:3000';
  return url.startsWith('http') ? url : `https://${url}`;
};

// Initialize Auth0 client
export const auth0 = new Auth0Client({
  domain: ENV.DOMAIN,
  clientId: ENV.CLIENT_ID,
  clientSecret: ENV.CLIENT_SECRET,
  secret: ENV.SECRET,
  appBaseUrl: getBaseUrlWithProtocol(ENV.BASE_URL),
  
  // Authentication parameters
  authorizationParameters: {
    scope: 'openid profile email',
    audience: ENV.AUDIENCE
  },
  
  // Session configuration for persistent sessions
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
  },
  
  // Custom session enhancement - adds user metadata to session
  async onSessionCreated({ session, user }) {
    console.log("Session created for user:", user.sub);
    
    // Add custom claims to session
    session.user.firstName = user.given_name || user.name?.split(' ')[0] || '';
    session.user.lastName = user.family_name || user.name?.split(' ').slice(1).join(' ') || '';
    
    // Add user metadata from Auth0 if available
    if (user.user_metadata) {
      // Copy specific metadata fields to the session
      const {
        contactId, airtableId, institutionId, institution,
        firstName, lastName, referralSource, onboarding,
        onboardingCompleted, selectedCohort
      } = user.user_metadata;
      
      // Add fields to session if they exist
      if (contactId) session.user.contactId = contactId;
      if (airtableId) session.user.airtableId = airtableId;
      if (institutionId) session.user.institutionId = institutionId;
      if (institution) session.user.institution = institution;
      if (firstName) session.user.firstName = firstName;
      if (lastName) session.user.lastName = lastName;
      if (referralSource) session.user.referralSource = referralSource;
      if (onboarding) session.user.onboarding = onboarding;
      if (typeof onboardingCompleted !== 'undefined') session.user.onboardingCompleted = onboardingCompleted;
      if (selectedCohort) session.user.selectedCohort = selectedCohort;
    }
    
    return session;
  }
});

// Cache for the Auth0 Management token
let cachedToken = null;
let tokenExpiration = 0;

/**
 * Get an Auth0 Management API token
 * @returns {Promise<string>} The access token for Auth0 Management API
 */
export const getManagementToken = async () => {
  try {
    // Check if we have a valid cached token
    const now = Date.now();
    if (cachedToken && tokenExpiration > now) {
      return cachedToken;
    }
    
    // Get token using client credentials grant
    const baseUrl = getBaseUrlWithProtocol(ENV.BASE_URL);
    const tokenUrl = `https://${ENV.DOMAIN}/oauth/token`;
    console.log(`Getting Management API token for domain: ${ENV.DOMAIN}`);
    
    const tokenBody = {
      client_id: ENV.CLIENT_ID,
      client_secret: ENV.CLIENT_SECRET,
      audience: `https://${ENV.DOMAIN}/api/v2/`,
      grant_type: 'client_credentials',
      // Include redirect_uri for Auth0 validation (must be registered in Auth0 dashboard)
      redirect_uri: `${baseUrl}/auth/callback`
    };
    
    console.log(`Token request body: ${JSON.stringify(tokenBody, null, 2)}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenBody)
    });
    
    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Failed to get Auth0 Management API token');
    }
    
    // Cache the token (expires 5 minutes before actual expiration)
    cachedToken = data.access_token;
    if (data.expires_in) {
      tokenExpiration = now + (data.expires_in * 1000) - (5 * 60 * 1000);
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting Management API token:', error);
    throw error;
  }
};

/**
 * Get a Management API client for Auth0
 * @returns {Promise<ManagementClient>} Auth0 Management client
 */
export const getManagementClient = async () => {
  try {
    const token = await getManagementToken();
    const baseUrl = getBaseUrlWithProtocol(ENV.BASE_URL);
    
    console.log(`Creating Management API client for domain: ${ENV.DOMAIN}`);
    
    return new ManagementClient({
      domain: ENV.DOMAIN,
      token,
      clientId: ENV.CLIENT_ID,
      clientSecret: ENV.CLIENT_SECRET,
      scope: 'read:users update:users',
      audience: `https://${ENV.DOMAIN}/api/v2/`,
      tokenProvider: {
        enableCache: true,
        cacheTTLInSeconds: 3600
      }
    });
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
};

/**
 * Update user metadata in Auth0
 * @param {string} userId - Auth0 user ID
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserMetadata = async (userId, metadata) => {
  try {
    const client = await getManagementClient();
    return client.users.update({ id: userId }, { user_metadata: metadata });
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getUserByEmail = async (email) => {
  try {
    if (!email) {
      console.log('No email provided to getUserByEmail');
      return null;
    }
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Looking up Auth0 user with email: ${normalizedEmail}`);
    
    const client = await getManagementClient();
    
    // Search for the user by email - using lucene query syntax
    const query = {
      q: `email:"${normalizedEmail}"`,
      search_engine: 'v3',
      fields: 'user_id,email,name,user_metadata',
      include_fields: true
    };
    
    console.log(`Auth0 Management API query: ${JSON.stringify(query)}`);
    
    // First attempt - use getAll method
    try {
      const users = await client.users.getAll(query);
      console.log(`Auth0 returned ${users?.length || 0} users for email ${normalizedEmail}`);
      
      return (users && users.length > 0) ? users[0] : null;
    } catch (getallError) {
      console.error('Error with users.getAll:', getallError);
      
      // Fall back to alternative approach if getAll fails
      console.log('Trying alternative approach with tenant.getConnections...');
      try {
        // Try to get a list of user IDs first
        const params = new URLSearchParams({
          q: `email:"${normalizedEmail}"`,
          search_engine: 'v3'
        });
        
        // Use more basic fetch API as fallback
        const baseUrl = getBaseUrlWithProtocol(ENV.BASE_URL);
        const accessToken = await getManagementToken();
        const apiUrl = `https://${ENV.DOMAIN}/api/v2/users?${params.toString()}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }
        
        const directUsers = await response.json();
        console.log(`Direct API call returned ${directUsers?.length || 0} users`);
        
        return (directUsers && directUsers.length > 0) ? directUsers[0] : null;
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return null;
      }
    }
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

/**
 * Check if a user exists by email
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */
export const checkUserExistsByEmail = async (email) => {
  const user = await getUserByEmail(email);
  return !!user;
};

// Export default client for backward compatibility
/**
 * Prepare metadata for signup based on existing Airtable user
 * @param {string} email - User email
 * @param {Object} airtableUser - Existing Airtable user object
 * @returns {Promise<Object>} Metadata for Auth0 signup
 */
export const getSignupMetadata = async (email, airtableUser) => {
  try {
    if (!airtableUser) {
      return null;
    }
    
    console.log('Preparing signup metadata from Airtable user:', JSON.stringify(airtableUser, null, 2));
    
    // Extract first and last names - fields in Airtable may be "First Name" and "Last Name"
    const firstName = airtableUser["First Name"] || airtableUser.firstName || '';
    const lastName = airtableUser["Last Name"] || airtableUser.lastName || '';
    
    // Extract institution data - could be in various fields
    let institutionId = null;
    let institutionName = null;
    
    // Try to get from education first
    if (airtableUser["Institution (from Education)"] && airtableUser["Institution (from Education)"].length > 0) {
      institutionId = airtableUser["Institution (from Education)"][0];
    }
    
    // Try to get institution name if available
    if (airtableUser["Name (from Institution (from Education))"]) {
      if (Array.isArray(airtableUser["Name (from Institution (from Education))"])) {
        institutionName = airtableUser["Name (from Institution (from Education))"][0];
      } else {
        institutionName = airtableUser["Name (from Institution (from Education))"];
      }
    }
    
    // Get education details if available
    const graduationYear = airtableUser["Graduation Year (from Education)"] || '';
    const graduationSemester = airtableUser["Graduation Semester (from Education)"] || '';
    const degreeType = airtableUser["Degree Type (from Education)"] || '';
    const major = airtableUser["Major (from Education)"] || '';
    
    // Get referral source if available
    const referralSource = airtableUser["Referral Source"] || '';
    
    // Prepare metadata from existing Airtable user
    return {
      contactId: airtableUser.contactId,
      airtableId: airtableUser.contactId,
      institutionId: institutionId,
      institution: institutionName ? { id: institutionId, name: institutionName } : undefined,
      firstName: firstName,
      lastName: lastName,
      graduationYear: graduationYear,
      graduationSemester: graduationSemester,
      degreeType: degreeType,
      major: major,
      referralSource: referralSource,
      onboardingCompleted: false
    };
  } catch (error) {
    console.error('Error preparing signup metadata:', error);
    return null;
  }
};

export default auth0;