import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, getUserTeams } from '@/lib/airtable'

/**
 * API handler to get the user's teams
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function teamsHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Get user's teams
    const teams = await getUserTeams(userProfile.contactId)
    
    if (!teams) {
      // User has no teams, return empty array
      return res.status(200).json({ teams: [] })
    }
    
    // Restructure the response to match expected format
    const formattedTeams = Array.isArray(teams) ? teams : [{
      id: teams.id,
      name: teams.name,
      description: teams.description,
      members: teams.members,
      points: teams.points
    }]
    
    console.log('Teams API response:', { count: formattedTeams.length, teams: formattedTeams })
    return res.status(200).json({ teams: formattedTeams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return res.status(500).json({ error: 'Failed to fetch teams' })
  }
})