import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, getTeamById, base } from '@/lib/airtable'

/**
 * API handler for leaving a team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function leaveTeamHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { teamId } = req.query

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

    // Get team details to verify membership
    const team = await getTeamById(teamId, userProfile.contactId)
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    
    // Find the member record for the current user
    const memberRecord = team.members.find(
      member => member.id === userProfile.contactId && member.status === 'Active'
    )
    
    if (!memberRecord) {
      return res.status(403).json({ error: 'You are not an active member of this team' })
    }

    // Get the member record ID from Airtable
    // This is the linking record between the team and the user
    let memberRecordId = memberRecord.memberRecordId

    if (!memberRecordId) {
      console.error('Member record found but missing memberRecordId:', memberRecord);
      
      // Fallback: Try to find the member record directly from the Members table
      try {
        const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
        if (!membersTableId) {
          return res.status(500).json({ error: 'Members table ID not configured' });
        }
        
        const membersTable = base(membersTableId);
        
        // Look up the member record using contactId and teamId
        const memberRecords = await membersTable.select({
          filterByFormula: `AND({Contact}="${userProfile.contactId}", {Team}="${teamId}", {Status}="Active")`,
          maxRecords: 1
        }).firstPage();
        
        if (memberRecords && memberRecords.length > 0) {
          const directMemberRecordId = memberRecords[0].id;
          console.log(`Found member record ID directly: ${directMemberRecordId}`);
          // Use this member record ID going forward
          memberRecordId = directMemberRecordId;
        } else {
          return res.status(500).json({ error: 'Could not find member record ID' });
        }
      } catch (error) {
        console.error('Error finding member record directly:', error);
        return res.status(500).json({ error: 'Could not find member record ID' });
      }
    }

    // Update the member record to set status to "Inactive"
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    const membersTable = base(membersTableId);
    
    if (!membersTable) {
      return res.status(500).json({ error: 'Members table not configured' });
    }
    
    const updatedMember = await membersTable.update(memberRecordId, {
      'Status': 'Inactive',
    })

    if (!updatedMember) {
      return res.status(500).json({ error: 'Failed to update member status' })
    }

    // Respond with success
    return res.status(200).json({
      success: true,
      message: 'Successfully left the team'
    })
  } catch (error) {
    console.error(`Error leaving team ${teamId}:`, error)
    return res.status(500).json({ error: 'Failed to leave team' })
  }
})