import { getCohortsTable, getInitiativesTable, getInstitutionsTable } from '../tables';
import { executeQuery } from '../core/client';
import { 
  createCacheKey, 
  getCachedOrFetch, 
  clearCacheByType,
  CACHE_TYPES 
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches a cohort by ID without caching
 * @param {string} cohortId Cohort ID
 * @returns {Promise<Object|null>} Cohort object or null if not found
 */
export async function fetchCohortById(cohortId) {
  try {
    if (!cohortId) {
      return null;
    }
    
    console.log(`Fetching cohort with ID: ${cohortId}`);
    
    const cohortsTable = getCohortsTable();
    
    // Fetch the cohort record
    const cohort = await executeQuery(() => cohortsTable.find(cohortId));
    
    if (!cohort) {
      return null;
    }
    
    // Get initiative details if available
    let initiative = null;
    if (cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
      try {
        const initiativeId = cohort.fields.Initiative[0];
        const initiativesTable = getInitiativesTable();
        initiative = await executeQuery(() => initiativesTable.find(initiativeId));
      } catch (error) {
        console.error(`Error fetching initiative for cohort ${cohortId}:`, error);
      }
    }
    
    // Extract and format the cohort data with safe field access
    const cohortData = {
      id: cohort.id,
      name: cohort.fields.Name || "Unnamed Cohort",
      shortName: cohort.fields["Short Name"] || "",
      status: cohort.fields.Status || "Unknown",
      startDate: cohort.fields["Start Date"] || null,
      endDate: cohort.fields["End Date"] || null,
      description: cohort.fields.Description || "",
      isPublic: Boolean(cohort.fields["Public"]),
      
      // Check if this is a current cohort using multiple potential field names
      isCurrent: Boolean(
        cohort.fields["Current Cohort"] || 
        cohort.fields["Is Current"] || 
        cohort.fields["Current"] ||
        // Alternative: date-based currency check
        (cohort.fields["Start Date"] && cohort.fields["End Date"] && 
         new Date() >= new Date(cohort.fields["Start Date"]) && 
         new Date() <= new Date(cohort.fields["End Date"]))
      ),
      
      // Include initiative details if available
      initiative: initiative ? {
        id: initiative.id,
        name: initiative.fields.Name || "Unnamed Initiative",
        description: initiative.fields.Description || "",
        participationType: initiative.fields["Participation Type"] || "Individual"
      } : null,
      
      // Store initiative ID directly for easy reference
      initiativeId: cohort.fields.Initiative && cohort.fields.Initiative.length > 0 
        ? cohort.fields.Initiative[0] 
        : null,
      
      // Include institution ID if available
      institutionIds: cohort.fields.Institution || [],
      
      // Include the original fields for reference
      fields: cohort.fields
    };
    
    return cohortData;
  } catch (error) {
    // If it's a 404 error, return null instead of throwing
    if (error.statusCode === 404) {
      console.log(`Cohort with ID ${cohortId} not found`);
      return null;
    }
    
    throw handleAirtableError(error, 'fetching cohort by ID', { cohortId });
  }
}

/**
 * Gets a cohort by ID with caching
 * @param {string} cohortId Cohort ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} Cohort object or null if not found
 */
export async function getCohortById(cohortId, options = {}) {
  if (!cohortId) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.COHORTS, cohortId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchCohortById(cohortId),
    options.ttl || 600 // 10 minutes cache by default
  );
}

/**
 * Fetches cohorts by institution without caching
 * @param {string} institutionId Institution ID
 * @returns {Promise<Array>} Array of cohort objects
 */
export async function fetchCohortsByInstitution(institutionId) {
  try {
    if (!institutionId) {
      return [];
    }
    
    console.log(`Fetching cohorts for institution ID: ${institutionId}`);
    
    // Step 1: Fetch cohorts directly linked to the institution
    const cohortsTable = getCohortsTable();
    
    // Create a safe formula with the institution ID
    const safeInstitutionId = institutionId.replace(/['"\\]/g, '');
    const formula = `FIND("${safeInstitutionId}", {Institution})`;
    
    // Fetch cohorts for this institution
    const records = await executeQuery(() => 
      cohortsTable.select({
        filterByFormula: formula
      }).firstPage()
    );
    
    console.log(`Found ${records.length} directly linked cohorts for institution ${institutionId}`);
    
    // Process each cohort to include basic data
    const directCohorts = await Promise.all(
      records.map(async (record) => {
        try {
          // Get initiative details if available
          let initiative = null;
          if (record.fields.Initiative && record.fields.Initiative.length > 0) {
            try {
              const initiativeId = record.fields.Initiative[0];
              const initiativesTable = getInitiativesTable();
              initiative = await executeQuery(() => initiativesTable.find(initiativeId));
            } catch (err) {
              console.error(`Error fetching initiative for cohort ${record.id}:`, err);
            }
          }
          
          return {
            id: record.id,
            name: record.fields.Name || "Unnamed Cohort",
            shortName: record.fields["Short Name"] || "",
            status: record.fields.Status || "Unknown",
            startDate: record.fields["Start Date"] || null,
            endDate: record.fields["End Date"] || null,
            description: record.fields.Description || "",
            isPublic: Boolean(record.fields["Public"]),
            
            // Check if this is a current cohort
            isCurrent: Boolean(
              record.fields["Current Cohort"] || 
              record.fields["Is Current"] || 
              record.fields["Current"] ||
              // Alternative: date-based currency check
              (record.fields["Start Date"] && record.fields["End Date"] && 
               new Date() >= new Date(record.fields["Start Date"]) && 
               new Date() <= new Date(record.fields["End Date"]))
            ),
            
            // Include initiative details if available
            initiative: initiative ? {
              id: initiative.id,
              name: initiative.fields.Name || "Unnamed Initiative",
              description: initiative.fields.Description || "",
              participationType: initiative.fields["Participation Type"] || "Individual"
            } : null,
            
            // Store initiative ID directly for easy reference
            initiativeId: record.fields.Initiative && record.fields.Initiative.length > 0 
              ? record.fields.Initiative[0] 
              : null,
            
            // Include institution ID for reference
            institutionIds: record.fields.Institution || [],
            
            // Mark source for debugging
            source: 'direct'
          };
        } catch (error) {
          console.error(`Error processing cohort ${record.id}:`, error);
          return null;
        }
      })
    );
    
    // Step 2: Get cohorts through partnerships
    // Import the partnerships module
    const { getPartnershipsByInstitution } = require('../entities/partnerships');
    
    // Fetch partnerships for this institution
    let partnershipCohorts = [];
    try {
      const partnerships = await getPartnershipsByInstitution(institutionId);
      console.log(`Found ${partnerships.length} partnerships for institution ${institutionId}`);
      
      // Extract cohort IDs from partnerships
      const cohortIdsFromPartnerships = new Set();
      
      partnerships.forEach(partnership => {
        // Check for cohorts in the partnership record
        const partnershipCohorts = partnership.fields?.Cohorts || [];
        partnershipCohorts.forEach(cohortId => {
          cohortIdsFromPartnerships.add(cohortId);
        });
      });
      
      console.log(`Found ${cohortIdsFromPartnerships.size} cohorts from partnerships`);
      
      // Fetch details for each cohort from partnerships
      if (cohortIdsFromPartnerships.size > 0) {
        const cohortDetails = await Promise.all(
          [...cohortIdsFromPartnerships].map(async (cohortId) => {
            try {
              return await fetchCohortById(cohortId);
            } catch (error) {
              console.error(`Error fetching cohort ${cohortId} from partnership:`, error);
              return null;
            }
          })
        );
        
        // Add a source marker to partnership cohorts
        partnershipCohorts = cohortDetails
          .filter(Boolean)
          .map(cohort => ({
            ...cohort,
            source: 'partnership'
          }));
      }
    } catch (error) {
      console.error(`Error fetching partnerships for institution ${institutionId}:`, error);
      // Continue with direct cohorts only
    }
    
    // Combine direct cohorts and partnership cohorts, removing duplicates
    const allCohorts = [...directCohorts];
    
    // Add partnership cohorts only if they're not already included
    partnershipCohorts.forEach(partnershipCohort => {
      if (!allCohorts.some(cohort => cohort.id === partnershipCohort.id)) {
        allCohorts.push(partnershipCohort);
      }
    });
    
    console.log(`Returning ${allCohorts.length} total cohorts for institution ${institutionId}`);
    
    // Filter out nulls and return
    return allCohorts.filter(Boolean);
  } catch (error) {
    throw handleAirtableError(error, 'fetching cohorts by institution', { institutionId });
  }
}

/**
 * Gets cohorts by institution with caching
 * @param {string} institutionId Institution ID
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of cohort objects
 */
export async function getCohortsByInstitution(institutionId, options = {}) {
  if (!institutionId) return [];
  
  const cacheKey = createCacheKey(CACHE_TYPES.COHORTS, `institution_${institutionId}`);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchCohortsByInstitution(institutionId),
    options.ttl || 600 // 10 minutes cache by default
  );
}

/**
 * Fetches current active cohorts
 * @returns {Promise<Array>} Array of current cohort objects
 */
export async function fetchCurrentCohorts() {
  try {
    console.log('Fetching current cohorts');
    
    const cohortsTable = getCohortsTable();
    
    // Build a formula to find current cohorts
    // Check multiple potential fields for "current" status
    // Also check date-based currency
    const now = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const formula = `OR(
      {Current Cohort}=TRUE(),
      {Is Current}=TRUE(),
      {Current}=TRUE(),
      AND(
        {Start Date},
        {End Date},
        {Start Date}<="${now}",
        {End Date}>="${now}"
      )
    )`;
    
    // Fetch current cohorts
    const records = await executeQuery(() => 
      cohortsTable.select({
        filterByFormula: formula
      }).firstPage()
    );
    
    console.log(`Found ${records.length} current cohorts`);
    
    // Process each cohort
    const cohorts = await Promise.all(
      records.map(async (record) => {
        try {
          // Get initiative details if available
          let initiative = null;
          if (record.fields.Initiative && record.fields.Initiative.length > 0) {
            try {
              const initiativeId = record.fields.Initiative[0];
              const initiativesTable = getInitiativesTable();
              initiative = await executeQuery(() => initiativesTable.find(initiativeId));
            } catch (err) {
              console.error(`Error fetching initiative for cohort ${record.id}:`, err);
            }
          }
          
          return {
            id: record.id,
            name: record.fields.Name || "Unnamed Cohort",
            shortName: record.fields["Short Name"] || "",
            status: record.fields.Status || "Unknown",
            startDate: record.fields["Start Date"] || null,
            endDate: record.fields["End Date"] || null,
            description: record.fields.Description || "",
            isPublic: Boolean(record.fields["Public"]),
            isCurrent: true, // These are all current by query definition
            
            // Include initiative details if available
            initiative: initiative ? {
              id: initiative.id,
              name: initiative.fields.Name || "Unnamed Initiative",
              description: initiative.fields.Description || "",
              participationType: initiative.fields["Participation Type"] || "Individual"
            } : null,
            
            // Store initiative ID directly for easy reference
            initiativeId: record.fields.Initiative && record.fields.Initiative.length > 0 
              ? record.fields.Initiative[0] 
              : null,
            
            // Include institution IDs
            institutionIds: record.fields.Institution || []
          };
        } catch (error) {
          console.error(`Error processing cohort ${record.id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out nulls
    return cohorts.filter(Boolean);
  } catch (error) {
    throw handleAirtableError(error, 'fetching current cohorts');
  }
}

/**
 * Gets current cohorts with caching
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of current cohort objects
 */
export async function getCurrentCohorts(options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.COHORTS, 'current');
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchCurrentCohorts(),
    options.ttl || 300 // 5 minutes cache by default
  );
}

/**
 * Fetches public cohorts that accept applications
 * @returns {Promise<Array>} Array of public cohort objects
 */
export async function fetchPublicCohorts() {
  try {
    console.log('Fetching public cohorts');
    
    const cohortsTable = getCohortsTable();
    
    // Build a formula to find public cohorts accepting applications
    const formula = `AND(
      {Public}=TRUE(),
      {Status}="Active",
      {Accepting Applications}=TRUE()
    )`;
    
    // Fetch public cohorts
    const records = await executeQuery(() => 
      cohortsTable.select({
        filterByFormula: formula
      }).firstPage()
    );
    
    console.log(`Found ${records.length} public cohorts`);
    
    // Process each cohort
    const cohorts = await Promise.all(
      records.map(async (record) => {
        try {
          // Get initiative details if available
          let initiative = null;
          if (record.fields.Initiative && record.fields.Initiative.length > 0) {
            try {
              const initiativeId = record.fields.Initiative[0];
              const initiativesTable = getInitiativesTable();
              initiative = await executeQuery(() => initiativesTable.find(initiativeId));
            } catch (err) {
              console.error(`Error fetching initiative for cohort ${record.id}:`, err);
            }
          }
          
          // Get institution details if available
          let institutions = [];
          if (record.fields.Institution && record.fields.Institution.length > 0) {
            try {
              const institutionsTable = getInstitutionsTable();
              const institutionPromises = record.fields.Institution.map(id => 
                executeQuery(() => institutionsTable.find(id))
                  .catch(err => {
                    console.error(`Error fetching institution ${id}:`, err);
                    return null;
                  })
              );
              
              institutions = (await Promise.all(institutionPromises))
                .filter(Boolean)
                .map(inst => ({
                  id: inst.id,
                  name: inst.fields.Name || "Unnamed Institution",
                  shortName: inst.fields["Short Name"] || "",
                  domains: inst.fields.Domains || []
                }));
            } catch (err) {
              console.error(`Error fetching institutions for cohort ${record.id}:`, err);
            }
          }
          
          return {
            id: record.id,
            name: record.fields.Name || "Unnamed Cohort",
            shortName: record.fields["Short Name"] || "",
            status: record.fields.Status || "Unknown",
            startDate: record.fields["Start Date"] || null,
            endDate: record.fields["End Date"] || null,
            description: record.fields.Description || "",
            isPublic: true, // These are all public by query definition
            
            // Check if this is a current cohort
            isCurrent: Boolean(
              record.fields["Current Cohort"] || 
              record.fields["Is Current"] || 
              record.fields["Current"] ||
              // Alternative: date-based currency check
              (record.fields["Start Date"] && record.fields["End Date"] && 
               new Date() >= new Date(record.fields["Start Date"]) && 
               new Date() <= new Date(record.fields["End Date"]))
            ),
            
            // Application details
            acceptingApplications: true, // These are all accepting applications by query definition
            applicationDeadline: record.fields["Application Deadline"] || null,
            applicationUrl: record.fields["Application URL"] || null,
            
            // Include initiative details if available
            initiative: initiative ? {
              id: initiative.id,
              name: initiative.fields.Name || "Unnamed Initiative",
              description: initiative.fields.Description || "",
              participationType: initiative.fields["Participation Type"] || "Individual"
            } : null,
            
            // Store initiative ID directly for easy reference
            initiativeId: record.fields.Initiative && record.fields.Initiative.length > 0 
              ? record.fields.Initiative[0] 
              : null,
            
            // Include institution details
            institutions: institutions,
            institutionIds: record.fields.Institution || []
          };
        } catch (error) {
          console.error(`Error processing cohort ${record.id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out nulls
    return cohorts.filter(Boolean);
  } catch (error) {
    throw handleAirtableError(error, 'fetching public cohorts');
  }
}

/**
 * Gets public cohorts with caching
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of public cohort objects
 */
export async function getPublicCohorts(options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.COHORTS, 'public');
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchPublicCohorts(),
    options.ttl || 600 // 10 minutes cache by default
  );
}

export default {
  fetchCohortById,
  getCohortById,
  fetchCohortsByInstitution,
  getCohortsByInstitution,
  fetchCurrentCohorts,
  getCurrentCohorts,
  fetchPublicCohorts,
  getPublicCohorts
};