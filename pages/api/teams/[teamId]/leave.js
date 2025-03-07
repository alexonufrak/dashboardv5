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
      
    // ALWAYS update ALL member records for the contact to inactive, regardless of teamId
    // This ensures we don't miss any member records
    console.log(`Updating all member records for contact ${userProfile.contactId} to inactive`);
    
    // First check if the contact record has Members links
    const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID);
    let memberRecordsUpdated = false;
    
    try {
      console.log(`Fetching contact record to check for linked Members`);
      const contactRecord = await contactsTable.find(userProfile.contactId);
      
      if (contactRecord && contactRecord.fields.Members && contactRecord.fields.Members.length > 0) {
        const memberIds = contactRecord.fields.Members;
        console.log(`Contact has ${memberIds.length} linked member records:`, memberIds);
        
        // Direct update of each member record from the contact
        for (const memberId of memberIds) {
          try {
            await membersTable.update(memberId, {
              'Status': 'Inactive'
            });
            console.log(`Updated member record ${memberId} to inactive (from contact links)`);
            memberRecordsUpdated = true;
          } catch (memberUpdateError) {
            console.error(`Error updating member record ${memberId}:`, memberUpdateError);
          }
        }
      } else {
        console.log(`Contact record has no linked member records`);
      }
    } catch (contactError) {
      console.error(`Error fetching contact record:`, contactError);
    }
    
    // If we haven't updated any records through direct links, try the query approach
    if (!memberRecordsUpdated) {
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
        memberRecordsUpdated = true;
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
          memberRecordsUpdated = true;
        }
      }
    }
    
    // If we still haven't updated any member records, try a broader search approach
    if (!memberRecordsUpdated) {
      console.log("No member records found through regular methods, trying broader search");
      
      // Check teams table to find teams the user might be in
      try {
        const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
        if (teamsTableId) {
          const teamsTable = base(teamsTableId);
          // Get all teams to check manually
          const teams = await teamsTable.select().firstPage();
          
          console.log(`Checking ${teams.length} teams for hidden member records`);
          
          let hiddenMemberCount = 0;
          
          // For each team, check its Members field for records to update
          for (const team of teams) {
            const teamMembers = team.fields.Members || [];
            
            if (teamMembers.length > 0) {
              for (const memberId of teamMembers) {
                try {
                  // Get the member record to check if it's for this contact
                  const memberRecord = await membersTable.find(memberId);
                  
                  if (memberRecord && 
                      memberRecord.fields.Contact && 
                      memberRecord.fields.Contact.length > 0 &&
                      memberRecord.fields.Contact[0] === userProfile.contactId) {
                    
                    // Found a member record for this contact
                    console.log(`Found hidden member record ${memberId} in team ${team.id}`);
                    
                    // Update it to inactive
                    await membersTable.update(memberId, {
                      'Status': 'Inactive'
                    });
                    console.log(`Updated hidden member record ${memberId} to inactive`);
                    hiddenMemberCount++;
                    memberRecordsUpdated = true;
                  }
                } catch (error) {
                  // Continue checking other members if one fails
                  console.error(`Error checking member ${memberId}:`, error);
                }
              }
            }
          }
          
          console.log(`Updated ${hiddenMemberCount} hidden member records from team search`);
        }
      } catch (error) {
        console.error("Error searching for hidden member records:", error);
      }
    }
    
    // Log whether we were able to update any member records
    if (memberRecordsUpdated) {
      console.log("Successfully updated one or more member records to inactive");
    } else {
      console.log("WARNING: No member records found to update. User may need manual cleanup in Airtable.");
    }
    
    // For the "unknown" teamId case, we don't need to do anything else for member records
    // since we've already updated all of them
    if (teamId === 'unknown') {
      // Set a placeholder updatedMember for consistency with the normal flow
      updatedMember = { id: 'multiple-records' };
    } 
    // For specific teamId, verify the team exists but we've already updated all member records
    else {
      // Get team details to verify the team exists
      const team = await getTeamById(teamId, userProfile.contactId)
      
      if (!team) {
        console.log(`Team ${teamId} not found, but continuing since we've already updated all member records`);
      } else {
        console.log(`Team ${teamId} found, member records were already updated globally`);
        
        // Keep track of the updatedMember value for consistency with original code
        updatedMember = { id: 'global-updates-applied' };
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

    // Respond with success - include cache invalidation info
    return res.status(200).json({
      success: true,
      message: 'Successfully left the team',
      invalidateCaches: ['participation', 'teams'] // Include which caches should be invalidated by the client
    })
  } catch (error) {
    console.error(`Error leaving team ${teamId}:`, error)
    return res.status(500).json({ error: 'Failed to leave team' })
  }
})