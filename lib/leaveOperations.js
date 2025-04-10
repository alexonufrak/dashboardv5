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
 * Helper function to update a team member's status to Inactive
 * 
 * @param {string} memberId - The member record ID to update
 * @param {string} teamId - The team ID (for validation)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateMemberStatus(memberId, teamId) {
  try {
    if (!memberId) {
      return { success: false, error: 'Member ID is required' };
    }

    if (!teamId) {
      return { success: false, error: 'Team ID is required' };
    }

    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      return { success: false, error: 'Members table ID not configured' };
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
    
    try {
      // Verify the member record exists
      const memberRecord = await membersTable.find(memberId);
      
      // Verify this member belongs to the specified team
      const memberTeams = memberRecord.fields.Team || [];
      if (!memberTeams.includes(teamId)) {
        return { success: false, error: 'Member does not belong to this team' };
      }
      
      // Update member status to Inactive
      await membersTable.update(memberId, {
        'Status': 'Inactive'
      });
      
      console.log(`Updated member record ${memberId} to inactive for team ${teamId}`);
      
      return { success: true };
    } catch (error) {
      console.error(`Error updating member ${memberId}:`, error);
      return { success: false, error: error.message || 'Member record not found or could not be updated' };
    }
  } catch (error) {
    console.error('Error updating member status:', error);
    return { success: false, error: error.message || 'Failed to update member status' };
  }
}

/**
 * Helper function to delete a team invitation record
 * 
 * @param {string} memberId - The member record ID (with Invited status) to delete
 * @param {string} teamId - The team ID (for validation)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteTeamInvitation(memberId, teamId) {
  try {
    if (!memberId) {
      return { success: false, error: 'Member ID is required' };
    }

    if (!teamId) {
      return { success: false, error: 'Team ID is required' };
    }

    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      return { success: false, error: 'Members table ID not configured' };
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
    
    try {
      // Verify the member record exists
      const memberRecord = await membersTable.find(memberId);
      
      // Verify this member belongs to the specified team
      const memberTeams = memberRecord.fields.Team || [];
      if (!memberTeams.includes(teamId)) {
        return { success: false, error: 'Member does not belong to this team' };
      }
      
      // Verify this member has Invited status
      const status = memberRecord.fields.Status;
      if (status !== 'Invited') {
        return { success: false, error: 'Only invited members can be deleted' };
      }
      
      // Delete the member record
      await membersTable.destroy(memberId);
      
      console.log(`Deleted invited member record ${memberId} for team ${teamId}`);
      
      // Also try to delete any associated invitation tokens
      const invitesTableId = process.env.AIRTABLE_INVITES_TABLE_ID;
      if (invitesTableId) {
        try {
          const invitesTable = base(invitesTableId);
          
          // Find invitations linked to this member
          const invites = await invitesTable.select({
            filterByFormula: `{Member}="${memberId}"`
          }).firstPage();
          
          // Delete any found invitations
          for (const invite of invites) {
            await invitesTable.destroy(invite.id);
            console.log(`Deleted invitation record ${invite.id} for member ${memberId}`);
          }
        } catch (inviteError) {
          console.error('Error cleaning up invitation tokens:', inviteError);
          // Continue even if invite token cleanup fails
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting invited member ${memberId}:`, error);
      return { success: false, error: error.message || 'Member record not found or could not be deleted' };
    }
  } catch (error) {
    console.error('Error deleting team invitation:', error);
    return { success: false, error: error.message || 'Failed to delete team invitation' };
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
      // Use a more permissive filter to find all participation records for this user
      // We'll filter more specifically in the code after we get the records
      const participationRecords = await participationTable.select({
        filterByFormula: `{Contacts}="${contactId}"`,
      }).firstPage();
      
      console.log(`Found ${participationRecords.length} total participation records for contact ID ${contactId}`);
      
      // Dump the first record's fields to help debug
      if (participationRecords.length > 0) {
        const firstRecord = participationRecords[0];
        console.log('Sample participation record fields:', Object.keys(firstRecord.fields));
        console.log('First record:', {
          id: firstRecord.id,
          contactId: firstRecord.fields.Contacts,
          capacity: firstRecord.fields.Capacity,
          status: firstRecord.fields.Status || firstRecord.fields.status,
          cohorts: firstRecord.fields.Cohorts || [],
          team: firstRecord.fields.Team || []
        });
      }
      
      // If a cohortId was specified, log all cohort IDs to help debug
      if (cohortId) {
        console.log(`Looking for participation records with cohortId: ${cohortId}`);
        for (const record of participationRecords) {
          const recordCohorts = record.fields.Cohorts || [];
          console.log(`Record ${record.id} has cohorts:`, recordCohorts);
        }
      }
      
      // Filter for the specified cohort or program
      for (const record of participationRecords) {
        // Apply filter for active participant records
        const isParticipant = record.fields.Capacity === "Participant";
        const isActive = record.fields.Status === "Active" || !record.fields.Status;
        
        if (!isParticipant) {
          console.log(`Skipping record ${record.id} - not a Participant (capacity: ${record.fields.Capacity})`);
          continue;
        }
        
        if (!isActive) {
          console.log(`Skipping record ${record.id} - not Active (status: ${record.fields.Status})`);
          continue;
        }
        
        // Check if this participation record matches our criteria
        const recordCohorts = record.fields.Cohorts || [];
        const recordInitiative = record.fields.Initiative?.[0] || null;
        
        // For debugging - log record details
        console.log(`Checking participation record ${record.id}:`, {
          cohorts: recordCohorts,
          initiative: recordInitiative,
          team: record.fields.Team || []
        });
        
        // If a specific cohort ID was provided, only include that participation record
        if (cohortId && recordCohorts.includes(cohortId)) {
          console.log(`MATCH: Found participation record ${record.id} linked to the specified cohort ${cohortId}`);
          recordsToUpdate.push(record);
        } 
        // If a specific program ID was provided, check the initiative
        else if (programId && recordInitiative) {
          try {
            const initiativeTable = base(process.env.AIRTABLE_INITIATIVES_TABLE_ID);
            const initiative = await initiativeTable.find(recordInitiative);
            
            if (initiative.id === programId) {
              console.log(`MATCH: Found participation record ${record.id} with matching initiative ID ${programId}`);
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
        // Log the current record status before update
        console.log(`Participation record ${record.id} current status:`, 
          record.fields.Status || 'No status field', 
          'Fields available:', Object.keys(record.fields));
        
        // Try both "Status" and "status" field names to handle case sensitivity
        const updatePayload = {
          'Status': 'Inactive',
          'status': 'Inactive'  // Also try lowercase version as a fallback
        };
        
        console.log(`Updating participation record ${record.id} with payload:`, updatePayload);
        
        const updatedRecord = await participationTable.update(record.id, updatePayload);
        updatedCount++;
        
        // Log the updated record to verify changes
        console.log(`Updated participation record ${record.id} result:`, 
          updatedRecord.fields.Status || updatedRecord.fields.status || 'Status not found in response');
      } catch (error) {
        console.error(`Error updating participation record ${record.id}:`, error);
        // Log more details about the error
        if (error.message) console.error('Error message:', error.message);
        if (error.response) console.error('Error response:', error.response);
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