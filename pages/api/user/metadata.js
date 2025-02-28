import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import auth0 from '../../../lib/auth0';

/**
 * API endpoint to get and update user metadata
 */
export default withApiAuthRequired(async function userMetadata(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // GET request - return user metadata
    if (req.method === 'GET') {
      // Get user from session
      const { user } = session;
      
      // Return user_metadata or empty object
      return res.status(200).json(user.user_metadata || {});
    }
    
    // POST request - update user metadata
    if (req.method === 'POST') {
      const userId = session.user.sub;
      const updates = req.body;
      
      // Validate updates
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid metadata updates' });
      }

      try {
        // First get current user metadata 
        const userInfo = await auth0.management.getUser({ id: userId });
        
        // Merge existing metadata with updates
        const currentMetadata = userInfo.user_metadata || {};
        const newMetadata = { ...currentMetadata, ...updates };
        
        // Update user metadata
        await auth0.management.updateUserMetadata({ id: userId }, newMetadata);
        
        // Return updated metadata
        return res.status(200).json(newMetadata);
      } catch (error) {
        console.error('Error updating user metadata:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Provide more detailed error messages for common issues
        if (error.message && error.message.includes('Missing required Auth0 environment variables')) {
          return res.status(500).json({ 
            error: 'Auth0 configuration error: Missing required environment variables',
            details: 'Check AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET'
          });
        }
        
        if (error.statusCode === 401 || error.statusCode === 403) {
          return res.status(error.statusCode).json({ 
            error: 'Auth0 API authentication error',
            details: 'Check API credentials and permissions'
          });
        }
        
        // Fallback message
        return res.status(500).json({ 
          error: 'Failed to update user metadata', 
          details: error.message 
        });
      }
    }
    
    // Other HTTP methods not supported
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in userMetadata API:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Check if it's a session-related error
    if (error.message && error.message.includes('session')) {
      return res.status(401).json({ 
        error: 'Authentication error',
        details: 'Unable to get user session. Please try logging in again.'
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});