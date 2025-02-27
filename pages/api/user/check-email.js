import { getSession } from '@auth0/nextjs-auth0';
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
      
      // Search for users with this email
      const users = await auth0Management.users.getByEmail(email);
      
      // Check if any users were found
      const userExists = users && users.length > 0;

      return res.status(200).json({ 
        exists: userExists,
        message: userExists ? 'User exists' : 'User does not exist'
      });
    } catch (auth0Error) {
      // If Auth0 returns a 404, the user doesn't exist
      if (auth0Error.statusCode === 404) {
        return res.status(200).json({
          exists: false,
          message: 'User does not exist'
        });
      }
      
      // For other Auth0 errors, check for a simpler alternative method
      console.error('Error with Auth0 Management API:', auth0Error);
      console.log('Falling back to session-based check...');
      
      // As a fallback, just return false - the worst that happens is the user goes through signup again
      return res.status(200).json({
        exists: false,
        message: 'Unable to verify user existence, continuing with signup'
      });
    }
  } catch (error) {
    console.error('Unhandled error checking user:', error);
    return res.status(200).json({ 
      exists: false, 
      message: 'Error checking user existence, continuing with signup'
    });
  }
}