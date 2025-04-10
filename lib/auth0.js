import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Edge Runtime compatible imports
// We need to avoid importing node-specific modules at the top level
// to ensure middleware can run in Edge Runtime

// Map domain from old to new format
const oldDomain = process.env.AUTH0_ISSUER_BASE_URL;
const domain = oldDomain ? oldDomain.replace(/^https?:\/\//, '') : process.env.AUTH0_DOMAIN;

// Ensure base URL always has protocol
const getBaseUrlWithProtocol = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
};

// Map base URL from old to new format
// Priority: 1. APP_BASE_URL, 2. AUTH0_BASE_URL with protocol check, 3. Production domain, 4. Local dev
const appBaseUrl = process.env.APP_BASE_URL || 
                   getBaseUrlWithProtocol(process.env.AUTH0_BASE_URL) || 
                   (process.env.NODE_ENV === 'production' ? 'https://hub.xfoundry.org' : 'http://localhost:3000');

// Get secret for cookie encryption
const secret = process.env.AUTH0_SECRET || process.env.AUTH0_COOKIE_SECRET;

// Create Auth0 client instance with v4 API
/**
 * Custom login callback handler for Auth0 v4
 * This replaces the afterCallback functionality from Auth0 v3
 * @param {Object} req - The HTTP request
 * @param {Object} session - The Auth0 session
 */
const afterLoginCallback = async (req, session) => {
  try {
    console.log("Auth0 login callback received with query params:", req.query);
    
    const { 
      institution, 
      institutionId, 
      degreeType, 
      major, 
      graduationYear, 
      firstName, 
      lastName,
      referralSource,
      cohortId,
      email, // User's email address from query params
      contactId, // Airtable contact ID if available
      educationId, // Airtable education ID if available
      airtableId, // Legacy parameter for contactId
      invitationToken // Team invitation token if coming from an invite
    } = req.query;

    // The verified email might come from query parameters or login_hint
    const verifiedEmail = email || req.query.login_hint;
    
    // Check if there's a verified email to compare against
    if (verifiedEmail && session.user.email && verifiedEmail !== session.user.email) {
      console.error(`Email mismatch: Verified ${verifiedEmail} but authenticated with ${session.user.email}`);
      // Add a flag to indicate email mismatch - this will be checked on the frontend
      session.user.emailMismatch = {
        verifiedEmail: verifiedEmail,
        authEmail: session.user.email
      };
    }

    // Add metadata to the session regardless of whether institution is provided
    // This ensures we always capture metadata even when going straight to Google auth
    
    // Process institution info if available
    if (institution && institutionId) {
      session.user.institution = {
        name: institution,
        id: institutionId,
        degreeType: degreeType || "",
        major: major || "",
        graduationYear: graduationYear || "",
        graduationSemester: req.query.graduationSemester || "",
      }
    }
    
    // Add personal information if available
    if (firstName) session.user.firstName = firstName;
    if (lastName) session.user.lastName = lastName;
    
    // Add referral source and cohortId as user metadata
    if (referralSource) session.user.referralSource = referralSource;
    if (cohortId) session.user.cohortId = cohortId;
    
    // Save invitation token if provided
    if (invitationToken) session.user.invitationToken = invitationToken;

    // Initialize session metadata - ensure onboarding is properly set up
    session.user.user_metadata = {
      ...session.user.user_metadata,
      onboarding: ['register'],
      onboardingCompleted: false, // Explicitly set to false to ensure checklist shows for new users
      ...(cohortId ? { selectedCohort: cohortId } : {})
    };

    // Update user metadata in Auth0 using Management API
    try {
      const userId = session.user.sub;
      
      // Get the current date for timestamp
      const now = new Date().toISOString();
      
      // Prepare user metadata updates
      const metadata = {
        // Personal info
        firstName: firstName || session.user.given_name || '',
        lastName: lastName || session.user.family_name || '',
        
        // Institution info
        ...(institution ? { institution } : {}),
        ...(institutionId ? { institutionId } : {}),
        ...(degreeType ? { degreeType } : {}),
        ...(graduationYear ? { graduationYear } : {}),
        ...(req.query.graduationSemester ? { graduationSemester: req.query.graduationSemester } : {}),
        ...(major ? { major } : {}),
        
        // Additional metadata
        onboarding: ['register'], // First step is always completed for new users
        ...(referralSource ? { referralSource } : {}),
        ...(cohortId ? { selectedCohort: cohortId } : {}),
        ...(invitationToken ? { invitationToken } : {}),
        
        // Explicitly set onboardingCompleted to false for new users
        // This ensures the checklist will show on first login
        onboardingCompleted: false,
        
        // Store the verified email in metadata for future reference
        ...(verifiedEmail ? { verifiedEmail } : {}),
        
        // Store Airtable IDs in metadata if available
        ...(contactId ? { contactId } : {}),
        ...(airtableId ? { airtableId } : {}),
        ...(educationId ? { educationId } : {}),
        
        // Add timestamps
        lastLogin: now,
        ...(session.user.user_metadata?.createdAt ? {} : { createdAt: now })
      };
      
      console.log("Updating user metadata in Auth0:", metadata);
      
      // Get direct management API token for Auth0
      const token = await getDirectAuth0Token();
      if (token) {
        const currentDomain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
        
        // Dynamically import axios to avoid edge runtime issues
        const axios = (await import('axios')).default;
        
        // Use Axios to make a direct API call
        await axios({
          method: 'PATCH',
          url: `https://${currentDomain}/api/v2/users/${userId}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: {
            user_metadata: metadata
          }
        });
        
        console.log("Successfully updated user metadata in Auth0");
      } else {
        console.error("Failed to get Auth0 token for metadata update");
      }
    } catch (err) {
      console.error("Error updating Auth0 user metadata:", err);
      console.error("Error details:", err.stack);
    }
    
    // Log all the metadata we're capturing
    console.log("User session data:", {
      email: session.user.email,
      sub: session.user.sub,
      institution: session.user.institution,
      firstName: session.user.firstName || firstName,
      lastName: session.user.lastName || lastName,
      referralSource,
      cohortId,
      verifiedEmail,
      contactId,
      airtableId,
      educationId,
      invitationToken,
      metadata: session.user.user_metadata
    });
    
    // Handle invitation acceptance if there's a token and we have a contact ID
    // We'll do this in a separate API call to avoid Airtable/webpack edge runtime issues
    if (invitationToken && (contactId || airtableId)) {
      try {
        console.log("Storing invitation token in session for processing:", invitationToken);
        
        // Store the invitation data in the session for later processing via an API call
        session.user.pendingInvitation = {
          token: invitationToken,
          contactId: contactId || airtableId
        };
        
        console.log("Invitation token stored in session for later processing");
      } catch (error) {
        console.error("Error storing invitation token:", error);
      }
    }

    return session;
  } catch (error) {
    console.error("Error in afterLoginCallback:", error);
    return session; // Still return the session even if there's an error
  }
};

export const auth0 = new Auth0Client({
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret,
  appBaseUrl,
  
  // Authorization parameters
  authorizationParameters: {
    scope: 'openid profile email',
    ...(process.env.AUTH0_AUDIENCE ? { audience: process.env.AUTH0_AUDIENCE } : {}),
  },
  
  // Enhanced session configuration for better stability
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
    cookie: {
      sameSite: 'lax', // Allow cookies in same-site context (default is 'lax')
      httpOnly: true, // Cookies not accessible from JavaScript
      secure: process.env.NODE_ENV === 'production', // Secure in production only
      transient: false, // Not transient - keep cookie across browser sessions
      domain: process.env.NODE_ENV === 'production' ? 'xfoundry.org' : undefined, // Set domain in production
    },
    name: 'auth0_session', // Explicit session name
    storeIDToken: true, // Store ID token in session
    errorOnMissingState: false, // Don't error on missing state - makes flow more robust
  },
  
  // Handler to process the login callback (Auth0 v4 replacement for afterCallback)
  hooks: {
    afterLogin: afterLoginCallback,
  },
  
  // Add transaction cookie options for more reliability
  transactionCookie: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    domain: process.env.NODE_ENV === 'production' ? 'xfoundry.org' : undefined,
  }
});

// Cache for the Auth0 token
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
    
    // Dynamically import ManagementClient to avoid edge runtime issues
    const { ManagementClient } = await import('auth0');
    
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
   * Get a direct Auth0 Management API token
   * @returns {Promise<string|null>} Auth0 Management API token
   */
  getDirectAuth0Token,
  
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
        // Dynamically import axios to avoid edge runtime issues
        const axios = (await import('axios')).default;
        
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
        
        // Modified behavior: Let users sign up and don't error
        console.log('Error in Auth0 API, but continuing signup process by assuming user does not exist');
        return false;
      }
    } catch (error) {
      console.error('Error checking user existence in Auth0:', error);
      // Modified behavior: Allow signup process to continue
      console.log('Error checking user in Auth0, but continuing signup process');
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
        console.log("Preparing detailed signup metadata with education information");
        
        // Initialize education data - we'll include what's directly available in airtableUser
        // This avoids dynamic imports of Airtable functions which aren't Edge compatible
        let educationData = {};
        
        // Use basic profile data and any education-related fields already in the user record
        // This avoids making additional Airtable queries which aren't Edge-compatible
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
        // These fields are populated by Airtable automatically from related Education records
        // This approach avoids making additional Airtable API calls which aren't Edge-compatible
        
        // Degree Type
        if (airtableUser['Degree Type (from Education)']) {
          educationData.degreeType = airtableUser['Degree Type (from Education)'];
          console.log(`Found degree type from education lookup: ${educationData.degreeType}`);
        }
        
        // Graduation Year
        if (airtableUser['Graduation Year (from Education)']) {
          // Ensure it's stored as a string for consistency
          educationData.graduationYear = String(airtableUser['Graduation Year (from Education)']);
          console.log(`Found graduation year from education lookup: ${educationData.graduationYear}`);
        }
        
        // Graduation Semester
        if (airtableUser['Graduation Semester (from Education)']) {
          educationData.graduationSemester = airtableUser['Graduation Semester (from Education)'];
          console.log(`Found graduation semester from education lookup: ${educationData.graduationSemester}`);
        }
        
        // Major (only store if it's a record ID)
        if (airtableUser['Major (from Education)'] && 
            typeof airtableUser['Major (from Education)'][0] === 'string' && 
            airtableUser['Major (from Education)'][0].startsWith('rec')) {
          educationData.major = airtableUser['Major (from Education)'][0];
          console.log(`Found major record ID from education lookup: ${educationData.major}`);
        }
        
        // Include education record ID for updating later
        if (airtableUser.Education && airtableUser.Education.length > 0) {
          educationData.educationId = airtableUser.Education[0];
        }
        
        // Log the extracted education data for debugging
        console.log("Extracted education data for prefill:", educationData);
        
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
        // Dynamically import axios to avoid edge runtime issues
        const axios = (await import('axios')).default;
        
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
          
          // Dynamically import axios to avoid edge runtime issues
          const axios = (await import('axios')).default;
          
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

