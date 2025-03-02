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
        // Always request a fresh copy from the Management API if possible
        if (shouldAttemptAuth0ManagementAPI()) {
          try {
            // Get the latest user data from Auth0 Management API
            console.log(`Fetching fresh user data from Auth0 for user ${userId}`);
            const userData = await auth0Client.getUser({ id: userId });
            
            if (userData && userData.user_metadata) {
              // Return the fresh metadata directly
              console.log("Got fresh user_metadata from Auth0 Management API:", {
                userId,
                keys: Object.keys(userData.user_metadata),
                onboardingCompleted: userData.user_metadata.onboardingCompleted,
                onboardingCompletedType: typeof userData.user_metadata.onboardingCompleted
              });
              
              return res.status(200).json(userData.user_metadata);
            }
          } catch (managementError) {
            console.warn("Failed to get fresh data from Management API:", managementError.message);
            // Continue to fallbacks below
          }
        }
        
        // Fallback 1: Use session metadata
        const sessionMetadata = session.user.user_metadata || {};
        
        // Fallback 2: Use in-memory store
        const storedMetadata = metadataStore.get(userId) || {};
        
        // Combine metadata from both sources
        const combinedMetadata = { ...sessionMetadata, ...storedMetadata };
        
        console.log("METADATA GET REQUEST (from fallbacks):", {
          userId,
          sessionMetadataKeys: Object.keys(sessionMetadata),
          storedMetadataKeys: Object.keys(storedMetadata),
          onboardingCompleted: combinedMetadata.onboardingCompleted,
          onboardingCompletedType: typeof combinedMetadata.onboardingCompleted,
          combinedMetadata: JSON.stringify(combinedMetadata)
        });
        
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
      
      console.log("METADATA UPDATE REQUEST:", {
        userId,
        updateType: typeof updates,
        updateKeys: updates ? Object.keys(updates) : [],
        updateValues: updates ? JSON.stringify(updates) : "none"
      });
      
      // Validate updates
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid metadata updates' });
      }

      try {
        // Get current metadata state from session and memory
        const sessionMetadata = session.user.user_metadata || {};
        const storedMetadata = metadataStore.get(userId) || {};
        const currentMetadata = { ...sessionMetadata, ...storedMetadata };
        
        // Merge with new updates
        const newMetadata = { ...currentMetadata, ...updates };
        
        // Special handling for onboardingCompleted to ensure it's a boolean
        if ('onboardingCompleted' in newMetadata) {
          // Convert to true boolean (not string, number, etc)
          newMetadata.onboardingCompleted = newMetadata.onboardingCompleted === true;
          console.log("Ensuring onboardingCompleted is boolean:", newMetadata.onboardingCompleted);
          
          // Add timestamp when onboarding was completed
          if (newMetadata.onboardingCompleted === true && !newMetadata.onboardingCompletedAt) {
            newMetadata.onboardingCompletedAt = new Date().toISOString();
          }
        }
        
        // First attempt to update directly in Auth0
        let auth0UpdateSuccessful = false;
        
        if (shouldAttemptAuth0ManagementAPI()) {
          try {
            console.log(`Updating metadata in Auth0 Management API for user ${userId}...`);
            
            // Make 3 attempts to update in Auth0 with exponential backoff
            const updateWithRetry = async (retries = 3, delay = 500) => {
              try {
                await auth0Client.updateUserMetadata({ id: userId }, newMetadata);
                return true;
              } catch (updateError) {
                if (retries > 1) {
                  console.log(`Auth0 update failed, retrying in ${delay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return updateWithRetry(retries - 1, delay * 2);
                }
                throw updateError;
              }
            };
            
            auth0UpdateSuccessful = await updateWithRetry();
            if (auth0UpdateSuccessful) {
              console.log('Auth0 metadata update successful');
            }
          } catch (auth0Error) {
            console.warn('Auth0 Management API update failed after retries:', auth0Error.message);
            console.log('Falling back to in-memory metadata storage');
          }
        }
        
        // Always store in memory for this session as a fallback
        metadataStore.set(userId, newMetadata);
        
        // Log the final metadata
        console.log("METADATA SAVED:", {
          userId,
          metadataKeys: Object.keys(newMetadata),
          onboardingCompleted: newMetadata.onboardingCompleted,
          onboardingCompletedType: typeof newMetadata.onboardingCompleted,
          auth0UpdateSuccessful: auth0UpdateSuccessful,
          inMemoryBackupUsed: true
        });
        
        // Return the updated metadata
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