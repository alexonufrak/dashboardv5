import { getUserByEmail } from '../../../lib/userProfile';

/**
 * API handler to check if a user exists by email
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    console.log(`API received check-email request for: ${email}`);

    if (!email) {
      console.log('Email is required but was not provided');
      return res.status(400).json({ 
        error: 'Email is required',
        exists: false
      });
    }

    // Try to get user from the database using email
    try {
      console.log(`Checking if user exists in database with email: ${email}`);
      const user = await getUserByEmail(email);
      
      // If user is found, they exist
      const userExists = !!user;
      console.log(`User existence check result: ${userExists}`);
  
      return res.status(200).json({ 
        exists: userExists,
        message: userExists ? 'User exists' : 'User does not exist'
      });
    } catch (error) {
      console.error('Error checking user existence:', error);
      
      // Don't return error status - better to let user continue with signup
      // than to block them incorrectly
      return res.status(200).json({
        exists: false,
        message: 'Error checking user existence, continuing with signup'
      });
    }
  } catch (error) {
    console.error('Unhandled error in API handler:', error);
    return res.status(200).json({ 
      exists: false, 
      message: 'Error checking user, continuing with signup'
    });
  }
}