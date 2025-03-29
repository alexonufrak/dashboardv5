import { auth0 } from '@/lib/auth0'
import { getUserProfile, getTeamById, updateTeam, base } from '@/lib/airtable'

/**
 * API handler to get or update a specific team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function teamHandler(req, res) {
  const { teamId } = req.query

  // Handle GET and PATCH requests
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session using Auth0 v4
    const session = await auth0.getSession(req, res)
    
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
      
      // Log team details for debugging
      console.log(`Team ${teamId} details:`, {
        id: team.id,
        name: team.name,
        institution: team.institution,
        memberCount: team.members.length
      })
      
      // If we have an institution ID, try to look up directly
      if (team.institution?.id && process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) {
        try {
          const institutionsTable = base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID)
          const institution = await institutionsTable.find(team.institution.id)
          console.log(`Direct institution lookup for ${team.institution.id}:`, {
            name: institution.fields.Name,
            domains: institution.fields.Domains,
            allFields: Object.keys(institution.fields)
          })
        } catch (err) {
          console.error(`Error fetching institution ${team.institution.id}:`, err.message)
        }
      }
      
      return res.status(200).json({ team })
    }
    
    // PATCH request - update team details
    if (req.method === 'PATCH') {
      const { name, description, fileInfo } = req.body
      
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
      
      // Prepare update data including fileInfo if provided
      const updateData = { 
        name, 
        description 
      }
      
      // Add image if provided in fileInfo
      if (fileInfo && fileInfo.url) {
        console.log(`Adding team header image: ${fileInfo.url}`)
        updateData.image = [
          {
            url: fileInfo.url,
            filename: fileInfo.filename || `team_header_${Date.now()}`
          }
        ]
      }
      
      // Update the team
      const updatedTeam = await updateTeam(teamId, updateData)
      
      // Get the complete updated team with members
      const completeTeam = await getTeamById(teamId, userProfile.contactId)
      
      return res.status(200).json({ team: completeTeam })
    }
  } catch (error) {
    console.error(`Error handling team ${teamId}:`, error)
    return res.status(500).json({ error: 'Failed to process team request' })
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
    return teamHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}