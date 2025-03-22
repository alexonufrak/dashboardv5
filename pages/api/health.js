/**
 * Simple health check endpoint for monitoring
 * This does not require authentication
 */
export default function handler(req, res) {
  // Check for cookie health check
  const cookies = req.headers.cookie || '';
  const hasAuth0Cookie = cookies.includes('auth0.is.authenticated') || cookies.includes('auth0_session');
  
  // Include basic system information
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    nodeEnv: process.env.NODE_ENV,
    cookies: {
      present: cookies.length > 0,
      hasAuth0Cookie
    },
    auth0Domain: process.env.AUTH0_DOMAIN ? 'configured' : 'missing',
    airtable: process.env.AIRTABLE_API_KEY ? 'configured' : 'missing'
  };
  
  // Add CORS headers to allow external monitoring
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // No caching for health checks
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  return res.status(200).json(health);
}