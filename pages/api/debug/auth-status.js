import { auth0 } from "@/lib/auth0";
import { getUserByAuth0Id } from '../../../lib/airtable/entities/users';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

/**
 * Debug endpoint to check authentication status and session details
 * Provides information about the current session for troubleshooting
 */
export default async function handler(req, res) {
  try {
    // Record start time to measure performance
    const startTime = Date.now();
    
    // Get session information using Auth0 SDK
    const session = await auth0.getSession(req, res);
    
    // Reject if no session
    if (!session || !session.user) {
      return res.status(401).json({ 
        status: 'not-authenticated',
        message: 'No valid session found'
      });
    }
    
    // Basic request info for debugging
    const requestInfo = {
      headers: {
        host: req.headers.host,
        referer: req.headers.referer || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        cookie: req.headers.cookie ? `${req.headers.cookie.length} chars` : 'none',
        // Don't include actual cookie values for security
        hasCookies: !!req.headers.cookie,
        origin: req.headers.origin || 'unknown',
      },
      method: req.method,
      url: req.url,
    };
    
    // Fetch Airtable user data if available
    let profileData = null;
    if (session.user && session.user.sub) {
      try {
        profileData = await getUserByAuth0Id(session.user.sub);
      } catch (profileError) {
        console.warn('Error fetching profile data:', profileError);
      }
    }
    
    // Sanitize the session for logging (remove sensitive data)
    const sanitizedSession = session ? {
      user: {
        email: session.user.email,
        name: session.user.name,
        sub: session.user.sub,
        // Include any non-sensitive profile data
        firstName: session.user.firstName || session.user.given_name,
        lastName: session.user.lastName || session.user.family_name,
        // Include user metadata properties safely
        ...(session.user.contactId ? { contactId: session.user.contactId } : {}),
        ...(session.user.airtableId ? { airtableId: session.user.airtableId } : {}),
        ...(session.user.institutionId ? { institutionId: session.user.institutionId } : {}),
        ...(session.user.onboardingCompleted !== undefined ? { onboardingCompleted: session.user.onboardingCompleted } : {}),
        ...(session.user.selectedCohort ? { selectedCohort: session.user.selectedCohort } : {}),
      },
      // Include non-sensitive session details
      expiresIn: session.expiresIn || 'unknown',
      // Don't include actual tokens
      hasIdToken: !!session.idToken,
      hasAccessToken: !!session.accessToken,
    } : null;
    
    // Environment checks for debugging
    const envChecks = {
      nodeEnv: process.env.NODE_ENV,
      hasAuth0Secret: !!process.env.AUTH0_SECRET,
      hasAuth0BaseUrl: !!process.env.AUTH0_BASE_URL,
      hasAuth0IssuerBaseUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
      hasAuth0ClientId: !!process.env.AUTH0_CLIENT_ID,
      hasAuth0ClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
      // Auth0 session cookie name - for debugging cookie issues
      sessionCookieName: 'appSession',
      isSecureContext: req.headers['x-forwarded-proto'] === 'https' || req.headers.host?.includes('localhost'),
    };
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Return debug information
    return res.status(200).json({
      status: 'authenticated',
      session: sanitizedSession,
      profile: profileData ? {
        contactId: profileData.contactId,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        hasParticipation: profileData.hasParticipation,
        onboardingStatus: profileData.onboardingStatus,
        lastFetched: profileData.lastFetched,
      } : null,
      request: requestInfo,
      serverTime: new Date().toISOString(),
      env: envChecks,
      performance: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Auth status debug endpoint error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};