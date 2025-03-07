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
      
      // If we found no active member records, do another search without the Status filter
      // This handles legacy records that might not have a Status field
      if (activeMembers.length === 0) {
        console.log("No active member records found, checking for records without Status field");
        const allMembers = await membersTable.select({
          filterByFormula: `{Contact}="${userProfile.contactId}"`,
        }).firstPage();
        
        console.log(`Found ${allMembers.length} total member records`);
        
        // Update all member records to inactive
        for (const record of allMembers) {
          await membersTable.update(record.id, {
            'Status': 'Inactive'
          });
          console.log(`Updated member record ${record.id} to inactive (legacy record)`);
        }
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
        // First try with Status filter for active members
        let memberRecords = await membersTable.select({
          filterByFormula: `AND({Contact}="${userProfile.contactId}", {Team}="${teamId}", {Status}="Active")`,
          maxRecords: 1
        }).firstPage();
        
        // If no active members found, try without Status filter to catch legacy records
        if (!memberRecords || memberRecords.length === 0) {
          console.log("No active member records found with team filter, checking for records without Status field");
          memberRecords = await membersTable.select({
            filterByFormula: `AND({Contact}="${userProfile.contactId}", {Team}="${teamId}")`,
            maxRecords: 1
          }).firstPage();
        }
        
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
        
        // Fetch active cohorts first to filter participation records
        const cohortsTableId = process.env.AIRTABLE_COHORTS_TABLE_ID;
        let activeCohortIds = [];
        
        if (cohortsTableId) {
          try {
            const cohortsTable = base(cohortsTableId);
            const activeCohorts = await cohortsTable.select({
              filterByFormula: `{Status}="Active"`,
              fields: ["Record ID"]
            }).firstPage();
            
            activeCohortIds = activeCohorts.map(cohort => cohort.id);
            console.log(`Found ${activeCohortIds.length} active cohorts`);
          } catch (cohortError) {
            console.error("Error fetching active cohorts:", cohortError);
          }
        }
        
        // Get the participation records directly from Airtable
        // We need to query them directly to check for Capacity="Participant" and active cohorts
        console.log("Finding participation records for contact:", userProfile.contactId);
        
        // First try to find records with Status="Active" and Capacity="Participant"
        const participationRecords = await participationTable.select({
          filterByFormula: `AND({Contacts}="${userProfile.contactId}", {Capacity}="Participant", OR({Status}="Active", {Status}=""))`,
        }).firstPage();
        
        console.log(`Found ${participationRecords.length} active participation records with Capacity="Participant"`);
        
        // Filter for active cohorts and update each eligible participation record
        let updatedCount = 0;
        
        for (const record of participationRecords) {
          // Check if this participation record is linked to an active cohort
          const recordCohorts = record.fields.Cohorts || [];
          const hasActiveCohort = recordCohorts.some(cohortId => activeCohortIds.includes(cohortId));
          
          // If we have active cohort IDs and this record doesn't link to any, skip it
          if (activeCohortIds.length > 0 && !hasActiveCohort) {
            console.log(`Skipping participation record ${record.id} - not linked to any active cohorts`);
            continue;
          }
          
          // Update the record to inactive
          try {
            await participationTable.update(record.id, {
              'Status': 'Inactive'
            });
            updatedCount++;
            console.log(`Updated participation record ${record.id} to inactive`);
          } catch (updateError) {
            console.error(`Error updating participation record ${record.id}:`, updateError);
          }
        }
        
        console.log(`Updated ${updatedCount} participation records to inactive status`);
        
        // If no records were updated through direct query, try using the IDs from user profile as a fallback
        if (updatedCount === 0 && userProfile.Participation && Array.isArray(userProfile.Participation) && userProfile.Participation.length > 0) {
          console.log(`No records updated via direct query, using user profile Participation IDs as fallback`);
          
          for (const participationId of userProfile.Participation) {
            try {
              // First get the record to check its details
              const record = await participationTable.find(participationId);
              
              // Only update if it's a Participant record
              if (record.fields.Capacity === "Participant") {
                // Check if linked to any active cohorts, if we have active cohort data
                const recordCohorts = record.fields.Cohorts || [];
                const hasActiveCohort = activeCohortIds.length === 0 || 
                                        recordCohorts.some(cohortId => activeCohortIds.includes(cohortId));
                
                if (hasActiveCohort) {
                  await participationTable.update(participationId, {
                    'Status': 'Inactive'
                  });
                  console.log(`Updated participation record ${participationId} to inactive (from profile)`);
                  updatedCount++;
                } else {
                  console.log(`Skipping participation record ${participationId} - not linked to active cohorts`);
                }
              } else {
                console.log(`Skipping participation record ${participationId} - not a Participant record`);
              }
            } catch (updateError) {
              console.error(`Error handling participation record ${participationId}:`, updateError);
            }
          }
        }
        
        console.log(`Total participation records updated: ${updatedCount}`);
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