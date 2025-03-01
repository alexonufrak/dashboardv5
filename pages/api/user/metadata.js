import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import auth0Client from '../../../lib/auth0';

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
        console.log(`Fetching user info for ${userId} from Auth0...`);
        
        // First get current metadata directly from Auth0
        const userResponse = await auth0Client.getUser({ id: userId });
        const userInfo = userResponse.data || userResponse;
        
        console.log('User info retrieved:', userInfo ? 'success' : 'failed');
        
        // Merge existing metadata with updates
        const currentMetadata = userInfo.user_metadata || {};
        const newMetadata = { ...currentMetadata, ...updates };
        
        console.log(`Updating user metadata for ${userId} in Auth0...`);
        console.log('Metadata to store:', newMetadata);
        
        // Update user metadata in Auth0
        await auth0Client.updateUserMetadata({ id: userId }, newMetadata);
        
        console.log('Metadata update successful');
        
        // Return updated metadata
        return res.status(200).json(newMetadata);
      } catch (error) {
        console.error('Error updating user metadata:', error);
        console.error('Error details:', error.message);
        if (error.stack) console.error('Stack trace:', error.stack);
        
        // Provide more detailed error messages
        let errorMessage = 'Failed to update user metadata';
        let statusCode = 500;
        
        if (error.statusCode === 401 || error.statusCode === 403) {
          errorMessage = 'Auth0 API authentication error. Check API credentials and permissions.';
          statusCode = error.statusCode;
        } else if (error.message && error.message.includes('Missing required Auth0 environment variables')) {
          errorMessage = 'Auth0 configuration is incomplete. Check environment variables.';
        }
        
        return res.status(statusCode).json({ 
          error: errorMessage,
          details: error.message
        });
      }
    }
    
    // Other HTTP methods not supported
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in userMetadata API:', error);
    console.error('Error details:', error.message);
    if (error.stack) console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});