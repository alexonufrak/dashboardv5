import { auth0ManagementClient } from '../../../lib/auth0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        exists: false
      });
    }

    try {
      // Get Auth0 Management API client
      const auth0Management = await auth0ManagementClient();
      
      try {
        // Search for users with this email
        const users = await auth0Management.users.getByEmail(email);
        
        // Check if any users were found
        const userExists = users && users.length > 0;
  
        return res.status(200).json({ 
          exists: userExists,
          message: userExists ? 'User exists' : 'User does not exist'
        });
      } catch (userError) {
        // If Auth0 returns a 404, the user doesn't exist
        if (userError.statusCode === 404) {
          return res.status(200).json({
            exists: false,
            message: 'User does not exist'
          });
        }
        throw userError;
      }
    } catch (auth0Error) {
      // For other Auth0 errors, log and continue with signup
      console.error('Error with Auth0 Management API:', auth0Error);
      
      // As a fallback, just return false - the worst that happens is the user goes through signup again
      return res.status(200).json({
        exists: false,
        message: 'Unable to verify user existence, continuing with signup'
      });
    }
  } catch (error) {
    console.error('Unhandled error checking user:', error);
    // Don't return error status, just continue with signup
    return res.status(200).json({ 
      exists: false, 
      message: 'Error checking user existence, continuing with signup'
    });
  }
}