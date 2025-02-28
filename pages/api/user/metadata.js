import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { auth0ManagementClient } from '../../../lib/auth0';

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
        // Get the Auth0 Management API client
        const auth0Management = await auth0ManagementClient();
        
        // First get current metadata
        const userInfo = await auth0Management.getUser({ id: userId });
        
        // Merge existing metadata with updates
        const currentMetadata = userInfo.user_metadata || {};
        const newMetadata = { ...currentMetadata, ...updates };
        
        // Update user metadata
        await auth0Management.updateUserMetadata({ id: userId }, newMetadata);
        
        // Return updated metadata
        return res.status(200).json(newMetadata);
      } catch (error) {
        console.error('Error updating user metadata:', error);
        return res.status(500).json({ error: 'Failed to update user metadata' });
      }
    }
    
    // Other HTTP methods not supported
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in userMetadata API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});