import { auth0 } from '@/lib/auth0';
import { getCompleteUserProfile } from '@/lib/userProfile.refactored';

/**
 * V2 API endpoint to get user's complete profile
 * This demonstrates the refactored Airtable integration
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetProfile(req, res, session.user, startTime);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

/**
 * Handle GET request for user profile
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user
 * @param {number} startTime - Request start time for performance metrics
 */
async function handleGetProfile(req, res, user, startTime) {
  try {
    // Get minimal flag from query params
    const minimal = req.query.minimal === 'true';
    
    // Get complete profile using our refactored module
    const profile = await getCompleteUserProfile(user, { minimal });
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Return the profile data
    return res.status(200).json({
      profile,
      _meta: {
        processingTime,
        minimal,
        timestamp: new Date().toISOString(),
        version: 'v2'
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}