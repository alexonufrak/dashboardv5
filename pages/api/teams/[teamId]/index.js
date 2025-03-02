import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, getTeamById } from '@/lib/airtable'

/**
 * API handler to get details of a specific team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function teamHandler(req, res) {
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
    
    // Get the team ID from the route parameter
    const { teamId } = req.query
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' })
    }
    
    // Get team details using the dedicated function
    const team = await getTeamById(teamId, userProfile.contactId)
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    
    // Return the team details
    return res.status(200).json({ team })
  } catch (error) {
    console.error('Error fetching team details:', error)
    return res.status(500).json({ error: 'Failed to fetch team details: ' + error.message })
  }
})