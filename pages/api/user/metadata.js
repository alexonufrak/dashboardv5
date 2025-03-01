import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import auth0Client from '../../../lib/auth0';

/**
 * In-memory metadata store as fallback for when Auth0 Management API is unavailable
 * This is used when:
 * 1. The proper Auth0 Machine-to-Machine credentials are not configured
 * 2. There are temporary issues with the Auth0 Management API
 * 
 * Note: This is NOT persistent across server restarts or in a multi-server environment.
 * It's a temporary fallback to ensure the app remains functional.
 */
const metadataStore = new Map();

/**
 * Determine if we should attempt to use the Auth0 Management API
 * Checks if the required environment variables exist
 */
const shouldAttemptAuth0ManagementAPI = () => {
  return !!(
    process.env.AUTH0_MGMT_API_DOMAIN || 
    (process.env.AUTH0_MGMT_API_CLIENT_ID && process.env.AUTH0_MGMT_API_CLIENT_SECRET)
  );
};

/**
 * API endpoint to get and update user metadata
 * Uses Auth0 Management API with fallback to in-memory storage
 */
export default withApiAuthRequired(async function userMetadata(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    
    // GET request - return user metadata
    if (req.method === 'GET') {
      try {
        // First try to get metadata from session
        const sessionMetadata = session.user.user_metadata || {};
        
        // Try to get from our in-memory store
        const storedMetadata = metadataStore.get(userId) || {};
        
        // Combine metadata from both sources
        const combinedMetadata = { ...sessionMetadata, ...storedMetadata };
        
        return res.status(200).json(combinedMetadata);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        // Return whatever we can find in the session
        return res.status(200).json(session.user.user_metadata || {});
      }
    }
    
    // POST request - update user metadata
    if (req.method === 'POST') {
      const updates = req.body;
      
      // Validate updates
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid metadata updates' });
      }

      try {
        // Get current metadata state
        const sessionMetadata = session.user.user_metadata || {};
        const storedMetadata = metadataStore.get(userId) || {};
        const currentMetadata = { ...sessionMetadata, ...storedMetadata };
        
        // Merge with new updates
        const newMetadata = { ...currentMetadata, ...updates };
        
        // First, store in memory as a fallback (always do this)
        metadataStore.set(userId, newMetadata);
        
        // Attempt to use Auth0 Management API if configured properly
        if (shouldAttemptAuth0ManagementAPI()) {
          try {
            console.log(`Attempting to use Auth0 Management API for user ${userId}...`);
            
            // Update the metadata in Auth0 using the update method
            await auth0Client.updateUserMetadata({ id: userId }, newMetadata);
            
            console.log('Auth0 metadata update successful');
          } catch (auth0Error) {
            // Log API errors but don't fail the request since we have in-memory backup
            console.warn('Auth0 Management API access failed:', auth0Error.message);
            console.log('Continuing to use in-memory metadata storage');
            
            // Log more details for debugging in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Auth0 API error details:', auth0Error);
            }
          }
        } else {
          console.log('Auth0 Management API not configured, using in-memory storage only');
        }
        
        // Return the updated metadata, whether it was updated in Auth0 or only in memory
        return res.status(200).json(newMetadata);
      } catch (error) {
        console.error('Error updating user metadata:', error);
        
        // Last resort - try to handle the update using just the session and in-memory store
        try {
          const sessionMetadata = session.user.user_metadata || {};
          const newMetadata = { ...sessionMetadata, ...updates };
          metadataStore.set(userId, newMetadata);
          return res.status(200).json(newMetadata);
        } catch (fallbackError) {
          return res.status(500).json({ 
            error: 'Failed to update metadata',
            details: error.message
          });
        }
      }
    }
    
    // Other HTTP methods not supported
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in userMetadata API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});