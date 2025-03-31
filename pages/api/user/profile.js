import { getCompleteUserProfile } from "../../../lib/userProfile"
import { updateUserProfile } from "../../../lib/airtable"
import { auth0 } from "../../../lib/auth0"

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

// Handle GET requests for user profile
async function handleGetRequest(req, res, session, startTime) {
  try {
    // Check if minimal mode is requested (for onboarding flow)
    const minimal = req.query.minimal === 'true';
    
    // Set shorter timeout for minimal mode
    const timeoutDuration = minimal ? 3000 : 9000;
    
    // Add timeout control to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Profile fetch timed out")), timeoutDuration)
    );
    
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
    
    // Set cache headers to prevent server/CDN caching, allow client caching via TanStack Query
    res.setHeader('Cache-Control', 'private, no-store, must-revalidate');
    
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
}

// Handle PATCH/PUT requests for updating user profile
async function handleUpdateRequest(req, res, session, startTime) {
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
    await Promise.race([
      updateUserProfile(contactId, airtableData),
      updateTimeoutPromise
    ]);
    
    // Return a simplified success response - client will refetch via TanStack Query
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      contactId: contactId, // Return contactId for reference
      _meta: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  } catch (updateError) {
    console.error("Error updating profile:", updateError);
    return res.status(500).json({ 
      error: "Failed to update profile", 
      message: updateError.message 
    });
  }
}


// API handler aligned with Auth0 v4 best practices
export default async function handler(req, res) {
  try {
    // Record start time for performance monitoring
    const startTime = Date.now();
    
    // Set headers to prevent server/CDN caching
    res.setHeader('Cache-Control', 'no-store, private, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      return res.status(200).end();
    }
    
    // Check if the method is allowed (including POST with method override)
    // We allow POST with X-HTTP-Method-Override header for browsers with PATCH issues
    if (!['GET', 'PUT', 'PATCH', 'POST', 'OPTIONS'].includes(req.method)) {
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowedMethods: ['GET', 'PUT', 'PATCH', 'POST', 'OPTIONS']
      });
    }
    
    // Handle method override for POST requests meant to be PATCH
    // This is a workaround for browsers that have issues with cookies in PATCH requests
    let effectiveMethod = req.method;
    if (req.method === 'POST' && 
        (req.headers['x-http-method-override'] === 'PATCH' || req.body?._method === 'PATCH')) {
      console.log('Detected POST request with PATCH method override');
      effectiveMethod = 'PATCH';
    }
    
    // Get Auth0 session - just once, at the top level
    let session;
    try {
      // Extract cookie names for detailed debugging (without exposing values)
      const cookieNames = req.headers.cookie 
        ? req.headers.cookie.split(';')
            .map(c => c.trim())
            .map(c => c.split('=')[0]) 
        : [];
      
      // Log detailed request info for debugging
      console.log('Auth request details:', {
        method: req.method,
        path: req.url,
        hasCookies: !!req.headers.cookie,
        cookieCount: req.headers.cookie?.split(';').length || 0,
        cookieNames: cookieNames, // Added cookie names for better debugging
        hasAuthHeader: !!req.headers.authorization,
        origin: req.headers.origin || 'none'
      });
      
      // Check for authentication methods - always check regardless of cookies
      console.log('Checking all authentication methods for API request');
      
      // Check for Authorization header (Bearer token)
      if (req.headers.authorization?.startsWith('Bearer ')) {
        console.log('Authorization header found, will use token-based authentication');
        
        try {
          // Extract the token
          const token = req.headers.authorization.split(' ')[1];
          
          // If we have a token, add it to the request for Auth0 to validate
          if (token) {
            // We need to set a cookie with the token to help Auth0 validate it
            if (!cookieNames.includes('appSession')) {
              console.log('No appSession cookie found, adding token to request');
              // Add the token to a special header for our getSession wrapper to use
              req.headers['x-auth-token'] = token;
              
              // Check for user ID in custom header
              if (req.headers['x-user-id']) {
                console.log('User ID found in header, will use for additional verification');
              }
            }
          }
        } catch (authHeaderError) {
          console.error('Error processing Authorization header:', authHeaderError);
        }
      }
      
      // Additional options for Auth0 session retrieval
      // Auth0 v4 should automatically validate Authorization headers
      const sessionOptions = {};
      
      session = await auth0.getSession(req, sessionOptions);
      
      if (!session || !session.user) {
        console.error('Authentication failed - no valid session:', {
          method: req.method,
          path: req.url,
          hasCookies: !!req.headers.cookie,
          cookieNames: cookieNames // Add cookie names to error log
        });
        
        // Add cache-control headers to ensure this 401 isn't cached
        res.setHeader('Cache-Control', 'no-store, private, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        
        return res.status(401).json({ 
          error: 'Not authenticated',
          message: 'Session validation failed. Try refreshing the page or logging in again.'
        });
      }
    } catch (authError) {
      console.error('Auth0 getSession error:', authError);
      return res.status(401).json({ 
        error: 'Authentication error',
        message: authError.message || 'Failed to validate session'
      });
    }
    
    // Simple logging request details
    console.log(`Authenticated profile API request: ${req.method} ${req.url} for user ${session.user.email}`);
    
    // Handle the request based on effective method
    if (req.method === "GET") {
      // For GET requests, fetch and return the user's profile
      return handleGetRequest(req, res, session, startTime);
    } else if (effectiveMethod === "PATCH" || req.method === "PUT" || 
              (req.method === "POST" && req.body?._method === "PATCH")) {
      // For PATCH/PUT requests (or POST with override), update the user's profile
      console.log('Handling update request with method:', req.method, 'effective method:', effectiveMethod);
      return handleUpdateRequest(req, res, session, startTime);
    }
    
    // This should never be reached due to method check above
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}