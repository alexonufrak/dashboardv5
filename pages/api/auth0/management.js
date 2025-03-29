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
 * Get Auth0 Management API access token
 * @param {Object} client - Auth0 Management client
 * @param {string} domain - Auth0 domain
 * @returns {Promise<string>} Access token
 */
async function getManagementToken(client, domain) {
  // Get the access token - handle both v4 and older SDK versions
  let token;
  
  try {
    // Try using the token provider if available
    if (client.tokenProvider && typeof client.tokenProvider.getAccessToken === 'function') {
      token = await client.tokenProvider.getAccessToken();
    } else if (client.getAccessToken) {
      token = await client.getAccessToken();
    }
  } catch (tokenError) {
    console.log('[Management API] Error using client tokenProvider:', tokenError.message);
  }
  
  // If we don't have a token yet, get one manually
  if (!token) {
    console.log('[Management API] Getting token manually via client credentials');
    
    // Prepare client credentials parameters
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', process.env.AUTH0_CLIENT_ID);
    tokenParams.append('client_secret', process.env.AUTH0_CLIENT_SECRET);
    tokenParams.append('audience', `https://${domain}/api/v2/`);
    
    // Make token request
    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    token = tokenData.access_token;
  }
  
  if (!token) {
    throw new Error('Could not obtain access token for Management API');
  }
  
  return token;
}

/**
 * Get user by email from Auth0
 * Uses direct API call which is the most reliable method
 * 
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserByEmail(email) {
  try {
    if (!email) {
      console.log('[Management API] No email provided to getUserByEmail API');
      return null;
    }
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Management API] Looking up Auth0 user with email: ${normalizedEmail}`);
    
    // Get domain and client info for logging and token acquisition
    const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    
    console.log(`[Management API] Using domain: ${domain}`);
    console.log(`[Management API] Using client ID: ${clientId?.substring(0, 5)}...`);
    
    // Get a management client
    const client = getManagementClient();
    
    // Get access token
    const token = await getManagementToken(client, domain);
    console.log('[Management API] Successfully obtained access token');
    
    // Use the official Auth0 API endpoint for finding users by email
    const url = `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(normalizedEmail)}`;
    console.log(`[Management API] Fetching from: ${url}`);
    
    // Make the API request
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[Management API] API response status: ${response.status}`);
    
    if (response.ok) {
      const users = await response.json();
      console.log(`[Management API] API returned ${users?.length || 0} users`);
      
      if (users && users.length > 0) {
        console.log(`[Management API] Found user with ID: ${users[0].user_id}`);
        return users[0];
      }
      
      console.log(`[Management API] No users found with email: ${normalizedEmail}`);
      
      // If user not found, verify API is working by getting total count
      try {
        const statsResponse = await fetch(`https://${domain}/api/v2/stats/active-users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (statsResponse.ok) {
          const userCount = await statsResponse.text();
          console.log(`[Management API] Tenant has ${userCount} total active users`);
        }
      } catch (statsError) {
        console.log(`[Management API] Error getting user count: ${statsError.message}`);
      }
    } else {
      const errorText = await response.text();
      console.error(`[Management API] API request failed: ${response.status} ${response.statusText}`);
      console.error(`[Management API] Error details: ${errorText}`);
    }
    
    return null;
  } catch (error) {
    console.error('[Management API] Error in getUserByEmail:', error);
    
    // Log detailed error information
    console.error(`[Management API] Error type: ${error.name}`);
    console.error(`[Management API] Error message: ${error.message}`);
    
    return null;
  }
}

/**
 * Update user metadata in Auth0
 * @param {string} userId - Auth0 user ID
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object|null>} Updated user or null on error
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
    
    // Get a management client
    const client = getManagementClient();
    
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
    console.error(`[Management API] Error message: ${error.message}`);
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
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get the operation type from the request body
    const { operation, ...params } = req.body;
    
    console.log(`[Management API] [${requestId}] Operation: ${operation || 'not specified'}`);
    
    if (!operation) {
      return res.status(400).json({ error: 'Operation not specified' });
    }
    
    // For signup flow operations, don't require authentication
    const isPublicOperation = 
      operation === 'checkUserExists' || 
      operation === 'getUserByEmail';
    
    // For protected operations, verify authentication
    if (!isPublicOperation) {
      try {
        const session = await auth0.getSession(req, res);
        if (!session) {
          return res.status(401).json({ error: 'Not authenticated' });
        }
      } catch (authError) {
        return res.status(401).json({ error: 'Authentication error', message: authError.message });
      }
    }
    
    // Handle different operation types
    switch (operation) {
      case 'getUserByEmail': {
        const { email } = params;
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = await getUserByEmail(email);
        
        console.log(`[Management API] [${requestId}] User lookup result: ${user ? 'Found' : 'Not found'}`);
        return res.status(200).json({ 
          user,
          exists: !!user,
          requestId: requestId
        });
      }
      
      case 'checkUserExists': {
        const { email } = params;
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const user = await getUserByEmail(normalizedEmail);
        
        console.log(`[Management API] [${requestId}] User existence check result: ${user ? 'User exists' : 'User does not exist'}`);
        return res.status(200).json({ 
          exists: !!user,
          auth0Exists: !!user,
          requestId: requestId
        });
      }
      
      case 'updateUserMetadata': {
        const { userId, metadata } = params;
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }
        
        if (!metadata || typeof metadata !== 'object') {
          return res.status(400).json({ error: 'Valid metadata object is required' });
        }
        
        const result = await updateUserMetadata(userId, metadata);
        
        if (!result) {
          return res.status(500).json({ error: 'Failed to update user metadata' });
        }
        
        return res.status(200).json({ 
          success: true,
          user: result,
          requestId: requestId
        });
      }
      
      default:
        return res.status(400).json({ error: `Unsupported operation: ${operation}` });
    }
  } catch (error) {
    console.error(`[Management API] [${requestId}] Error:`, error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      requestId: requestId
    });
  } finally {
    console.log(`[Management API] [${requestId}] Request completed`);
  }
}