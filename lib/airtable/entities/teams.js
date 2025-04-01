import { getTeamsTable, getContactsTable, getParticipationTable } from '../tables';
import { executeQuery } from '../core/client';
import { 
  createCacheKey, 
  getCachedOrFetch, 
  clearCacheByType,
  CACHE_TYPES 
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches a team by ID without caching
 * @param {string} teamId Team ID
 * @returns {Promise<Object|null>} Team object or null if not found
 */
export async function fetchTeamById(teamId) {
  try {
    if (!teamId) {
      return null;
    }
    
    console.log(`Fetching team with ID: ${teamId}`);
    
    const teamsTable = getTeamsTable();
    
    // Fetch the team record
    const team = await executeQuery(() => teamsTable.find(teamId));
    
    if (!team) {
      return null;
    }
    
    // Extract and format the team data
    const teamData = {
      id: team.id,
      name: team.fields.Name || team.fields["Team Name"] || "Unnamed Team",
      description: team.fields.Description || "",
      members: team.fields.Members || [],
      initiatives: team.fields.Initiative || [],
      cohorts: team.fields.Cohort || [],
      createdTime: team.fields["Created Time"] || null,
      // Include the original fields for reference
      fields: team.fields
    };
    
    return teamData;
  } catch (error) {
    // If it's a 404 error, return null instead of throwing
    if (error.statusCode === 404) {
      console.log(`Team with ID ${teamId} not found`);
      return null;
    }
    
    throw handleAirtableError(error, 'fetching team by ID', { teamId });
  }
}

/**
 * Gets a team by ID with caching
 * @param {string} teamId Team ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} Team object or null if not found
 */
export async function getTeamById(teamId, options = {}) {
  if (!teamId) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.TEAMS, teamId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchTeamById(teamId),
    options.ttl || 300 // 5 minutes cache by default
  );
}

/**
 * Get team members with detailed profile information
 * @param {string} teamId Team ID
 * @returns {Promise<Array>} Array of team member objects
 */
export async function getTeamMembers(teamId) {
  try {
    const team = await getTeamById(teamId);
    
    if (!team || !team.members || team.members.length === 0) {
      return [];
    }
    
    const contactsTable = getContactsTable();
    const participationTable = getParticipationTable();
    
    // Fetch member records in parallel
    const memberPromises = team.members.map(async (contactId) => {
      try {
        // Get the contact record
        const contact = await executeQuery(() => contactsTable.find(contactId));
        
        if (!contact) return null;
        
        // Find the participation record that links this contact to this team
        const formula = `AND(
          FIND("${contactId.replace(/['"\\]/g, '')}", {Contacts}),
          FIND("${teamId.replace(/['"\\]/g, '')}", {Team})
        )`;
        
        const participationRecords = await executeQuery(() => 
          participationTable.select({
            filterByFormula: formula,
            maxRecords: 1
          }).firstPage()
        );
        
        const participation = participationRecords.length > 0 ? participationRecords[0] : null;
        
        // Format member data
        return {
          contactId: contact.id,
          firstName: contact.fields["First Name"] || "",
          lastName: contact.fields["Last Name"] || "",
          email: contact.fields.Email || "",
          headshot: contact.fields.Headshot || null,
          role: participation?.fields?.Capacity || "Member",
          participationId: participation?.id || null,
          // Add any other fields needed
        };
      } catch (error) {
        console.error(`Error fetching team member ${contactId}:`, error);
        return null;
      }
    });
    
    // Wait for all member promises and filter out nulls
    const members = await Promise.all(memberPromises);
    return members.filter(Boolean);
  } catch (error) {
    throw handleAirtableError(error, 'fetching team members', { teamId });
  }
}

/**
 * Creates a new team
 * @param {Object} data Team data
 * @param {string} data.name Team name
 * @param {string} data.description Team description
 * @param {string[]} [data.memberIds] Initial member IDs
 * @param {string} [data.cohortId] Associated cohort ID
 * @param {string} [data.initiativeId] Associated initiative ID
 * @returns {Promise<Object>} Created team record
 */
export async function createTeam(data) {
  try {
    if (!data.name) {
      throw new Error('Team name is required');
    }
    
    console.log(`Creating team: ${data.name}`);
    
    const teamsTable = getTeamsTable();
    
    // Prepare fields for new record
    const fields = {
      "Name": data.name,
      "Description": data.description || ""
    };
    
    // Add members if provided
    if (data.memberIds && data.memberIds.length > 0) {
      fields["Members"] = data.memberIds;
    }
    
    // Add cohort if provided
    if (data.cohortId) {
      fields["Cohort"] = [data.cohortId];
    }
    
    // Add initiative if provided
    if (data.initiativeId) {
      fields["Initiative"] = [data.initiativeId];
    }
    
    // Create the team record
    const createdTeam = await executeQuery(() => 
      teamsTable.create(fields)
    );
    
    return {
      id: createdTeam.id,
      name: createdTeam.fields.Name,
      description: createdTeam.fields.Description || "",
      members: createdTeam.fields.Members || [],
      cohorts: createdTeam.fields.Cohort || [],
      initiatives: createdTeam.fields.Initiative || [],
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'creating team', data);
  }
}

/**
 * Updates an existing team
 * @param {string} teamId Team ID
 * @param {Object} data Updated team data
 * @returns {Promise<Object>} Updated team record
 */
export async function updateTeam(teamId, data) {
  try {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    
    console.log(`Updating team ${teamId}`);
    
    const teamsTable = getTeamsTable();
    
    // Prepare update fields
    const updateFields = {};
    
    // Only include fields that are provided
    if (data.name !== undefined) {
      updateFields["Name"] = data.name;
    }
    
    if (data.description !== undefined) {
      updateFields["Description"] = data.description;
    }
    
    if (data.memberIds !== undefined) {
      updateFields["Members"] = data.memberIds;
    }
    
    if (data.cohortId !== undefined) {
      updateFields["Cohort"] = data.cohortId ? [data.cohortId] : [];
    }
    
    if (data.initiativeId !== undefined) {
      updateFields["Initiative"] = data.initiativeId ? [data.initiativeId] : [];
    }
    
    // Update the team record
    const updatedTeam = await executeQuery(() => 
      teamsTable.update(teamId, updateFields)
    );
    
    // Clear the cache for this team
    clearCacheByType(CACHE_TYPES.TEAMS, teamId);
    
    return {
      id: updatedTeam.id,
      name: updatedTeam.fields.Name,
      description: updatedTeam.fields.Description || "",
      members: updatedTeam.fields.Members || [],
      cohorts: updatedTeam.fields.Cohort || [],
      initiatives: updatedTeam.fields.Initiative || [],
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'updating team', { teamId, ...data });
  }
}

/**
 * Get all teams for a specific cohort
 * @param {string} cohortId Cohort ID
 * @returns {Promise<Array>} Array of team objects
 */
export async function getTeamsForCohort(cohortId) {
  try {
    if (!cohortId) {
      return [];
    }
    
    const cacheKey = createCacheKey(CACHE_TYPES.TEAMS, `cohort_${cohortId}`);
    
    return getCachedOrFetch(
      cacheKey,
      async () => {
        console.log(`Fetching teams for cohort: ${cohortId}`);
        
        const teamsTable = getTeamsTable();
        
        // Create a safe formula with the cohort ID
        const safeCohortId = cohortId.replace(/['"\\]/g, '');
        const formula = `FIND("${safeCohortId}", {Cohort})`;
        
        // Fetch teams with this cohort
        const records = await executeQuery(() => 
          teamsTable.select({
            filterByFormula: formula
          }).firstPage()
        );
        
        // Format team data
        return records.map(record => ({
          id: record.id,
          name: record.fields.Name || record.fields["Team Name"] || "Unnamed Team",
          description: record.fields.Description || "",
          members: record.fields.Members || [],
          initiatives: record.fields.Initiative || [],
          cohorts: record.fields.Cohort || [],
          // Include the original fields for reference
          fields: record.fields
        }));
      },
      600 // 10 minutes cache
    );
  } catch (error) {
    throw handleAirtableError(error, 'fetching teams for cohort', { cohortId });
  }
}

export default {
  fetchTeamById,
  getTeamById,
  getTeamMembers,
  createTeam,
  updateTeam,
  getTeamsForCohort
};