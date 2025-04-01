import { auth0 } from '@/lib/auth0';
import { getTeamMembers } from '@/lib/airtable/entities/teams';

/**
 * API endpoint to get members of a specific team
 * This endpoint demonstrates the use of our new refactored Airtable integration
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Start performance timer
    const startTime = Date.now();
    
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get the team ID from the URL
    const { teamId } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    
    // Only support GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    console.log(`Fetching team members for team ID: ${teamId}`);
    
    // Get team member data using our new module
    const members = await getTeamMembers(teamId);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Return the team members with metadata
    return res.status(200).json({
      members,
      _meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        count: members.length,
        teamId
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}