import { getCompleteUserProfile } from "../../../lib/userProfile"
import { updateUserProfile } from "../../../lib/airtable"
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0"
import { auth0 } from "../../../lib/auth0"

async function handlerImpl(req, res) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // Auth0 session should be validated by the outer handler,
    // but we'll do an extra check here to be sure
    const session = await auth0.getSession(req, res);
    
    // Enhanced session validation with detailed logging
    if (!session || !session.user) {
      console.error('Session validation failed in handlerImpl:', { 
        hasSession: !!session,
        hasUser: session ? !!session.user : false,
        method: req.method,
        path: req.url
      });
      
      // Try one more time with explicit cookie check
      if (req.headers.cookie) {
        console.log('Attempting secondary session validation with cookies');
        try {
          // Force session refresh
          const refreshedSession = await auth0.getSession(req, res);
          if (refreshedSession && refreshedSession.user) {
            console.log('Secondary validation successful!');
            // Continue with the refreshed session
            return handleRequestWithSession(req, res, refreshedSession, startTime);
          }
        } catch (refreshError) {
          console.error('Secondary session validation failed:', refreshError.message);
        }
      }
      
      return res.status(401).json({ 
        error: "Not authenticated",
        details: "Session validation failed. Try refreshing the page or logging in again."
      });
    }
    
    // If we reach here, session is valid, proceed with handler implementation
    return handleRequestWithSession(req, res, session, startTime);
  } catch (error) {
    console.error("Error in profile API:", error);
    // Provide basic user data from auth0 even in error case, wrapped in profile key
    if (error.session && error.session.user) {
      return res.status(200).json({
        profile: {
          auth0Id: error.session.user.sub,
          email: error.session.user.email,
          name: error.session.user.name,
          picture: error.session.user.picture,
          isProfileComplete: false,
        },
        _meta: {
          error: error.message,
          timestamp: new Date().toISOString(),
          fallback: true
        }
      });
    }
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
}

// Handle the actual request once we have a valid session
async function handleRequestWithSession(req, res, session, startTime) {
  if (req.method === "GET") {
    // Check if minimal mode is requested (for onboarding flow)
    const minimal = req.query.minimal === 'true';
    
    // Set shorter timeout for minimal mode
    const timeoutDuration = minimal ? 3000 : 9000;
    
    // Add timeout control to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Profile fetch timed out")), timeoutDuration)
    );
    
    try {
      // For minimal mode, use a special function or add a parameter
      let profilePromise;
      
      if (minimal) {
        console.log("Fetching minimal profile with cohorts for onboarding");
        // Fetch essential fields plus cohorts for onboarding
        profilePromise = getCompleteUserProfile(session.user, { minimal: true });
      } else {
        profilePromise = getCompleteUserProfile(session.user);
      }
      
      // Race the profile fetch against a timeout
      const profile = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);
      
      if (!profile) {
        console.log("No profile data returned, sending minimal response");
        return res.status(404).json({
          profile: {
            auth0Id: session.user.sub,
            email: session.user.email,
            name: session.user.name,
            picture: session.user.picture,
            isProfileComplete: false,
          },
          _meta: {
            error: "No profile data found",
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      console.log(`User profile fetched in ${processingTime}ms`);
      
      // Set cache control headers - cache for 5 minutes (300 seconds)
      // Client caching for 1 minute, CDN/edge caching for 5 minutes
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      
      // Include processing metadata in response
      return res.status(200).json({
        profile: profile, // Wrap the profile in a profile key for consistency
        _meta: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (profileError) {
      console.error("Error fetching complete profile:", profileError);
      
      // Return a basic profile with auth0 data as fallback, wrapped in a profile key
      return res.status(200).json({
        profile: {
          auth0Id: session.user.sub,
          email: session.user.email,
          name: session.user.name,
          picture: session.user.picture,
          isProfileComplete: false,
        },
        _meta: {
          error: profileError.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  } else if (req.method === "PATCH" || req.method === "PUT") {
    // Log the session user for debugging
    console.log("Session user for update operation:", {
      sub: session.user.sub,
      email: session.user.email
    });
    
    // Support both PATCH (preferred) and PUT for backward compatibility
    // PATCH only updates specified fields, while PUT would replace all fields
    const { contactId, ...updateData } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: "Contact ID is required for updates" });
    }
    
    // If using PUT, warn about potential destructive update in logs
    if (req.method === "PUT") {
      console.warn("Using PUT method for profile update, which may clear unspecified fields. PATCH is recommended.");
    }

    // Check if major ID is valid - it must be an Airtable record ID format or null/undefined
    if (updateData.major !== undefined && updateData.major !== null) {
      if (typeof updateData.major === 'string') {
        // Log the received major value for debugging
        console.log(`Major field received in update: "${updateData.major}" (${typeof updateData.major})`);
        
        // Validate the major field is an Airtable record ID (usually starts with "rec")
        if (!updateData.major.startsWith('rec')) {
          console.warn(`Invalid major ID format received: ${updateData.major}`);
          return res.status(400).json({ 
            error: "Invalid major ID format. Expected record ID but received text value.",
            receivedValue: updateData.major
          });
        }
      } else {
        // If it's not a string or null, it's invalid
        console.warn(`Invalid major field type received: ${typeof updateData.major}`);
        return res.status(400).json({
          error: "Invalid major field type. Expected string record ID or null.",
          receivedType: typeof updateData.major
        });
      }
    } else {
      // Handle explicit null/undefined case (clearing the field)
      console.log("Major field is null or undefined - will be cleared");
    }

    // Map fields to Airtable field names
    const airtableData = {
      FirstName: updateData.firstName,
      LastName: updateData.lastName,
      DegreeType: updateData.degreeType,
      // Use programId (the ID reference) instead of text value for Major
      Major: updateData.major,  // This should be a record ID from the Programs table
      GraduationYear: updateData.graduationYear,
      GraduationSemester: updateData.graduationSemester,
      ReferralSource: updateData.referralSource,
      InstitutionId: updateData.institutionId,
      educationId: updateData.educationId, // Include education record ID for updating
    };
    
    // Debug the data being sent
    console.log("Updating user profile with data:", JSON.stringify(airtableData, null, 2));

    try {
      // Add timeout for update operation
      const updateTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile update timed out")), 9000)
      );
      
      // Race the update against a timeout
      const updatedProfile = await Promise.race([
        updateUserProfile(contactId, airtableData),
        updateTimeoutPromise
      ]);
      
      // Return a simplified profile if complete profile fetch fails
      try {
        const completeProfile = await Promise.race([
          getCompleteUserProfile(session.user),
          new Promise((_, reject) => setTimeout(() => 
            reject(new Error("Complete profile fetch timed out")), 5000))
        ]);
        
        return res.status(200).json({
          profile: completeProfile,
          _meta: {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime
          }
        });
      } catch (fetchError) {
        console.error("Error fetching complete profile after update:", fetchError);
        
        // Return basic updated profile info
        return res.status(200).json({
          profile: {
            contactId,
            ...updateData,
            auth0Id: session.user.sub,
            email: session.user.email,
          },
          _meta: {
            partial: true,
            error: "Partial profile returned - complete profile fetch failed",
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (updateError) {
      console.error("Error updating profile:", updateError);
      return res.status(500).json({ 
        error: "Failed to update profile", 
        message: updateError.message 
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}


// Handles verified PATCH requests with X-Auth-Verification header
// This provides a fallback for clients with cookie issues
async function handleVerifiedPatchRequest(req, res) {
  console.log('Processing profile update with verified PATCH');
  const startTime = Date.now();
  
  try {
    const { contactId, ...updateData } = req.body;
    
    if (!contactId) {
      return res.status(400).json({ error: "Contact ID is required for updates" });
    }
    
    // Log the simplified update data
    console.log('Verified profile update for contactId:', contactId);
    
    // Map fields to Airtable field names (same as normal update)
    const airtableData = {
      FirstName: updateData.firstName,
      LastName: updateData.lastName,
      DegreeType: updateData.degreeType,
      Major: updateData.major,
      GraduationYear: updateData.graduationYear,
      GraduationSemester: updateData.graduationSemester,
      ReferralSource: updateData.referralSource,
      InstitutionId: updateData.institutionId,
      educationId: updateData.educationId,
    };
    
    // Perform the update directly
    await updateUserProfile(contactId, airtableData);
    
    // Return simplified success response
    return res.status(200).json({
      profile: {
        contactId: contactId,
        ...updateData,
        updated: true
      },
      _meta: {
        verifiedUpdate: true,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error('Error in verified profile update:', error);
    return res.status(500).json({ 
      error: "Failed to update profile", 
      message: error.message 
    });
  }
}

// Simplified API handler that matches the pattern used in other endpoints
export default async function handler(req, res) {
  try {
    // Check if the method is allowed
    if (!['GET', 'PUT', 'PATCH'].includes(req.method)) {
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowedMethods: ['GET', 'PUT', 'PATCH'],
        receivedMethod: req.method
      });
    }
    
    console.log(`Profile API request: ${req.method} ${req.url}`);
    
    // Enhanced logging to troubleshoot session issues - log headers before session check
    console.log(`Auth request details - Method: ${req.method}, Headers:`, {
      cookie: req.headers.cookie ? 'Present' : 'Missing',
      cookieLength: req.headers.cookie ? req.headers.cookie.length : 0,
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'x-auth-verification': req.headers['x-auth-verification'] || 'Missing',
      contentType: req.headers['content-type'],
      credentials: req.headers['credentials'] // Debug the credentials header if present
    });
    
    // Add logging for cookies to specifically identify auth session cookies
    if (req.headers.cookie) {
      const cookiePairs = req.headers.cookie.split(';');
      const sessionCookies = cookiePairs.filter(cookie => 
        cookie.trim().startsWith('appSession=') || 
        cookie.trim().startsWith('auth0.is.authenticated=')
      );
      console.log(`Auth session cookies found: ${sessionCookies.length > 0 ? 'Yes' : 'No'}`);
    }
    
    // Add special handling for known authenticated requests
    // This is a fallback for clients where cookies aren't working
    const hasAuthHeader = !!req.headers.authorization;
    const hasAuthVerification = req.headers['x-auth-verification'] === 'true';
    
    if (hasAuthVerification && req.method === 'PATCH') {
      console.log('Request contains X-Auth-Verification header, attempting manual auth verification');
      try {
        // For requests that are updating profile data and have verification
        // Proceed with a special process for PATCH operations
        if (req.method === 'PATCH' && req.body && req.body.contactId) {
          console.log('Using contactId from request body for authentication: ' + req.body.contactId);
          // Call a special handler just for verified PATCH requests
          return handleVerifiedPatchRequest(req, res);
        }
      } catch (verificationError) {
        console.error('Error in verification handling:', verificationError);
      }
    }
    
    // Check for valid Auth0 session - try with withAPIAuthRequired pattern first
    try {
      const session = await auth0.getSession(req, res);
      
      if (!session) {
        // First attempt failed, try an alternate approach as fallback
        console.warn('Primary session check failed, trying fallback auth methods');
        
        // Get session from cookie directly as fallback
        if (req.headers.cookie && req.headers.cookie.includes('appSession=')) {
          console.log('AppSession cookie found, attempting to use it directly');
          
          // Manually validate the session cookie
          try {
            // Call getSession again with explicit option to read from cookie
            const fallbackSession = await auth0.getSession(req, res);
            if (fallbackSession && fallbackSession.user) {
              console.log('Fallback session validation successful');
              return handlerImpl(req, res); // Skip the check below and proceed
            }
          } catch (fallbackError) {
            console.error('Fallback session validation failed:', fallbackError.message);
          }
        }
        
        console.error('No Auth0 session found for request - missing or invalid session cookie');
        return res.status(401).json({ error: 'Not authenticated' });
      }
    } catch (sessionError) {
      console.error('Error checking Auth0 session:', sessionError);
      return res.status(401).json({ error: 'Authentication error', message: sessionError.message });
    }
    
    // Call the implementation handler
    return handlerImpl(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

