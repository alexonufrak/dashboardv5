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
        // Initialize Auth0 Management client directly instead of using the helper function
        const { ManagementClient } = require('auth0');
        
        // Get domain from environment variables
        const fullDomain = process.env.AUTH0_ISSUER_BASE_URL || '';
        const domain = fullDomain.includes('https://') 
          ? fullDomain.replace('https://', '') 
          : fullDomain;
        
        if (!domain || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
          throw new Error('Missing required Auth0 environment variables');
        }
        
        // Create the Auth0 Management client
        const auth0Management = new ManagementClient({
          domain: domain,
          clientId: process.env.AUTH0_CLIENT_ID,
          clientSecret: process.env.AUTH0_CLIENT_SECRET,
          scope: 'read:users read:user_idp_tokens update:users update:users_app_metadata',
          audience: `https://${domain}/api/v2/`,
          tokenProvider: {
            enableCache: true,
            cacheTTLInSeconds: 3600
          }
        });
        
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
        console.error('Error details:', error.message, error.stack);
        
        if (error.statusCode === 401) {
          return res.status(401).json({ error: 'Auth0 authentication failed. Check Auth0 credentials.' });
        } else if (error.statusCode === 403) {
          return res.status(403).json({ error: 'Auth0 permission denied. Check Auth0 API scopes.' });
        } else if (error.message.includes('Missing required Auth0 environment variables')) {
          return res.status(500).json({ error: 'Missing Auth0 configuration. Check environment variables.' });
        }
        
        return res.status(500).json({ error: 'Failed to update user metadata: ' + error.message });
      }
    }
    
    // Other HTTP methods not supported
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in userMetadata API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});