/**
 * Refactored Team and Program Leave Operations
 * Using the new domain-driven Airtable integration
 */

// Import from our new Airtable structure
import { getContactsTable, getMembersTable, getParticipationTable, getInvitesTable } from '@/lib/airtable/tables';
import { executeQuery } from '@/lib/airtable/core/client';
import { handleAirtableError } from '@/lib/airtable/core/errors';

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
    
    // Get the Members table
    const membersTable = getMembersTable();
    let memberRecordsUpdated = false;
    let updatedCount = 0;
    
    // First check if the contact record has Members links
    const contactsTable = getContactsTable();
    
    try {
      console.log(`Fetching contact record to check for linked Members`);
      const contactRecord = await executeQuery(() => contactsTable.find(contactId));
      
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
              const memberRecord = await executeQuery(() => membersTable.find(memberId));
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
            await executeQuery(() => 
              membersTable.update(memberId, {
                'Status': 'Inactive'
              })
            );
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
      const activeMembers = await executeQuery(() => 
        membersTable.select({
          filterByFormula: filterFormula,
        }).firstPage()
      );
      
      console.log(`Found ${activeMembers.length} active member records to update`);
      
      // Update all active member records to inactive
      for (const record of activeMembers) {
        await executeQuery(() => 
          membersTable.update(record.id, {
            'Status': 'Inactive'
          })
        );
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

    // Get the Members table
    const membersTable = getMembersTable();
    
    try {
      // Verify the member record exists
      const memberRecord = await executeQuery(() => membersTable.find(memberId));
      
      // Verify this member belongs to the specified team
      const memberTeams = memberRecord.fields.Team || [];
      if (!memberTeams.includes(teamId)) {
        return { success: false, error: 'Member does not belong to this team' };
      }
      
      // Update member status to Inactive
      await executeQuery(() => 
        membersTable.update(memberId, {
          'Status': 'Inactive'
        })
      );
      
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

    // Get the Members table
    const membersTable = getMembersTable();
    
    try {
      // Verify the member record exists
      const memberRecord = await executeQuery(() => membersTable.find(memberId));
      
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
      await executeQuery(() => membersTable.destroy(memberId));
      
      console.log(`Deleted invited member record ${memberId} for team ${teamId}`);
      
      // Also try to delete any associated invitation tokens
      try {
        const invitesTable = getInvitesTable();
        
        // Find invitations linked to this member
        const invites = await executeQuery(() => 
          invitesTable.select({
            filterByFormula: `{Member}="${memberId}"`
          }).firstPage()
        );
        
        // Delete any found invitations
        for (const invite of invites) {
          await executeQuery(() => invitesTable.destroy(invite.id));
          console.log(`Deleted invitation record ${invite.id} for member ${memberId}`);
        }
      } catch (inviteError) {
        console.error('Error cleaning up invitation tokens:', inviteError);
        // Continue even if invite token cleanup fails
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
    const participationTable = getParticipationTable();
    let recordsToUpdate = [];
    
    // If we have a specific participation ID, use it directly
    if (participationId && participationId !== 'unknown') {
      try {
        // Verify the participation record exists and belongs to this user
        const record = await executeQuery(() => participationTable.find(participationId));
        
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
      const participationRecords = await executeQuery(() => 
        participationTable.select({
          filterByFormula: `{Contacts}="${contactId}"`,
        }).firstPage()
      );
      
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
      
      // Filter records based on criteria
      for (const record of participationRecords) {
        // Apply filter for active participant records
        const isParticipant = record.fields.Capacity === "Participant";
        const isActive = record.fields.Status === "Active" || !record.fields.Status;
        
        if (!isParticipant || !isActive) {
          continue;
        }
        
        // Check if this participation record matches our criteria
        const recordCohorts = record.fields.Cohorts || [];
        const recordInitiative = record.fields.Initiative?.[0] || null;
        
        // For cohort ID matching
        if (cohortId && recordCohorts.includes(cohortId)) {
          console.log(`Found participation record ${record.id} linked to cohort ${cohortId}`);
          recordsToUpdate.push(record);
        } 
        // For program/initiative ID matching
        else if (programId && recordInitiative === programId) {
          console.log(`Found participation record ${record.id} linked to initiative ${programId}`);
          recordsToUpdate.push(record);
        }
      }
    }
    
    // Update the found participation records to inactive
    let updatedCount = 0;
    for (const record of recordsToUpdate) {
      try {
        // Log the current record status before update
        console.log(`Updating participation record ${record.id} from status: ${record.fields.Status || 'No status'}`);
        
        // Update the record
        await executeQuery(() => 
          participationTable.update(record.id, {
            'Status': 'Inactive'
          })
        );
        updatedCount++;
        console.log(`Successfully updated participation record ${record.id} to Inactive`);
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
    const handledError = handleAirtableError(error, 'leaving participation', { contactId });
    console.error('Error leaving participation:', handledError);
    return { success: false, error: handledError.message || 'Failed to leave program participation' };
  }
}

export default {
  leaveTeam,
  updateMemberStatus,
  deleteTeamInvitation,
  leaveParticipation
};