import { base } from './airtable';

/**
 * Helper function to leave a team by making the team member record inactive
 * 
 * @param {string} contactId - The Airtable contact ID of the user
 * @param {string} teamId - The team ID to leave (or "unknown" to leave all teams)
 * @returns {Promise<{success: boolean, updatedRecords?: number, error?: string}>}
 */
export async function leaveTeam(contactId, teamId) {
  try {
    if (!contactId) {
      return { success: false, error: 'Contact ID is required' };
    }

    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      return { success: false, error: 'Members table ID not configured' };
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
    let memberRecordsUpdated = false;
    let updatedCount = 0;
    
    // First check if the contact record has Members links
    const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID);
    
    try {
      console.log(`Fetching contact record to check for linked Members`);
      const contactRecord = await contactsTable.find(contactId);
      
      if (contactRecord && contactRecord.fields.Members && contactRecord.fields.Members.length > 0) {
        const memberIds = contactRecord.fields.Members;
        console.log(`Contact has ${memberIds.length} linked member records:`, memberIds);
        
        // Determine which member records to update
        let memberIdsToUpdate = memberIds;
        
        // If a specific team ID was provided and it's not "unknown", only update members for that team
        if (teamId && teamId !== 'unknown') {
          // Filter for members of the specified team
          const filteredMembers = [];
          
          for (const memberId of memberIds) {
            try {
              const memberRecord = await membersTable.find(memberId);
              if (memberRecord.fields.Team && 
                  Array.isArray(memberRecord.fields.Team) && 
                  memberRecord.fields.Team.includes(teamId)) {
                filteredMembers.push(memberId);
              }
            } catch (err) {
              console.error(`Error checking member ${memberId}:`, err);
            }
          }
          
          memberIdsToUpdate = filteredMembers;
          console.log(`Filtered to ${memberIdsToUpdate.length} members for team ${teamId}`);
        }
        
        // Direct update of each member record from the contact
        for (const memberId of memberIdsToUpdate) {
          try {
            await membersTable.update(memberId, {
              'Status': 'Inactive'
            });
            console.log(`Updated member record ${memberId} to inactive`);
            memberRecordsUpdated = true;
            updatedCount++;
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
      // Build the filter formula based on whether we have a specific team ID
      let filterFormula = `AND({Contact}="${contactId}", {Status}="Active")`;
      if (teamId && teamId !== 'unknown') {
        filterFormula = `AND({Contact}="${contactId}", {Status}="Active", {Team}="${teamId}")`;
      }
      
      // Find active member records for this user
      const activeMembers = await membersTable.select({
        filterByFormula: filterFormula,
      }).firstPage();
      
      console.log(`Found ${activeMembers.length} active member records to update`);
      
      // Update all active member records to inactive
      for (const record of activeMembers) {
        await membersTable.update(record.id, {
          'Status': 'Inactive'
        });
        console.log(`Updated member record ${record.id} to inactive`);
        memberRecordsUpdated = true;
        updatedCount++;
      }
    }
    
    // Return success with count of updated records
    return { 
      success: true, 
      updatedRecords: updatedCount,
      message: updatedCount > 0 ? 
        `Successfully left ${updatedCount} team member record(s)` : 
        'No team member records were found to update'
    };
  } catch (error) {
    console.error('Error leaving team:', error);
    return { success: false, error: error.message || 'Failed to leave team' };
  }
}

/**
 * Helper function to leave a program by making the participation record inactive
 * 
 * @param {string} contactId - The Airtable contact ID of the user
 * @param {string} [participationId] - Direct participation ID (optional)
 * @param {string} [cohortId] - Cohort ID to find participation record by (optional)
 * @param {string} [programId] - Program/Initiative ID to find participation by (optional)
 * @returns {Promise<{success: boolean, updatedRecords?: number, error?: string}>}
 */
export async function leaveParticipation(contactId, participationId, cohortId, programId) {
  try {
    if (!contactId) {
      return { success: false, error: 'Contact ID is required' };
    }
    
    // If no identifiers provided, return an error
    if (!participationId && !cohortId && !programId) {
      return { success: false, error: 'At least one of participationId, cohortId, or programId is required' };
    }
    
    // Get the participation table
    const participationTableId = process.env.AIRTABLE_PARTICIPATION_TABLE_ID;
    if (!participationTableId) {
      return { success: false, error: 'Participation table ID not configured' };
    }
    
    const participationTable = base(participationTableId);
    let recordsToUpdate = [];
    
    // If we have a specific participation ID, use it directly
    if (participationId && participationId !== 'unknown') {
      try {
        // Verify the participation record exists and belongs to this user
        const record = await participationTable.find(participationId);
        
        if (record && record.fields.Contacts && 
            record.fields.Contacts.includes(contactId) &&
            record.fields.Capacity === "Participant") {
          
          recordsToUpdate.push(record);
          console.log(`Found participation record ${participationId} for the user`);
        } else {
          return { success: false, error: 'Participation record not found or not authorized' };
        }
      } catch (error) {
        console.error(`Error finding participation record ${participationId}:`, error);
        return { success: false, error: 'Participation record not found' };
      }
    } 
    // Otherwise, find the record based on cohortId or programId
    else {
      // Find records with Status="Active" and Capacity="Participant" for this user
      const participationRecords = await participationTable.select({
        filterByFormula: `AND({Contacts}="${contactId}", {Capacity}="Participant", OR({Status}="Active", {Status}=""))`,
      }).firstPage();
      
      console.log(`Found ${participationRecords.length} active participation records with Capacity="Participant"`);
      
      // Filter for the specified cohort or program
      for (const record of participationRecords) {
        // Check if this participation record matches our criteria
        const recordCohorts = record.fields.Cohorts || [];
        const recordInitiative = record.fields.Initiative?.[0] || null;
        
        // If a specific cohort ID was provided, only include that participation record
        if (cohortId && recordCohorts.includes(cohortId)) {
          console.log(`Found participation record ${record.id} linked to the specified cohort ${cohortId}`);
          recordsToUpdate.push(record);
        } 
        // If a specific program ID was provided, check the initiative
        else if (programId && recordInitiative) {
          try {
            const initiativeTable = base(process.env.AIRTABLE_INITIATIVES_TABLE_ID);
            const initiative = await initiativeTable.find(recordInitiative);
            
            if (initiative.id === programId) {
              console.log(`Found participation record ${record.id} with matching initiative ID ${programId}`);
              recordsToUpdate.push(record);
            }
          } catch (error) {
            console.error(`Error checking initiative for record ${record.id}:`, error);
          }
        }
      }
      
      // If we still don't have any records to update, check the user profile as a fallback
      // This might happen if we're working with data that hasn't been fully loaded yet
      if (recordsToUpdate.length === 0) {
        // This would require having the Participation array from the user profile
        // Since we don't have direct access to it here, we'll rely on the main search above
        console.log("No participation records found through direct search");
      }
    }
    
    // Update the found participation records to inactive
    let updatedCount = 0;
    for (const record of recordsToUpdate) {
      try {
        await participationTable.update(record.id, {
          'Status': 'Inactive'
        });
        updatedCount++;
        console.log(`Updated participation record ${record.id} to inactive`);
      } catch (error) {
        console.error(`Error updating participation record ${record.id}:`, error);
      }
    }
    
    // Return results
    return {
      success: true,
      updatedRecords: updatedCount,
      message: updatedCount > 0 ? 
        `Successfully left ${updatedCount} participation record(s)` : 
        'No participation records were found to update'
    };
  } catch (error) {
    console.error('Error leaving participation:', error);
    return { success: false, error: error.message || 'Failed to leave program participation' };
  }
}