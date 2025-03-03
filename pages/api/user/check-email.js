import { getUserByEmail } from '../../../lib/userProfile';
import auth0Client from '../../../lib/auth0';
import { lookupInstitutionByEmail } from '../../../lib/airtable';

/**
 * API handler to check if a user exists by email and verify institution
 */
export default async function handler(req, res) {
  // Allow both POST and GET methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get email from either query params (GET) or body (POST)
    const email = req.method === 'GET' ? req.query.email : req.body.email;
    console.log(`API received check-email request for: ${email}`);

    if (!email) {
      console.log('Email is required but was not provided');
      return res.status(400).json({ 
        error: 'Email is required',
        exists: false
      });
    }
    
    // For GET requests, do a quick institution check only
    if (req.method === 'GET') {
      // Normalize the email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      
      try {
        // Check if email domain matches an institution
        const institution = await lookupInstitutionByEmail(normalizedEmail);
        
        // Get user's institution from session or query params if available
        const userInstitution = req.query.userInstitution || null;
        
        // Check for domain mismatch
        const mismatch = institution && userInstitution && institution.id !== userInstitution;
        
        return res.status(200).json({
          email: normalizedEmail,
          institution: institution ? institution.name : null,
          institutionId: institution ? institution.id : null,
          mismatch: mismatch
        });
      } catch (error) {
        console.error('Error checking institution for email:', error);
        return res.status(200).json({
          email: normalizedEmail,
          institution: null,
          mismatch: false
        });
      }
    }

    // Check user existence in both Airtable and Auth0
    try {
      // Normalize the email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Working with normalized email: ${normalizedEmail}`);
      
      // First check if user exists in Airtable
      console.log(`Checking if user exists in Airtable with email: ${normalizedEmail}`);
      const airtableUser = await getUserByEmail(normalizedEmail);
      const airtableExists = !!airtableUser;
      console.log(`Airtable user existence: ${airtableExists}`);
      
      // Then check if user exists in Auth0 (with detailed logging in the client function)
      console.log(`Calling Auth0 client to check user existence: ${normalizedEmail}`);
      const auth0Exists = await auth0Client.checkUserExistsByEmail(normalizedEmail);
      console.log(`Auth0 user existence result: ${auth0Exists}`);
      
      // Check for the special case where user exists in Airtable but not in Auth0 via Management API
      // This could happen when user is authorized for web app but not visible to Management API
      const airtableOnlyButLikelyAuthorized = airtableExists && !auth0Exists;
      console.log(`Potential Auth0 visibility issue: ${airtableOnlyButLikelyAuthorized}`);
      
      // In production, we should consider a user as existing if they're in Airtable
      // This ensures users don't create duplicate accounts if there's an Auth0 Management API issue
      // For thorough checking, we'll look at both Auth0 and Airtable
      const userExists = auth0Exists || airtableExists;
      
      // If user exists in Airtable but not in Auth0, prepare signup metadata
      let signupMetadata = null;
      if (airtableExists && !auth0Exists) {
        try {
          console.log(`Preparing Airtable metadata for signup: ${normalizedEmail}`);
          signupMetadata = await auth0Client.getSignupMetadata(normalizedEmail, airtableUser);
          console.log(`Prepared metadata for signup:`, signupMetadata);
        } catch (metadataError) {
          console.error('Error preparing signup metadata:', metadataError);
          // Continue with the check even if metadata preparation fails
        }
      }
      
      // Changed behavior: Only consider a user to exist if found in Auth0
      // If they are only in Airtable, still let them sign up with prefilled data
      
      // Modify the response based on the new behavior:
      // 1. If user exists in Auth0, they should sign in instead (return exists: true)
      // 2. If user only exists in Airtable, let them sign up with prefilled data (return exists: false)
      // 3. If user doesn't exist anywhere, let them sign up (return exists: false)
      
      const message = auth0Exists 
        ? 'User exists in Auth0' 
        : (airtableExists 
           ? 'User exists in Airtable only, allowing signup with prefilled data'
           : 'User does not exist in either system');
      
      return res.status(200).json({ 
        // Only report user as existing if found in Auth0
        exists: auth0Exists,
        airtableExists: airtableExists,
        auth0Exists: auth0Exists,
        message: message,
        // Include Airtable user ID if it exists (for updating during signup)
        airtableId: airtableExists ? airtableUser.contactId : null,
        // Include signup metadata if available (for prefilling)
        signupMetadata: signupMetadata
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