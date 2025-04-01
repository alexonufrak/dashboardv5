import { 
  getParticipationTable, 
  getCohortsTable, 
  getInitiativesTable, 
  getTeamsTable 
} from '../tables';
import { executeQuery } from '../core/client';
import { 
  createCacheKey, 
  getCachedOrFetch, 
  clearCacheByType,
  CACHE_TYPES 
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches participation records for a contact without caching
 * @param {string} contactId Airtable contact ID
 * @returns {Promise<Array>} Array of participation records
 */
export async function fetchParticipationRecords(contactId) {
  try {
    if (!contactId) {
      return [];
    }
    
    const participationTable = getParticipationTable();
    const cohortsTable = getCohortsTable();
    const initiativesTable = getInitiativesTable();
    const teamsTable = getTeamsTable();
    
    console.log(`Fetching participation records for contact ID: ${contactId}`);
    
    // Sanitize the contact ID to prevent formula injection
    const safeContactId = contactId.replace(/['"\\]/g, '');
    
    // Use FIND in formula to check for contact ID in the Contacts field
    const formula = `OR(
      FIND("${safeContactId}", {Contacts}),
      FIND("${safeContactId}", {contactId}),
      FIND("${safeContactId}", Contacts)
    )`;
    
    // Fetch participation records
    const participationRecords = await executeQuery(() => 
      participationTable.select({
        filterByFormula: formula
      }).firstPage()
    );
    
    console.log(`Found ${participationRecords.length} participation records for contact ${contactId}`);
    
    if (participationRecords.length === 0) {
      return [];
    }
    
    // Process each participation record to include related data
    const processingPromises = participationRecords.map(async (record) => {
      try {
        // Extract key fields from the participation record
        const cohortIds = record.fields.Cohorts || 
                        (record.fields.Cohort ? [record.fields.Cohort] : []);
        
        // Handle records with no cohorts
        if (cohortIds.length === 0) {
          console.log(`Record ${record.id} has no cohorts - attempting to use initiative or create fallback`);
          
          // Try to use initiative if available
          if (record.fields.Initiative && record.fields.Initiative.length > 0) {
            try {
              const initiativeId = record.fields.Initiative[0];
              const initiative = await executeQuery(() => initiativesTable.find(initiativeId));
              
              // Create basic record with initiative data
              return {
                id: record.id,
                status: record.fields.Status || "Active",
                capacity: record.fields.Capacity || "Participant",
                cohort: {
                  id: null,
                  name: initiative.fields.Name ? `${initiative.fields.Name} Program` : "Program",
                  shortName: initiative.fields.Name || "",
                  status: "Active",
                  isCurrent: true,
                  initiativeId: initiativeId
                },
                initiative: {
                  id: initiativeId,
                  name: initiative.fields.Name || "Untitled Initiative",
                  description: initiative.fields.Description || "",
                  "Participation Type": initiative.fields["Participation Type"] || "Individual"
                },
                team: record.fields.Team && record.fields.Team.length > 0 
                  ? { id: record.fields.Team[0] } 
                  : null,
                recordFields: record.fields
              };
            } catch (err) {
              console.error(`Error processing initiative for record ${record.id}:`, err);
            }
          }
          
          // Create fallback record if active status
          if (record.fields.Status === "Active") {
            return {
              id: record.id,
              status: "Active",
              capacity: record.fields.Capacity || "Participant",
              cohort: {
                id: null,
                name: "Program Participation",
                shortName: "",
                status: "Active",
                isCurrent: true
              },
              initiative: {
                id: null,
                name: "Program Participation",
                description: "",
                "Participation Type": "Individual"
              },
              team: record.fields.Team && record.fields.Team.length > 0 
                ? { id: record.fields.Team[0] } 
                : null,
              recordFields: record.fields,
              isFallbackRecord: true
            };
          }
          
          return null;
        }
        
        // Process cohorts in parallel
        const cohortPromises = cohortIds.map(async (cohortId) => {
          try {
            // Get cohort details
            const cohort = await executeQuery(() => cohortsTable.find(cohortId));
            
            // Get initiative details if available
            const initiativeIds = cohort.fields.Initiative || [];
            let initiativeDetails = null;
            
            if (initiativeIds.length > 0) {
              try {
                const initiative = await executeQuery(() => initiativesTable.find(initiativeIds[0]));
                
                initiativeDetails = {
                  id: initiative.id,
                  name: initiative.fields.Name || "Untitled Initiative",
                  description: initiative.fields.Description || "",
                  "Participation Type": initiative.fields["Participation Type"] || "Individual"
                };
              } catch (err) {
                console.error(`Error fetching initiative ${initiativeIds[0]}:`, err);
              }
            }
            
            // Get team information if applicable
            let teamData = null;
            const teamIds = record.fields.Team || [];
            
            if (teamIds.length > 0) {
              try {
                const team = await executeQuery(() => teamsTable.find(teamIds[0]));
                
                teamData = {
                  id: team.id,
                  name: team.fields.Name || team.fields["Team Name"] || "Unnamed Team",
                  description: team.fields.Description || ""
                };
              } catch (teamError) {
                console.error(`Error fetching team ${teamIds[0]}:`, teamError);
              }
            }
            
            // Determine cohort status and currency
            const startDate = cohort.fields["Start Date"] || null;
            const endDate = cohort.fields["End Date"] || null;
            let isCurrent = false;
            
            // Check date-based currency
            if (startDate && endDate) {
              const now = new Date();
              const startDateObj = new Date(startDate);
              const endDateObj = new Date(endDate);
              if (now >= startDateObj && now <= endDateObj) {
                isCurrent = true;
              }
            }
            
            // Check field-based currency
            if (cohort.fields["Current Cohort"] === true || 
                cohort.fields["Is Current"] === true) {
              isCurrent = true;
            }
            
            // Return enhanced record
            return {
              id: record.id,
              status: record.fields.Status || "Active",
              capacity: record.fields.Capacity || "Participant",
              cohort: {
                id: cohort.id,
                name: cohort.fields.Name || "Unnamed Cohort",
                shortName: cohort.fields["Short Name"] || "",
                status: cohort.fields.Status || "Unknown",
                startDate: startDate,
                endDate: endDate,
                isCurrent: isCurrent,
                initiativeId: initiativeIds[0] || null
              },
              initiative: initiativeDetails,
              team: teamData,
              isTeamParticipation: initiativeDetails?.["Participation Type"]?.toLowerCase().includes("team") || false,
              recordFields: record.fields
            };
          } catch (cohortError) {
            console.error(`Error processing cohort ${cohortId}:`, cohortError);
            return null;
          }
        });
        
        // Wait for all cohort promises and filter out nulls
        const cohortResults = await Promise.all(cohortPromises);
        return cohortResults.filter(Boolean);
        
      } catch (recordError) {
        console.error(`Error processing participation record ${record.id}:`, recordError);
        return null;
      }
    });
    
    // Wait for all record processing and flatten results
    const results = await Promise.all(processingPromises);
    const flattenedRecords = results
      .filter(Boolean)
      .flat();
    
    // Filter to only include active records
    const activeRecords = flattenedRecords.filter(record => 
      !record.status || record.status === "Active" || record.status === "active"
    );
    
    console.log(`Found ${flattenedRecords.length} total participation records, ${activeRecords.length} with Active status`);
    
    // Create fallback if necessary
    if (activeRecords.length === 0 && participationRecords.length > 0) {
      console.log(`Creating fallback record for ${contactId} since no active records were found`);
      
      return [{
        id: participationRecords[0].id,
        status: "Active",
        capacity: "Participant",
        cohort: {
          id: null,
          name: "Program Participation",
          shortName: "",
          status: "Active",
          isCurrent: true
        },
        initiative: {
          id: null,
          name: "Program Participation",
          description: "",
          "Participation Type": "Individual"
        },
        team: null,
        isTeamParticipation: false,
        isFallbackRecord: true
      }];
    }
    
    return activeRecords;
  } catch (error) {
    throw handleAirtableError(error, 'fetching participation records', { contactId });
  }
}

/**
 * Gets participation records for a contact with caching
 * @param {string} contactId Airtable contact ID
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of participation records
 */
export async function getParticipationRecords(contactId, options = {}) {
  if (!contactId) return [];
  
  const cacheKey = createCacheKey(CACHE_TYPES.PARTICIPATION, contactId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchParticipationRecords(contactId),
    options.ttl || 600 // 10 minutes cache by default
  );
}

/**
 * Get participation for a specific cohort
 * @param {string} contactId Airtable contact ID
 * @param {string} cohortId Cohort ID
 * @returns {Promise<Object|null>} Participation record or null if not found
 */
export async function getParticipationForCohort(contactId, cohortId) {
  if (!contactId || !cohortId) return null;
  
  const records = await getParticipationRecords(contactId);
  
  return records.find(record => record.cohort?.id === cohortId) || null;
}

/**
 * Get participation for a specific initiative
 * @param {string} contactId Airtable contact ID
 * @param {string} initiativeId Initiative ID
 * @returns {Promise<Object|null>} Participation record or null if not found
 */
export async function getParticipationForInitiative(contactId, initiativeId) {
  if (!contactId || !initiativeId) return null;
  
  const records = await getParticipationRecords(contactId);
  
  return records.find(record => 
    record.initiative?.id === initiativeId || 
    record.cohort?.initiativeId === initiativeId
  ) || null;
}

/**
 * Creates a new participation record
 * @param {Object} data Participation data
 * @param {string} data.contactId Contact ID
 * @param {string} data.cohortId Cohort ID
 * @param {string} [data.teamId] Team ID (if applicable)
 * @param {string} [data.status="Active"] Status
 * @param {string} [data.capacity="Participant"] Capacity
 * @returns {Promise<Object>} Created participation record
 */
export async function createParticipationRecord(data) {
  try {
    if (!data.contactId) {
      throw new Error('Contact ID is required');
    }
    
    if (!data.cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    console.log(`Creating participation record for contact ${data.contactId} in cohort ${data.cohortId}`);
    
    const participationTable = getParticipationTable();
    
    // Prepare fields for new record
    const fields = {
      "Contacts": [data.contactId],
      "Cohorts": [data.cohortId],
      "Status": data.status || "Active",
      "Capacity": data.capacity || "Participant"
    };
    
    // Add team if provided
    if (data.teamId) {
      fields["Team"] = [data.teamId];
    }
    
    // Create the record
    const createdRecord = await executeQuery(() => 
      participationTable.create(fields)
    );
    
    // Clear cache for this contact's participation
    clearCacheByType(CACHE_TYPES.PARTICIPATION, data.contactId);
    
    // Fetch the complete data with related records
    const updatedRecords = await fetchParticipationRecords(data.contactId);
    const newRecord = updatedRecords.find(r => r.id === createdRecord.id) || {
      id: createdRecord.id,
      ...createdRecord.fields,
      contactId: data.contactId,
      cohortId: data.cohortId,
      teamId: data.teamId,
      status: data.status || "Active",
      capacity: data.capacity || "Participant",
      createdAt: new Date().toISOString()
    };
    
    return newRecord;
  } catch (error) {
    throw handleAirtableError(error, 'creating participation record', data);
  }
}

export default {
  fetchParticipationRecords,
  getParticipationRecords,
  getParticipationForCohort,
  getParticipationForInitiative,
  createParticipationRecord
};