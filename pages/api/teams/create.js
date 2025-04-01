import { auth0 } from '@/lib/auth0'
import { teams, users } from '@/lib/airtable/entities'
import { base } from '@/lib/airtable'

/**
 * API handler to create a new team and add the user as a member
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function createTeamHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await auth0.getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the request body containing team data
    const { name, description, joinable, fileInfo } = req.body.teamData || req.body
    
    console.log("Team creation request:", { 
      name, 
      description, 
      joinable, 
      hasFileInfo: !!fileInfo,
      fileInfoDetails: fileInfo ? `${fileInfo.filename}, ${fileInfo.contentType}` : null
    })
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required' })
    }
    
    // Get user profile from Airtable using the new entity module
    const userProfile = await users.getUserByAuth0Id(session.user.sub)
    
    if (!userProfile || !userProfile.id) {
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
    
    // Add file attachment if provided
    if (fileInfo && fileInfo.url) {
      console.log(`Adding team header image: ${fileInfo.url}`)
      // Format image as an Airtable attachment object with url and filename
      teamData['Image'] = [
        {
          url: fileInfo.url,
          filename: fileInfo.filename || `team_header_${Date.now()}`
        }
      ]
    }
    
    // Add cohort ID to team if provided
    if (cohortId) {
      console.log(`Associating team with cohort ${cohortId}`)
      teamData['Cohorts'] = [cohortId]
    }
    
    // Create the team record with error handling for attachments
    let teamRecord;
    try {
      teamRecord = await teamsTable.create(teamData);
    } catch (createError) {
      // Check if the error is related to attachments
      if (createError.error === 'INVALID_ATTACHMENT_OBJECT' || 
          (createError.message && createError.message.includes('attachment'))) {
        console.log("Detected attachment error, attempting team creation without image");
        
        // Remove the Image field and try again
        delete teamData['Image'];
        
        // Include the image URL in the description for reference
        if (fileInfo && fileInfo.url) {
          teamData['Description'] = (teamData['Description'] || "") + 
            `\n\n[Note: Team image was uploaded but couldn't be attached directly. Access it at: ${fileInfo.url}]`;
        }
        
        // Try again without the attachment
        teamRecord = await teamsTable.create(teamData);
      } else {
        // If it's not an attachment issue, rethrow the error
        throw createError;
      }
    }
    
    // Create a member record for the user
    console.log(`Creating member record for contact ${userProfile.contactId} in team ${teamRecord.id}`)
    const memberRecord = await membersTable.create({
      'Contact': [userProfile.contactId],
      'Team': [teamRecord.id],
      'Status': 'Active'
    })
    
    // Get the complete team record to ensure we have the correct data structure
    // This is an extra API call, but ensures consistency and makes sure all team data is properly initialized
    const completeTeam = await teams.getTeamById(teamRecord.id)
    
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
    if (error.statusCode === 422 || error.error === 'INVALID_ATTACHMENT_OBJECT') {
      return res.status(422).json({ 
        error: 'Invalid data in team creation. Please check file uploads and field formats.',
        details: error.message || 'Unknown validation error'
      })
    } else if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Teams table not found. Please check environment variables.' })
    } else if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Permission denied to create team. Please check API key permissions.' })
    }
    
    return res.status(500).json({ 
      error: 'Failed to create team',
      details: error.message || 'Unknown error',
      code: error.error || error.code || 'TEAM_CREATION_FAILED'
    })
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
    return createTeamHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}