import { submissions, teams } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch submissions for a team
 * Demonstrates using the new modular Airtable architecture
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { teamId } = req.query;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // First, fetch the team to verify the user has access to it
    const team = await teams.getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if the user is a member of the team
    const teamMembers = await teams.getTeamMembers(teamId);
    const isTeamMember = teamMembers.some(member => member.userId === user.sub);
    
    // If not a team member, check if the user is a program admin
    // This is a placeholder - in a real implementation, you'd check against a list of program admins
    const isAdmin = user['https://xfoundry.org/roles']?.includes('admin') || false;

    if (!isTeamMember && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this team\'s submissions' });
    }

    // Fetch the team's submissions using our new submissions entity
    const teamSubmissions = await submissions.getSubmissionsByTeam(teamId);

    return res.status(200).json({
      success: true,
      submissions: teamSubmissions || [],
    });
  } catch (error) {
    console.error('Error fetching team submissions:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching team submissions',
      message: error.message,
      details: error.details || {}
    });
  }
}