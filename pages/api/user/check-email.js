import { getUserByEmail } from '../../../lib/userProfile';
import auth0Client from '../../../lib/auth0';

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

    // Check user existence in both Airtable and Auth0
    try {
      // First check if user exists in Airtable
      console.log(`Checking if user exists in Airtable with email: ${email}`);
      const airtableUser = await getUserByEmail(email);
      const airtableExists = !!airtableUser;
      console.log(`Airtable user existence: ${airtableExists}`);
      
      // Then check if user exists in Auth0
      console.log(`Checking if user exists in Auth0 with email: ${email}`);
      const auth0Exists = await auth0Client.checkUserExistsByEmail(email);
      console.log(`Auth0 user existence: ${auth0Exists}`);
      
      // User exists only if they exist in Auth0
      // This way, if user is deleted from Auth0 but still in Airtable,
      // they'll be treated as a new user
      const userExists = auth0Exists;
      
      // Return information about where the user exists
      return res.status(200).json({ 
        exists: userExists,
        airtableExists: airtableExists,
        auth0Exists: auth0Exists,
        message: userExists ? 'User exists in Auth0' : 'User does not exist in Auth0',
        // Include Airtable user ID if it exists (for updating during signup)
        airtableId: airtableExists ? airtableUser.contactId : null
      });
    } catch (error) {
      console.error('Error checking user existence:', error);
      
      // Don't return error status - better to let user continue with signup
      // than to block them incorrectly
      return res.status(200).json({
        exists: false,
        airtableExists: false,
        auth0Exists: false,
        message: 'Error checking user existence, continuing with signup'
      });
    }
  } catch (error) {
    console.error('Unhandled error in API handler:', error);
    return res.status(200).json({ 
      exists: false,
      airtableExists: false,
      auth0Exists: false,
      message: 'Error checking user, continuing with signup'
    });
  }
}