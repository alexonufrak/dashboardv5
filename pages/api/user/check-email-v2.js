import { auth0 } from '@/lib/auth0';
import { users, institutions } from '@/lib/airtable/entities';
import { checkUserExists } from '@/lib/auth0-management';

/**
 * V2 API endpoint to check if a user exists by email and verify institution
 * This uses the refactored Airtable domain-driven entities
 */
export default async function handler(req, res) {
  try {
    // For POST requests during signup flow, allow without authentication
    if (req.method === 'POST') {
      console.log('Allowing unauthenticated POST request to check-email-v2 for signup flow');
      return handlerImpl(req, res);
    }
    
    // For GET requests, require authentication
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the implementation with the authenticated session
    return handlerImpl(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

/**
 * Implementation function that handles the actual email check logic
 */
async function handlerImpl(req, res) {
  // Allow both POST and GET methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get email from either query params (GET) or body (POST)
    const email = req.method === 'GET' ? req.query.email : req.body.email;
    console.log(`API received check-email-v2 request for: ${email}`);

    if (!email) {
      console.log('Email is required but was not provided');
      return res.status(400).json({ 
        error: 'Email is required',
        exists: false
      });
    }
    
    // Normalize the email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    
    // For GET requests, do a comprehensive institution check
    if (req.method === 'GET') {
      try {
        // Check if email domain matches an institution using entity approach
        const institution = await institutions.lookupInstitutionByEmail(normalizedEmail);
        
        // Get current user's institution for comparison
        let userInstitutionId = null;
        let userInstitutionName = null;
        
        // Try to get user's institution from session if available
        const session = req.query.session ? JSON.parse(req.query.session) : null;
        if (session && session.user) {
          try {
            const userProfile = await users.getUserByAuth0Id(session.user.sub) || 
                               await users.getUserByEmail(session.user.email);
            
            if (userProfile) {
              userInstitutionId = userProfile.institutionId;
              userInstitutionName = userProfile.institution?.name || "Your institution";
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
        const existingUser = await users.getUserByEmail(normalizedEmail);
        
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

    // For POST requests - check user existence in both Airtable and Auth0
    try {
      console.log(`Working with normalized email: ${normalizedEmail}`);
      
      // Check if user exists in Airtable using entity approach
      console.log(`Checking if user exists in Airtable with email: ${normalizedEmail}`);
      const airtableUser = await users.getUserByEmail(normalizedEmail);
      const airtableExists = !!airtableUser;
      console.log(`Airtable user existence: ${airtableExists}`);
      
      // Check if user exists in Auth0 using the Management API
      console.log(`Calling Auth0 Management API to check user existence: ${normalizedEmail}`);
      const auth0Exists = await checkUserExists(normalizedEmail);
      console.log(`Auth0 user existence result: ${auth0Exists}`);
      
      // Check institution information
      let institution = null;
      try {
        institution = await institutions.lookupInstitutionByEmail(normalizedEmail);
      } catch (instError) {
        console.error('Error checking institution for email:', instError);
      }
      
      // Generate message based on existence status
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
        // Include institution information if available
        institution: institution ? institution.name : null,
        institutionId: institution ? institution.id : null,
        // Include API version for tracking
        _meta: {
          version: 'v2',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error checking user existence:', error);
      
      // Don't return error status - better to let user continue with signup
      return res.status(200).json({
        exists: false,
        airtableExists: false,
        auth0Exists: false,
        message: 'Error checking user existence, continuing with signup',
        _meta: {
          version: 'v2',
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  } catch (error) {
    console.error('Unhandled error in API handler:', error);
    return res.status(200).json({ 
      exists: false,
      airtableExists: false,
      auth0Exists: false,
      message: 'Error checking user, continuing with signup',
      _meta: {
        version: 'v2',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
}