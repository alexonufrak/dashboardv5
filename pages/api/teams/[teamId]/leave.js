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

    // Define variables we'll need to handle both flows
    let memberRecord;
    let updatedMember;
    
    // Special handling for "unknown" teamId
    if (teamId === 'unknown') {
      console.log('Processing unknown teamId case - will update all active member records for the user');
      
      // Get the Members table ID from environment variables  
      const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
      if (!membersTableId) {
        return res.status(500).json({ error: 'Members table ID not configured' });
      }
      
      // Initialize the members table
      const membersTable = base(membersTableId);
      
      // Find all active member records for this user
      const activeMembers = await membersTable.select({
        filterByFormula: `AND({Contact}="${userProfile.contactId}", {Status}="Active")`,
      }).firstPage();
      
      console.log(`Found ${activeMembers.length} active member records to update`);
      
      // Update all active member records to inactive
      for (const record of activeMembers) {
        await membersTable.update(record.id, {
          'Status': 'Inactive'
        });
        console.log(`Updated member record ${record.id} to inactive`);
      }
      
      // We've updated all the relevant records directly, no need for further member updates
      updatedMember = { id: 'multiple-records' };
    } else {
      // Normal flow when we have a specific teamId
      // Get team details to verify membership
      const team = await getTeamById(teamId, userProfile.contactId)
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' })
      }
      
      // Find the member record for the current user
      memberRecord = team.members.find(
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
      
      updatedMember = await membersTable.update(memberRecordId, {
        'Status': 'Inactive',
      })
      
      if (!updatedMember) {
        return res.status(500).json({ error: 'Failed to update member status' })
      }
    }
    
    // Also update the participation record status to inactive
    try {
      const participationTableId = process.env.AIRTABLE_PARTICIPATION_TABLE_ID;
      if (participationTableId) {
        const participationTable = base(participationTableId);
        
        // Find participation records associated with this contact
        // Note: Participation doesn't directly link to Team, so we can only query by contact
        const participationRecords = await participationTable.select({
          filterByFormula: `{Contacts}="${userProfile.contactId}"`,
        }).firstPage();
        
        // Update each participation record that has a status and is active
        if (participationRecords && participationRecords.length > 0) {
          console.log(`Found ${participationRecords.length} participation records to check`);
          
          for (const record of participationRecords) {
            // Only update records that have a Status field
            if (record.fields.Status === 'Active') {
              await participationTable.update(record.id, {
                'Status': 'Inactive'
              });
              console.log(`Updated participation record ${record.id} to inactive`);
            } else if (!record.fields.Status) {
              // If the record doesn't have a Status field yet, add it
              await participationTable.update(record.id, {
                'Status': 'Inactive'
              });
              console.log(`Added inactive status to participation record ${record.id}`);
            }
          }
        } else {
          console.log(`No participation records found for contact ${userProfile.contactId}`);
        }
      }
    } catch (error) {
      console.error("Error updating participation records:", error);
      // Don't fail the whole operation if updating participation records fails
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