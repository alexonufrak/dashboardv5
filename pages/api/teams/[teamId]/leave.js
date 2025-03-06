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
    
    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      return res.status(500).json({ error: 'Members table ID not configured' });
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
      
    // Handle the "unknown" teamId case - update all active member records
    if (teamId === 'unknown') {
      console.log('Processing unknown teamId case - will update all active member records for the user');
      
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
      
      // Set a placeholder updatedMember for consistency with the normal flow
      updatedMember = { id: 'multiple-records' };
    } 
    // Handle specific teamId - find and update just that member record
    else {
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
        // Instead of failing, try to find the member record directly
        console.log('Active member record not found in team details, trying direct lookup');
        
        // Look up the member record directly using contactId and teamId
        const memberRecords = await membersTable.select({
          filterByFormula: `AND({Contact}="${userProfile.contactId}", {Team}="${teamId}")`,
          maxRecords: 1
        }).firstPage();
        
        if (memberRecords && memberRecords.length > 0) {
          const directMemberRecordId = memberRecords[0].id;
          console.log(`Found member record directly: ${directMemberRecordId}`);
          
          // Update member status
          updatedMember = await membersTable.update(directMemberRecordId, {
            'Status': 'Inactive',
          });
          
          console.log(`Updated member record ${directMemberRecordId} to inactive`);
        } else {
          return res.status(403).json({ error: 'You are not a member of this team' });
        }
      } else {
        // Normal flow - use the member record from team details
        const memberRecordId = memberRecord.memberRecordId;
        
        if (!memberRecordId) {
          console.error('Member record found but missing memberRecordId:', memberRecord);
          return res.status(500).json({ error: 'Could not find member record ID' });
        }
        
        // Update the member record to set status to "Inactive"
        updatedMember = await membersTable.update(memberRecordId, {
          'Status': 'Inactive',
        });
        
        console.log(`Updated member record ${memberRecordId} to inactive`);
        
        if (!updatedMember) {
          return res.status(500).json({ error: 'Failed to update member status' });
        }
      }
    }
    
    // Also update the participation record status to inactive
    try {
      const participationTableId = process.env.AIRTABLE_PARTICIPATION_TABLE_ID;
      if (participationTableId) {
        const participationTable = base(participationTableId);
        
        // Use the participation IDs directly from the user profile
        // This is more reliable than querying since it uses the cached data
        if (userProfile.Participation && Array.isArray(userProfile.Participation)) {
          console.log(`Found ${userProfile.Participation.length} participation IDs in user profile:`, userProfile.Participation);
          
          // Update each participation record
          for (const participationId of userProfile.Participation) {
            try {
              await participationTable.update(participationId, {
                'Status': 'Inactive'
              });
              console.log(`Updated participation record ${participationId} to inactive`);
            } catch (updateError) {
              console.error(`Error updating participation record ${participationId}:`, updateError);
            }
          }
        } else {
          console.log(`No participation records found in user profile for contact ${userProfile.contactId}`);
          
          // Fallback: Try to find participation records directly
          console.log("Trying to find participation records directly from Airtable");
          const participationRecords = await participationTable.select({
            filterByFormula: `{Contacts}="${userProfile.contactId}"`,
          }).firstPage();
          
          if (participationRecords && participationRecords.length > 0) {
            console.log(`Found ${participationRecords.length} participation records directly`);
            
            // Update each participation record
            for (const record of participationRecords) {
              await participationTable.update(record.id, {
                'Status': 'Inactive'
              });
              console.log(`Updated participation record ${record.id} to inactive`);
            }
          } else {
            console.log(`No participation records found directly for contact ${userProfile.contactId}`);
          }
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