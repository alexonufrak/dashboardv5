import { getUserByEmail } from '../../../lib/userProfile';
import auth0Client from '../../../lib/auth0';
import { lookupInstitutionByEmail, getUserProfile } from '../../../lib/airtable';

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
    
    // For GET requests, do a comprehensive institution check
    if (req.method === 'GET') {
      // Normalize the email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim();
      
      try {
        // Check if email domain matches an institution
        const institution = await lookupInstitutionByEmail(normalizedEmail);
        
        // Get current user's institution for comparison
        let userInstitutionId = null;
        let userInstitutionName = null;
        
        // Try to get user's institution from session if available
        const session = req.query.session ? JSON.parse(req.query.session) : null;
        if (session && session.user && session.user.email) {
          try {
            const userProfile = await getUserProfile(session.user.sub, session.user.email);
            if (userProfile) {
              // Try to get the institution ID from various possible fields
              userInstitutionId = userProfile.institutionId || 
                                (userProfile.Institution && userProfile.Institution.length > 0 ? 
                                 userProfile.Institution[0] : null) ||
                                (userProfile["Institution (from Education)"] && 
                                 userProfile["Institution (from Education)"].length > 0 ? 
                                 userProfile["Institution (from Education)"][0] : null);
              
              // Get the institution name if available
              userInstitutionName = userProfile.institution?.name || 
                                  userProfile["Name (from Institution)"]?.[0] || 
                                  "Your institution";
            }
          } catch (profileError) {
            console.error('Error getting user profile for domain check:', profileError);
          }
        } else if (req.query.userInstitutionId) {
          // Alternatively, get from query params
          userInstitutionId = req.query.userInstitutionId;
          userInstitutionName = req.query.userInstitutionName || "Your institution";
        }
        
        // Check for domain mismatch
        const mismatch = institution && userInstitutionId && institution.id !== userInstitutionId;
        
        // Check if user exists in Airtable
        const existingUser = await getUserByEmail(normalizedEmail);
        
        return res.status(200).json({
          email: normalizedEmail,
          institution: institution ? institution.name : null,
          institutionId: institution ? institution.id : null,
          userInstitution: userInstitutionName,
          userInstitutionId: userInstitutionId,
          mismatch: mismatch,
          exists: !!existingUser,
          contactId: existingUser ? existingUser.contactId : null
        });
      } catch (error) {
        console.error('Error checking institution for email:', error);
        return res.status(200).json({
          email: normalizedEmail,
          institution: null,
          mismatch: false,
          exists: false
        });
      }
    }

    // Check user existence in both Airtable and Auth0 (for POST requests)
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
      
      // Check institution information
      let institution = null;
      try {
        institution = await lookupInstitutionByEmail(normalizedEmail);
      } catch (instError) {
        console.error('Error checking institution for email:', instError);
      }
      
      // Changed behavior: Only consider a user to exist if found in Auth0
      // If they are only in Airtable, still let them sign up with prefilled data
      
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
        signupMetadata: signupMetadata,
        // Include institution information if available
        institution: institution ? institution.name : null,
        institutionId: institution ? institution.id : null
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