/**
 * Auth0 v4 client for xFoundry Dashboard
 */
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { ManagementClient } from "auth0";

/**
 * Auth0 client configuration following Auth0 v4 best practices.
 * The SDK reads the following environment variables:
 * - AUTH0_SECRET: A 32-byte secret for cookie encryption
 * - AUTH0_ISSUER_BASE_URL or AUTH0_DOMAIN: Auth0 domain 
 * - AUTH0_CLIENT_ID: Client ID from Auth0
 * - AUTH0_CLIENT_SECRET: Client secret from Auth0
 * - AUTH0_AUDIENCE: API audience (optional, for Access Tokens)
 * - APP_BASE_URL or AUTH0_BASE_URL: Application URL
 */

// Initialize Auth0 client with minimal configuration
// Most settings will be automatically read from environment variables
export const auth0 = new Auth0Client({
  // Session configuration for persistent sessions
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
    
    // Cookie settings - only specify what differs from Auth0 defaults
    cookie: {
      // Only set domain in production to allow localhost in dev
      domain: process.env.NODE_ENV === 'production' ? '.xfoundry.org' : undefined
    },
    
    // Always store ID Token in session
    storeIDToken: true
  },
  
  // Default authorization parameters
  authorizationParameters: {
    scope: 'openid profile email'
  },
  
  // Standard routes - these match our existing routes
  routes: {
    callback: '/auth/callback',
    login: '/auth/login',
    logout: '/auth/logout'
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

/**
 * Get a Management API client for Auth0
 * Uses client credentials grant with built-in token caching
 * @returns {ManagementClient} Auth0 Management client
 */
export const getManagementClient = () => {
  try {
    // Use environment variables directly 
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    
    console.log(`Creating Management API client for domain: ${domain}`);
    console.log(`Using Dashboard client ID: ${clientId.substring(0, 5)}...`);
    
    // Create the client using the environment variables directly
    return new ManagementClient({
      domain: domain,
      clientId: clientId,
      clientSecret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      scope: 'read:users update:users create:users',
      // Enable token caching with automatic refresh
      tokenProvider: {
        enableCache: true,
        cacheTTLInSeconds: 3600, // Cache tokens for 1 hour
        retry: {
          enabled: true,
          maxRetries: 3
        }
      }
    });
  } catch (error) {
    console.error('Error creating Auth0 Management client:', error);
    throw error;
  }
};

/**
 * DEPRECATED: Use updateUserMetadata from auth0-management.js instead
 * This is kept for backward compatibility only.
 * Update user metadata in Auth0
 * @param {string} userId - Auth0 user ID
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserMetadata = async (userId, metadata) => {
  console.warn('DEPRECATED: Use updateUserMetadata from lib/auth0-management.js instead');
  
  try {
    if (!userId) {
      throw new Error('User ID is required for metadata update');
    }
    
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Valid metadata object is required for update');
    }
    
    const { updateUserMetadata } = await import('./auth0-management');
    const result = await updateUserMetadata(userId, metadata);
    
    if (!result) {
      throw new Error('Failed to update user metadata');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
};

/**
 * DEPRECATED: Use getUserByEmail from auth0-management.js instead
 * This is kept for backward compatibility only.
 * Get user by email from Auth0
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getUserByEmail = async (email) => {
  console.warn('DEPRECATED: Use getUserByEmail from lib/auth0-management.js instead');
  
  try {
    const { getUserByEmail } = await import('./auth0-management');
    return await getUserByEmail(email);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

/**
 * DEPRECATED: Use checkUserExists from auth0-management.js instead
 * This is kept for backward compatibility only.
 * Check if a user exists by email
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */
export const checkUserExistsByEmail = async (email) => {
  console.warn('DEPRECATED: Use checkUserExists from lib/auth0-management.js instead');
  
  if (!email) {
    console.log('No email provided to checkUserExistsByEmail');
    return false;
  }
  
  try {
    const { checkUserExists } = await import('./auth0-management');
    return await checkUserExists(email);
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
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
