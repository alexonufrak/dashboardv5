import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile } from '@/lib/airtable'
import Airtable from 'airtable'

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
    const { name, description } = req.body
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' })
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)
    
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
    const teamRecord = await teamsTable.create({
      'Name': name.trim(),
      'Description': description?.trim() || '',
      'Status': 'Active'
    })
    
    // Create a member record for the user
    console.log(`Creating member record for contact ${userProfile.contactId} in team ${teamRecord.id}`)
    const memberRecord = await membersTable.create({
      'Contact': [userProfile.contactId],
      'Team': [teamRecord.id],
      'Status': 'Active',
      'Role': 'Team Lead',
      'Joined Date': new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    })
    
    // Return the newly created team
    return res.status(201).json({
      id: teamRecord.id,
      name: teamRecord.fields.Name,
      description: teamRecord.fields.Description,
      members: [{
        id: userProfile.contactId,
        name: `${userProfile['First Name'] || ''} ${userProfile['Last Name'] || ''}`.trim(),
        email: userProfile.Email,
        status: 'Active',
        isCurrentUser: true
      }],
      points: 0
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return res.status(500).json({ error: 'Failed to create team' })
  }
})