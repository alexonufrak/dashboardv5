import { auth0 } from '@/lib/auth0'
import { getUserProfile, getUserTeams, getTeamsByIds } from '@/lib/airtable'

/**
 * API handler to get teams
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 * 
 * Supports two modes:
 * 1. Get user's teams (default): /api/teams
 * 2. Get teams by IDs: /api/teams?ids=id1,id2,id3
 */
async function teamsHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session using Auth0 v4
    const session = await auth0.getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Check if specific team IDs were requested
    const { ids } = req.query
    
    // If IDs are provided, fetch those teams
    if (ids) {
      console.log(`Fetching teams by IDs: ${ids}`)
      const teamIds = ids.split(',').map(id => id.trim()).filter(id => id)
      
      if (teamIds.length === 0) {
        return res.status(400).json({ error: 'No valid team IDs provided' })
      }
      
      const teams = await getTeamsByIds(teamIds)
      console.log(`Teams API returned ${teams.length} teams by IDs`)
      
      return res.status(200).json({ teams })
    }
    
    // Otherwise, get the user's teams
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
      points: teams.points,
      submissions: teams.submissions,
      cohortIds: teams.cohortIds
    }]
    
    console.log('Teams API response:', { count: formattedTeams.length })
    
    // Add cache control headers - cache for 5 minutes on server, 1 minute on client
    // stale-while-revalidate allows serving stale content while fetching fresh data
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json({ 
      teams: formattedTeams,
      _meta: {
        timestamp: new Date().toISOString(),
        count: formattedTeams.length
      }
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return res.status(500).json({ error: 'Failed to fetch teams' })
  }
}

export default async function handlerImpl(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return teamsHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}