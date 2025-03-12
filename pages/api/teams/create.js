import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, base, getTeamById } from '@/lib/airtable'

/**
 * API handler to create a new team and add the user as a member
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function createTeamHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the request body containing team data
    const { name, description, joinable, image } = req.body
    
    console.log("Team creation request:", { name, description, joinable, hasImage: !!image })
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' })
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Use the imported base from lib/airtable.js
    
    // Get the Teams table ID from environment variables
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID
    if (!teamsTableId) {
      return res.status(500).json({ error: 'Teams table ID not configured' })
    }
    
    // Initialize the teams table
    const teamsTable = base(teamsTableId)
    
    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID
    if (!membersTableId) {
      return res.status(500).json({ error: 'Members table ID not configured' })
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId)
    
    // Create a new team
    console.log(`Creating new team: ${name}`)
    
    // Get cohort ID from query params if available
    const cohortId = req.query.cohortId
    
    // Prepare team data
    const teamData = {
      'Team Name': name.trim(),
      'Description': description?.trim() || '',
      // Set the Joinable field in Airtable, defaulting to true if not specified
      'Joinable': joinable !== undefined ? joinable : true
    }
    
    // Add image URL if provided
    if (image) {
      console.log(`Adding team header image: ${image}`)
      // Format image as an Airtable attachment object with url and filename
      teamData['Image'] = [
        {
          url: image,
          filename: `team_header_${Date.now()}`
        }
      ]
    }
    
    // Add cohort ID to team if provided
    if (cohortId) {
      console.log(`Associating team with cohort ${cohortId}`)
      teamData['Cohorts'] = [cohortId]
    }
    
    const teamRecord = await teamsTable.create(teamData)
    
    // Create a member record for the user
    console.log(`Creating member record for contact ${userProfile.contactId} in team ${teamRecord.id}`)
    const memberRecord = await membersTable.create({
      'Contact': [userProfile.contactId],
      'Team': [teamRecord.id],
      'Status': 'Active'
    })
    
    // Get the complete team record to ensure we have the correct data structure
    // This is an extra API call, but ensures consistency and makes sure all team data is properly initialized
    const completeTeam = await getTeamById(teamRecord.id, userProfile.contactId)
    
    if (!completeTeam) {
      // If we can't get the complete team (unlikely), fall back to manual construction
      console.log("Failed to get complete team record, using fallback approach")
      return res.status(201).json({
        id: teamRecord.id,
        name: teamRecord.fields['Team Name'] || teamRecord.fields.Name || "",
        description: teamRecord.fields.Description || "",
        members: [{
          id: userProfile.contactId,
          name: `${userProfile['First Name'] || ''} ${userProfile['Last Name'] || ''}`.trim(),
          email: userProfile.Email,
          status: 'Active',
          isCurrentUser: true
        }],
        points: 0
      })
    }
    
    // Return the complete team data with full member details
    return res.status(201).json(completeTeam)
  } catch (error) {
    console.error('Error creating team:', error)
    console.error('Error details:', error.message, error.stack)
    
    // Check for specific Airtable error types for better error messages
    if (error.statusCode === 422) {
      return res.status(422).json({ error: 'Invalid field data in team creation. Please check field names match the Airtable schema.' })
    } else if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Teams table not found. Please check environment variables.' })
    } else if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Permission denied to create team. Please check API key permissions.' })
    }
    
    return res.status(500).json({ error: 'Failed to create team: ' + error.message })
  }
})