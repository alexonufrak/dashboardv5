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
    
    // Get a management client (credentials configured in lib/auth0.js)
    const client = getManagementClient();
    
    // Search for the user by email using Lucene query syntax
    const users = await client.users.getAll({
      q: `email:"${normalizedEmail}"`,
      search_engine: 'v3',
      fields: 'user_id,email,name,user_metadata',
      include_fields: true
    });
    
    console.log(`Auth0 returned ${users?.length || 0} users for email ${normalizedEmail}`);
    
    return (users && users.length > 0) ? users[0] : null;
  } catch (error) {
    console.error('Error in getUserByEmail API route:', error);
    
    // Specific error handling for common Management API issues
    if (error.statusCode === 403) {
      console.error('Permission denied when accessing Management API. Check client credentials and grants.');
    } else if (error.statusCode === 429) {
      console.error('Rate limit exceeded when accessing Management API.');
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
      console.error('User ID is required for metadata update');
      return null;
    }
    
    if (!metadata || typeof metadata !== 'object') {
      console.error('Valid metadata object is required for update');
      return null;
    }
    
    console.log(`Updating metadata for user ${userId}`);
    
    const client = getManagementClient();
    const result = await client.users.update(
      { id: userId }, 
      { user_metadata: metadata }
    );
    
    return result;
  } catch (error) {
    // Specific error handling for common Management API issues
    if (error.statusCode === 403) {
      console.error('Permission denied when updating user metadata. Check client credentials and scopes.');
    } else if (error.statusCode === 429) {
      console.error('Rate limit exceeded when updating user metadata.');
    } else if (error.statusCode === 400) {
      console.error(`Bad request when updating metadata: ${error.message}`);
    } else {
      console.error('Error updating user metadata:', error);
    }
    
    return null;
  }
}

/**
 * API route handler for Auth0 Management operations
 */
export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get the operation type from the request body
    const { operation, ...params } = req.body;
    
    if (!operation) {
      return res.status(400).json({ error: 'Operation not specified' });
    }
    
    console.log(`Auth0 Management API received request for operation: ${operation}`);
    
    // For signup flow operations, don't require authentication
    const isPublicOperation = 
      operation === 'checkUserExists' || 
      operation === 'getUserByEmail';
    
    // For protected operations, verify authentication
    if (!isPublicOperation) {
      const session = await auth0.getSession(req, res);
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
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
        return res.status(200).json({ 
          user,
          exists: !!user
        });
      }
      
      case 'checkUserExists': {
        const { email } = params;
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`Checking if user exists with email: ${normalizedEmail}`);
        
        const user = await getUserByEmail(normalizedEmail);
        return res.status(200).json({ 
          exists: !!user,
          auth0Exists: !!user
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
          user: result
        });
      }
      
      default:
        return res.status(400).json({ error: `Unsupported operation: ${operation}` });
    }
  } catch (error) {
    console.error(`Error in Auth0 Management API:`, error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}