import { auth0 } from '@/lib/auth0';
import { partnerships } from '@/lib/airtable/entities';

/**
 * API endpoint for initiative partnerships
 * 
 * Note: In the Airtable schema, "Initiative" is the actual table name for what
 * users often refer to as "Programs" in the UI. We use "initiative" terminology in
 * our internal implementation for consistency with the database schema.
 * 
 * The URL path still uses "programs" for backward compatibility with the UI.
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Only support GET method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    // Get initiative ID from URL (using programId parameter for backward compatibility)
    const { programId: initiativeId } = req.query;
    
    if (!initiativeId) {
      return res.status(400).json({ error: "Initiative ID is required" });
    }
    
    // Fetch partnerships for this initiative
    const initiativePartnerships = await partnerships.getPartnershipsByInitiative(initiativeId);
    
    // Return the partnerships
    return res.status(200).json({
      success: true,
      partnerships: initiativePartnerships,
      _meta: {
        count: initiativePartnerships.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}