import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

/**
 * API endpoint to debug Auth0 session issues
 * This endpoint will help diagnose intermittent 401 errors with /auth/profile
 */
async function handler(req, res) {
  try {
    // Get current session
    const session = await getSession(req, res);
    
    // Get information about the request
    const requestInfo = {
      method: req.method,
      headers: {
        // Only include non-sensitive headers
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'accept': req.headers.accept,
        'accept-encoding': req.headers['accept-encoding'],
        'accept-language': req.headers['accept-language'],
        'referer': req.headers.referer,
        'connection': req.headers.connection,
        // Check if auth cookies exist without revealing values
        hasCookies: !!req.headers.cookie,
        cookieCount: (req.headers.cookie || '').split(';').length,
        hasAuth0Cookie: (req.headers.cookie || '').includes('auth0.is.authenticated'),
        hasAuth0SessionCookie: (req.headers.cookie || '').includes('auth0_session'),
      },
      url: req.url,
      // Include query parameters but not cookie values
      query: req.query,
    };
    
    if (session) {
      // Return sanitized session info (no tokens)
      return res.status(200).json({
        status: 'authenticated',
        user: {
          sub: session.user.sub,
          email: session.user.email,
          isEmailVerified: session.user.email_verified || false,
          hasMetadata: !!session.user.user_metadata,
          metadataKeys: session.user.user_metadata ? Object.keys(session.user.user_metadata) : [],
        },
        sessionInfo: {
          expiresIn: session.expiresIn,
          hasIdToken: !!session.idToken,
          hasAccessToken: !!session.accessToken,
        },
        requestInfo,
        serverTime: new Date().toISOString(),
      });
    } else {
      // Return information about the request but indicate no session
      return res.status(200).json({
        status: 'unauthenticated',
        requestInfo,
        serverTime: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in debug-session endpoint:', error);
    
    // Return error details to help diagnose the issue
    return res.status(500).json({
      status: 'error',
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error.code,
        name: error.name,
      },
      serverTime: new Date().toISOString(),
    });
  }
}

export default withApiAuthRequired(handler)