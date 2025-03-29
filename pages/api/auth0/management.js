/**
 * Auth0 Management API operations
 * 
 * This API route provides endpoints for Auth0 Management API operations
 * such as user lookups, metadata updates, etc.
 * 
 * It runs in a Node.js environment (not Edge Runtime) to support
 * the Auth0 Management API which uses Node.js APIs.
 */
import { getManagementClient } from '../../../lib/auth0';
import { auth0 } from '../../../lib/auth0';

// Set runtime explicitly to nodejs to avoid Edge Runtime issues
export const runtime = 'nodejs';

/**
 * Get a user by email from Auth0
 * @param {string} email - Email to search for
 * @returns {Object|null} User object or null if not found
 */
async function getUserByEmail(email) {
  try {
    if (!email) {
      console.log('No email provided to getUserByEmail API');
      return null;
    }
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Management API looking up Auth0 user with email: ${normalizedEmail}`);
    
    // Get Management client credentials for logging
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    
    console.log(`[Management API] Using domain: ${domain}`);
    console.log(`[Management API] Using Dashboard client ID: ${clientId?.substring(0, 5)}...`);
    console.log(`[Management API] Audience: https://${domain}/api/v2/`);
    
    // Get a management client (credentials configured in lib/auth0.js)
    const client = getManagementClient();
    
    // Try different query formats for thoroughness
    console.log(`[Management API] Trying multiple query formats for email search`);
    
    // Format 1: Standard Lucene query with quotes
    const queryFormat1 = `email:"${normalizedEmail}"`;
    console.log(`[Management API] Query format 1: ${queryFormat1}`);
    
    // Format 2: Simple equals without quotes
    const queryFormat2 = `email:${normalizedEmail}`;
    console.log(`[Management API] Query format 2: ${queryFormat2}`);
    
    // Format 3: Using email_verified field
    const queryFormat3 = `email:"${normalizedEmail}" OR email_verified:true`;
    console.log(`[Management API] Query format 3: ${queryFormat3}`);
    
    // Format 4: Using raw search without field specification
    const queryFormat4 = `"${normalizedEmail}"`;
    console.log(`[Management API] Query format 4: ${queryFormat4}`);
    
    // Select the query format to use (try different ones if one fails)
    const query = queryFormat1;
    console.log(`[Management API] Using search query: ${query}`);
    console.log(`[Management API] Search engine: v3`);
    
    // Search for the user by email using Lucene query syntax
    const searchParams = {
      q: query,
      search_engine: 'v3',
      fields: 'user_id,email,name,user_metadata',
      include_fields: true,
      // Add per_page to ensure we get results
      per_page: 100
    };
    
    console.log(`[Management API] Full search params:`, JSON.stringify(searchParams, null, 2));
    
    // Execute the query
    console.log(`[Management API] Executing user search...`);
    const users = await client.users.getAll(searchParams);
    
    // Skip the getAll method completely and use the Auth0 REST API directly
    // This is a 100% reliable way to find users by email according to Auth0 docs
    console.log(`[Management API] Bypassing search and using direct API method for email lookup...`);
    try {
      // Get the access token from the token provider
      const token = await client.tokenProvider.getAccessToken();
      
      // Use the official Auth0 API endpoint for finding users by email
      const url = `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(normalizedEmail)}`;
      console.log(`[Management API] Fetching directly from: ${url}`);
      
      // Make the API request
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[Management API] Direct API response status: ${response.status}`);
      
      if (response.ok) {
        const directUsers = await response.json();
        console.log(`[Management API] Direct API call returned ${directUsers?.length || 0} users`);
        
        if (directUsers && directUsers.length > 0) {
          console.log(`[Management API] Found user with direct API call!`);
          console.log(`[Management API] User ID: ${directUsers[0].user_id}`);
          console.log(`[Management API] Email: ${directUsers[0].email}`);
          console.log(`[Management API] Email verified: ${directUsers[0].email_verified}`);
          
          // Return the users we found through the direct method
          users.push(...directUsers);
          return directUsers[0];
        } else {
          console.log(`[Management API] Direct API call returned no users`);
        }
      } else {
        const errorText = await response.text();
        console.error(`[Management API] Direct API call failed: ${response.status} ${response.statusText}`);
        console.error(`[Management API] Error details: ${errorText}`);
      }
    } catch (directError) {
      console.error(`[Management API] Error in direct API call:`, directError.message);
    }
    
    // Log the results
    console.log(`[Management API] Auth0 returned ${users?.length || 0} users for email ${normalizedEmail}`);
    
    if (users && users.length > 0) {
      console.log(`[Management API] Found user:`, JSON.stringify({
        user_id: users[0].user_id,
        email: users[0].email,
        name: users[0].name
      }, null, 2));
      return users[0];
    } else {
      console.log(`[Management API] No users found with that email`);
      
      // Try multiple methods to find ANY users in the system
      try {
        console.log(`[Management API] Trying different methods to find any users in the system...`);
        
        // Method 1: Get all users (standard approach)
        console.log(`[Management API] Method 1: Listing up to 100 users with no query...`);
        const sampleUsers = await client.users.getAll({
          per_page: 100,
          fields: 'user_id,email,created_at',
          include_fields: true
        });
        
        console.log(`[Management API] Method 1 users count: ${sampleUsers?.length || 0}`);
        
        if (sampleUsers && sampleUsers.length > 0) {
          console.log(`[Management API] Found users with Method 1`);
          const sanitizedEmails = sampleUsers.map(u => {
            if (!u.email) return 'no-email';
            return u.email.replace(/^(.)(.*)@(.*)$/, '$1***@$3'); // Sanitize emails for privacy
          });
          console.log(`[Management API] Sample user emails (sanitized):`, sanitizedEmails);
          
          // Try to log creation times to see if users are recent
          const creationDates = sampleUsers.map(u => u.created_at).filter(Boolean);
          if (creationDates.length > 0) {
            console.log(`[Management API] Sample user creation dates:`, creationDates);
          }
        } else {
          // Method 2: Try with a direct API call instead of wildcard
          console.log(`[Management API] Method 2: Using direct API instead of wildcards...`);
          try {
            // Get the access token
            const token = await client.tokenProvider.getAccessToken();
            
            // Get all users directly without search
            const response = await fetch(`https://${domain}/api/v2/users?per_page=100`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const wildcardUsers = await response.json();
              console.log(`[Management API] Method 2 users count: ${wildcardUsers?.length || 0}`);
              
              if (wildcardUsers && wildcardUsers.length > 0) {
                console.log(`[Management API] Found users with direct API call`);
                const wildcardEmails = wildcardUsers.map(u => {
                  if (!u.email) return 'no-email';
                  return u.email.replace(/^(.)(.*)@(.*)$/, '$1***@$3');
                });
                console.log(`[Management API] Sample user emails (sanitized):`, wildcardEmails);
              } else {
                console.log(`[Management API] No users found with direct API call`);
              }
            } else {
              console.error(`[Management API] Direct API call failed: ${response.status}`);
            }
          } catch (directError) {
            console.error(`[Management API] Error in direct API call:`, directError.message);
          }
          
          // Method 3: Check total count via connection stats
          console.log(`[Management API] Method 3: Checking tenant stats...`);
          try {
            const stats = await client.stats.getActiveUsersCount();
            console.log(`[Management API] Tenant active users count:`, stats);
          } catch (statsError) {
            console.error(`[Management API] Error getting stats: ${statsError.message}`);
          }
          
          console.log(`[Management API] API returned 0 users with all methods - potential permission issue or empty tenant`);
        }
      } catch (sampleError) {
        console.error(`[Management API] Error listing sample users:`, sampleError.message);
        console.error(`[Management API] Error details:`, sampleError);
      }
      
      return null;
    }
  } catch (error) {
    console.error('[Management API] Error in getUserByEmail API route:', error);
    
    // Log detailed error information
    console.error(`[Management API] Error type: ${error.name}`);
    console.error(`[Management API] Error message: ${error.message}`);
    console.error(`[Management API] Error status: ${error.statusCode}`);
    
    if (error.response) {
      console.error(`[Management API] Response body:`, error.response.body);
    }
    
    // Specific error handling for common Management API issues
    if (error.statusCode === 403) {
      console.error('[Management API] Permission denied when accessing Management API. Check client credentials and scopes.');
    } else if (error.statusCode === 429) {
      console.error('[Management API] Rate limit exceeded when accessing Management API.');
    } else if (error.statusCode === 401) {
      console.error('[Management API] Unauthorized. Check client credentials and make sure the token is valid.');
    }
    
    return null;
  }
}

/**
 * Update user metadata in Auth0
 * @param {string} userId - Auth0 user ID
 * @param {Object} metadata - Metadata to update
 * @returns {Object|null} Updated user or null on error
 */
async function updateUserMetadata(userId, metadata) {
  try {
    if (!userId) {
      console.error('[Management API] User ID is required for metadata update');
      return null;
    }
    
    if (!metadata || typeof metadata !== 'object') {
      console.error('[Management API] Valid metadata object is required for update');
      return null;
    }
    
    console.log(`[Management API] Updating metadata for user ${userId}`);
    console.log(`[Management API] Metadata keys: ${Object.keys(metadata).join(', ')}`);
    
    // Get Management client credentials for logging
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    
    console.log(`[Management API] Using domain: ${domain}`);
    console.log(`[Management API] Using Dashboard client ID: ${clientId?.substring(0, 5)}...`);
    
    // Get a management client
    const client = getManagementClient();
    
    // Attempt to first get the user to verify existence and access
    console.log(`[Management API] Verifying user ${userId} exists before updating metadata`);
    try {
      const existingUser = await client.users.get({ id: userId });
      console.log(`[Management API] User found, current email: ${existingUser.email}`);
    } catch (userError) {
      console.error(`[Management API] Error getting user before metadata update: ${userError.message}`);
      console.log(`[Management API] Continuing with update attempt anyway`);
    }
    
    // Perform the update
    console.log(`[Management API] Executing metadata update`);
    const result = await client.users.update(
      { id: userId }, 
      { user_metadata: metadata }
    );
    
    console.log(`[Management API] Metadata update successful for user ${userId}`);
    return result;
  } catch (error) {
    console.error('[Management API] Error updating user metadata:', error);
    
    // Log detailed error information
    console.error(`[Management API] Error type: ${error.name}`);
    console.error(`[Management API] Error message: ${error.message}`);
    console.error(`[Management API] Error status: ${error.statusCode}`);
    
    if (error.response) {
      console.error(`[Management API] Response body:`, error.response.body);
    }
    
    // Specific error handling for common Management API issues
    if (error.statusCode === 403) {
      console.error('[Management API] Permission denied when updating user metadata. Check client credentials and scopes.');
    } else if (error.statusCode === 429) {
      console.error('[Management API] Rate limit exceeded when updating user metadata.');
    } else if (error.statusCode === 400) {
      console.error(`[Management API] Bad request when updating metadata: ${error.message}`);
    } else if (error.statusCode === 401) {
      console.error('[Management API] Unauthorized. Check client credentials and make sure the token is valid.');
    }
    
    return null;
  }
}

/**
 * API route handler for Auth0 Management operations
 */
export default async function handler(req, res) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  console.log(`[Management API] [${requestId}] Request received`);
  
  try {
    // Log request details
    console.log(`[Management API] [${requestId}] Request method: ${req.method}`);
    console.log(`[Management API] [${requestId}] Request headers:`, JSON.stringify({
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'] || 'unknown'
    }, null, 2));
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log(`[Management API] [${requestId}] Rejecting non-POST request`);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get the operation type from the request body
    const { operation, ...params } = req.body;
    
    console.log(`[Management API] [${requestId}] Operation: ${operation || 'not specified'}`);
    console.log(`[Management API] [${requestId}] Parameters:`, JSON.stringify(params, null, 2));
    
    if (!operation) {
      console.log(`[Management API] [${requestId}] Rejecting request with no operation`);
      return res.status(400).json({ error: 'Operation not specified' });
    }
    
    console.log(`[Management API] [${requestId}] Auth0 Management API received request for operation: ${operation}`);
    
    // For signup flow operations, don't require authentication
    const isPublicOperation = 
      operation === 'checkUserExists' || 
      operation === 'getUserByEmail';
    
    console.log(`[Management API] [${requestId}] Is public operation: ${isPublicOperation}`);
    
    // For protected operations, verify authentication
    if (!isPublicOperation) {
      console.log(`[Management API] [${requestId}] Verifying authentication for protected operation`);
      try {
        const session = await auth0.getSession(req, res);
        if (!session) {
          console.log(`[Management API] [${requestId}] No session found, rejecting`);
          return res.status(401).json({ error: 'Not authenticated' });
        }
        console.log(`[Management API] [${requestId}] Authentication verified for user: ${session.user.sub}`);
      } catch (authError) {
        console.error(`[Management API] [${requestId}] Authentication error:`, authError);
        return res.status(401).json({ error: 'Authentication error', message: authError.message });
      }
    }
    
    // Handle different operation types
    switch (operation) {
      case 'getUserByEmail': {
        console.log(`[Management API] [${requestId}] Processing getUserByEmail operation`);
        
        const { email } = params;
        if (!email) {
          console.log(`[Management API] [${requestId}] Missing email parameter`);
          return res.status(400).json({ error: 'Email is required' });
        }
        
        console.log(`[Management API] [${requestId}] Looking up user by email: ${email}`);
        const user = await getUserByEmail(email);
        
        console.log(`[Management API] [${requestId}] User lookup result: ${user ? 'Found' : 'Not found'}`);
        return res.status(200).json({ 
          user,
          exists: !!user,
          requestId: requestId
        });
      }
      
      case 'checkUserExists': {
        console.log(`[Management API] [${requestId}] Processing checkUserExists operation`);
        
        const { email } = params;
        if (!email) {
          console.log(`[Management API] [${requestId}] Missing email parameter`);
          return res.status(400).json({ error: 'Email is required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[Management API] [${requestId}] Checking if user exists with email: ${normalizedEmail}`);
        
        const user = await getUserByEmail(normalizedEmail);
        console.log(`[Management API] [${requestId}] User existence check result: ${user ? 'User exists' : 'User does not exist'}`);
        
        return res.status(200).json({ 
          exists: !!user,
          auth0Exists: !!user,
          requestId: requestId
        });
      }
      
      case 'updateUserMetadata': {
        console.log(`[Management API] [${requestId}] Processing updateUserMetadata operation`);
        
        const { userId, metadata } = params;
        if (!userId) {
          console.log(`[Management API] [${requestId}] Missing userId parameter`);
          return res.status(400).json({ error: 'User ID is required' });
        }
        
        if (!metadata || typeof metadata !== 'object') {
          console.log(`[Management API] [${requestId}] Invalid metadata format`);
          return res.status(400).json({ error: 'Valid metadata object is required' });
        }
        
        console.log(`[Management API] [${requestId}] Updating metadata for user: ${userId}`);
        console.log(`[Management API] [${requestId}] Metadata keys: ${Object.keys(metadata).join(', ')}`);
        
        const result = await updateUserMetadata(userId, metadata);
        
        if (!result) {
          console.log(`[Management API] [${requestId}] Metadata update failed`);
          return res.status(500).json({ error: 'Failed to update user metadata' });
        }
        
        console.log(`[Management API] [${requestId}] Metadata update successful`);
        return res.status(200).json({ 
          success: true,
          user: result,
          requestId: requestId
        });
      }
      
      default:
        console.log(`[Management API] [${requestId}] Unsupported operation: ${operation}`);
        return res.status(400).json({ error: `Unsupported operation: ${operation}` });
    }
  } catch (error) {
    console.error(`[Management API] [${requestId}] Error in Auth0 Management API:`, error);
    console.error(`[Management API] [${requestId}] Error stack: ${error.stack}`);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      requestId: requestId
    });
  } finally {
    console.log(`[Management API] [${requestId}] Request completed`);
  }
}