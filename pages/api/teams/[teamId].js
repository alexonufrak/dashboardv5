import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, getTeamById, updateTeam } from '@/lib/airtable'

/**
 * API handler to get or update a specific team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function teamHandler(req, res) {
  const { teamId } = req.query

  // Handle GET and PATCH requests
  if (req.method !== 'GET' && req.method !== 'PATCH') {
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

    // GET request - fetch team details
    if (req.method === 'GET') {
      const team = await getTeamById(teamId, userProfile.contactId)
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' })
      }
      
      return res.status(200).json({ team })
    }
    
    // PATCH request - update team details
    if (req.method === 'PATCH') {
      const { name, description } = req.body
      
      // Validate request data
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Team name is required' })
      }
      
      // First verify user is a member of this team
      const team = await getTeamById(teamId, userProfile.contactId)
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' })
      }
      
      // Check if user is a member of the team
      const isTeamMember = team.members.some(
        member => member.id === userProfile.contactId && member.status === 'Active'
      )
      
      if (!isTeamMember) {
        return res.status(403).json({ error: 'You must be a team member to update this team' })
      }
      
      // Update the team
      const updatedTeam = await updateTeam(teamId, { name, description })
      
      // Get the complete updated team with members
      const completeTeam = await getTeamById(teamId, userProfile.contactId)
      
      return res.status(200).json({ team: completeTeam })
    }
  } catch (error) {
    console.error(`Error handling team ${teamId}:`, error)
    return res.status(500).json({ error: 'Failed to process team request' })
  }
})