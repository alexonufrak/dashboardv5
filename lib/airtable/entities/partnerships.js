import { getTable, getInitiativesTable } from '../tables/definitions';
import { executeQuery } from '../core/client';
import { createCacheKey, getCachedOrFetch, CACHE_TYPES, clearCacheByType } from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Get the partnerships table
 * @returns {Object} Partnerships table
 */
export function getPartnershipsTable() {
  return getTable('PARTNERSHIPS');
}

/**
 * Fetches a partnership by ID without caching
 * @param {string} partnershipId Partnership ID
 * @returns {Promise<Object|null>} Partnership object or null if not found
 */
export async function fetchPartnershipById(partnershipId) {
  try {
    if (!partnershipId) {
      return null;
    }
    
    console.log(`Looking up partnership with ID: ${partnershipId}`);
    
    const partnershipsTable = getPartnershipsTable();
    
    const record = await executeQuery(() => 
      partnershipsTable.find(partnershipId)
    );
    
    if (!record) {
      return null;
    }
    
    // Extract partnership data from the record
    const partnership = {
      id: record.id,
      ...record.fields,
      // Add any processed properties here
      lastFetched: new Date().toISOString()
    };
    
    return partnership;
  } catch (error) {
    throw handleAirtableError(error, 'fetching partnership by ID', { partnershipId });
  }
}

/**
 * Gets a partnership by ID with caching
 * @param {string} partnershipId Partnership ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} Partnership object or null if not found
 */
export async function getPartnershipById(partnershipId, options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.PARTNERSHIPS, partnershipId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchPartnershipById(partnershipId),
    options.ttl || 300 // 5 minutes cache by default
  );
}

/**
 * Fetches partnerships for an institution without caching
 * @param {string} institutionId Institution ID
 * @returns {Promise<Array>} Array of partnership objects
 */
export async function fetchPartnershipsByInstitution(institutionId) {
  try {
    if (!institutionId) {
      return [];
    }
    
    console.log(`Looking up partnerships for institution: ${institutionId}`);
    
    const partnershipsTable = getPartnershipsTable();
    
    // First try to find partnerships with exact formula match
    let records = await executeQuery(() => 
      partnershipsTable
        .select({
          filterByFormula: `{Institution} = "${institutionId}"`,
          sort: [{ field: 'Created Time', direction: 'desc' }]
        })
        .all()
    );
    
    // If no results, try with FIND function which is more flexible 
    // (for cases where Institution is an array of IDs)
    if (!records || records.length === 0) {
      console.log(`No exact matches found, trying FIND for institution: ${institutionId}`);
      const safeInstitutionId = institutionId.replace(/['"\\]/g, '');
      records = await executeQuery(() => 
        partnershipsTable
          .select({
            filterByFormula: `FIND("${safeInstitutionId}", {Institution})`,
            sort: [{ field: 'Created Time', direction: 'desc' }]
          })
          .all()
      );
    }
    
    // If still no results, try getting all partnerships and filter client-side
    if (!records || records.length === 0) {
      console.log(`No formula matches found, fetching all partnerships for institution: ${institutionId}`);
      const allPartnerships = await executeQuery(() => 
        partnershipsTable
          .select()
          .all()
      );
      
      // Filter for partnerships that include our institution ID
      records = allPartnerships.filter(partnership => {
        const institutions = partnership.fields.Institution || [];
        return institutions.includes(institutionId);
      });
    }
    
    console.log(`Found ${records.length} total partnerships for institution ${institutionId}`);
    
    if (!records || records.length === 0) {
      return [];
    }
    
    // Process records
    const partnerships = records.map(record => ({
      id: record.id,
      ...record.fields,
      // Add processed properties for common fields
      institutionId: record.fields.Institution?.[0] || null,
      programId: record.fields.Initiative?.[0] || null,
      status: record.fields.Status || 'Active',
      // Include the cohorts array which is used for institution->cohort lookups
      cohortIds: record.fields.Cohorts || [],
      // DateTime fields processing
      createdTime: record.fields['Created Time'] || null,
      lastModifiedTime: record.fields['Last Modified Time'] || null,
      // Tracking metadata
      lastFetched: new Date().toISOString()
    }));
    
    return partnerships;
  } catch (error) {
    throw handleAirtableError(error, 'fetching partnerships by institution', { institutionId });
  }
}

/**
 * Gets partnerships for an institution with caching
 * @param {string} institutionId Institution ID
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of partnership objects
 */
export async function getPartnershipsByInstitution(institutionId, options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.PARTNERSHIPS, `institution_${institutionId}`);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchPartnershipsByInstitution(institutionId),
    options.ttl || 300 // 5 minutes cache by default
  );
}

/**
 * Fetches partnerships for an initiative without caching
 * 
 * Note: In the Airtable schema, "Initiative" is the actual table name for what
 * users often refer to as "Programs" in the UI. We use "initiative" terminology in
 * our internal implementation for consistency with the database schema.
 * 
 * @param {string} initiativeId Initiative ID
 * @returns {Promise<Array>} Array of partnership objects
 */
export async function fetchPartnershipsByInitiative(initiativeId) {
  try {
    if (!initiativeId) {
      return [];
    }
    
    console.log(`Looking up partnerships for initiative: ${initiativeId}`);
    
    const partnershipsTable = getPartnershipsTable();
    
    const records = await executeQuery(() => 
      partnershipsTable
        .select({
          filterByFormula: `{Initiative} = "${initiativeId}"`,
          sort: [{ field: 'Created Time', direction: 'desc' }]
        })
        .all()
    );
    
    if (!records || records.length === 0) {
      return [];
    }
    
    // Process records
    const partnerships = records.map(record => ({
      id: record.id,
      ...record.fields,
      // Add processed properties for common fields
      institutionId: record.fields.Institution?.[0] || null,
      initiativeId: record.fields.Initiative?.[0] || null,
      status: record.fields.Status || 'Active',
      // Include the cohorts array which is used for initiative->cohort lookups
      cohortIds: record.fields.Cohorts || [],
      // DateTime fields processing
      createdTime: record.fields['Created Time'] || null,
      lastModifiedTime: record.fields['Last Modified Time'] || null,
      // Tracking metadata
      lastFetched: new Date().toISOString()
    }));
    
    return partnerships;
  } catch (error) {
    throw handleAirtableError(error, 'fetching partnerships by initiative', { initiativeId });
  }
}

// Legacy alias for backward compatibility - will be deprecated in future versions
export const fetchPartnershipsByProgram = fetchPartnershipsByInitiative;

/**
 * Gets partnerships for an initiative with caching
 * @param {string} initiativeId Initiative ID
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of partnership objects
 */
export async function getPartnershipsByInitiative(initiativeId, options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.PARTNERSHIPS, `initiative_${initiativeId}`);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchPartnershipsByInitiative(initiativeId),
    options.ttl || 300 // 5 minutes cache by default
  );
}

// Legacy alias for backward compatibility - will be deprecated in future versions
export const getPartnershipsByProgram = getPartnershipsByInitiative;

/**
 * Creates a new partnership
 * @param {Object} data Partnership data
 * @returns {Promise<Object>} Created partnership
 */
export async function createPartnership(data) {
  try {
    // Check for required fields - accept either programId or initiativeId
    const initiativeId = data.initiativeId || data.programId;
    
    if (!data.institutionId || !initiativeId) {
      throw new Error('Institution ID and Initiative ID are required');
    }
    
    console.log(`Creating partnership between institution ${data.institutionId} and initiative ${initiativeId}`);
    
    const partnershipsTable = getPartnershipsTable();
    
    // Prepare the data for Airtable
    const fields = {
      'Institution': [data.institutionId],
      'Initiative': [initiativeId],
      'Status': data.status || 'Active',
      'Partnership Type': data.partnershipType || 'Standard',
      'Start Date': data.startDate || null,
      'End Date': data.endDate || null,
      'Notes': data.notes || null
    };
    
    // Add cohort IDs if provided
    if (data.cohortIds && Array.isArray(data.cohortIds) && data.cohortIds.length > 0) {
      fields['Cohorts'] = data.cohortIds;
    }
    
    // Create the record
    const record = await executeQuery(() => 
      partnershipsTable.create(fields)
    );
    
    // Clear cache for related entities
    clearCacheByType(CACHE_TYPES.PARTNERSHIPS, `institution_${data.institutionId}`);
    clearCacheByType(CACHE_TYPES.PARTNERSHIPS, `initiative_${initiativeId}`);
    if (data.programId !== initiativeId) {
      clearCacheByType(CACHE_TYPES.PARTNERSHIPS, `program_${data.programId}`); // For backward compatibility
    }
    
    // Return the created partnership
    return {
      id: record.id,
      ...record.fields,
      institutionId: data.institutionId,
      initiativeId: initiativeId,
      status: record.fields.Status || 'Active',
      cohortIds: record.fields.Cohorts || [],
      createdTime: record.fields['Created Time'] || new Date().toISOString(),
      lastModifiedTime: record.fields['Last Modified Time'] || new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'creating partnership', data);
  }
}

/**
 * Updates a partnership
 * @param {string} partnershipId Partnership ID
 * @param {Object} data Update data
 * @returns {Promise<Object>} Updated partnership
 */
export async function updatePartnership(partnershipId, data) {
  try {
    if (!partnershipId) {
      throw new Error('Partnership ID is required');
    }
    
    console.log(`Updating partnership ${partnershipId}`);
    
    const partnershipsTable = getPartnershipsTable();
    
    // Prepare fields to update
    const fields = {};
    
    // Only include fields that are actually provided
    if (data.status) fields['Status'] = data.status;
    if (data.partnershipType) fields['Partnership Type'] = data.partnershipType;
    if (data.startDate) fields['Start Date'] = data.startDate;
    if (data.endDate) fields['End Date'] = data.endDate;
    if (data.notes) fields['Notes'] = data.notes;
    
    // Handle cohort updates if provided
    if (data.cohortIds && Array.isArray(data.cohortIds)) {
      fields['Cohorts'] = data.cohortIds;
    }
    
    // Update the record
    const record = await executeQuery(() => 
      partnershipsTable.update(partnershipId, fields)
    );
    
    // Get institution and initiative IDs for cache invalidation
    const institutionId = record.fields.Institution?.[0];
    const initiativeId = record.fields.Initiative?.[0];
    
    // Clear relevant caches
    clearCacheByType(CACHE_TYPES.PARTNERSHIPS, partnershipId);
    if (institutionId) clearCacheByType(CACHE_TYPES.PARTNERSHIPS, `institution_${institutionId}`);
    if (initiativeId) {
      clearCacheByType(CACHE_TYPES.PARTNERSHIPS, `initiative_${initiativeId}`);
      clearCacheByType(CACHE_TYPES.PARTNERSHIPS, `program_${initiativeId}`); // For backward compatibility
    }
    
    // Return the updated partnership
    return {
      id: record.id,
      ...record.fields,
      institutionId: record.fields.Institution?.[0] || null,
      initiativeId: record.fields.Initiative?.[0] || null,
      cohortIds: record.fields.Cohorts || [],
      status: record.fields.Status || 'Active',
      lastModifiedTime: record.fields['Last Modified Time'] || new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'updating partnership', { partnershipId, ...data });
  }
}

export default {
  getPartnershipsTable,
  fetchPartnershipById,
  getPartnershipById,
  fetchPartnershipsByInstitution,
  getPartnershipsByInstitution,
  fetchPartnershipsByInitiative,
  getPartnershipsByInitiative,
  // Legacy exports for backward compatibility
  fetchPartnershipsByProgram,
  getPartnershipsByProgram,
  createPartnership,
  updatePartnership
};