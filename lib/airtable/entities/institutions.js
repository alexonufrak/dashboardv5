import { getInstitutionsTable } from '../tables';
import { executeQuery } from '../core/client';
import { 
  createCacheKey, 
  getCachedOrFetch, 
  CACHE_TYPES 
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches institution record by ID without caching
 * @param {string} institutionId Institution record ID
 * @returns {Promise<Object|null>} Institution record or null if not found
 */
export async function fetchInstitution(institutionId) {
  try {
    if (!institutionId) {
      return null;
    }
    
    console.log(`Fetching institution record: ${institutionId}`);
    
    const institutionsTable = getInstitutionsTable();
    
    // Fetch the institution record
    const record = await executeQuery(() => 
      institutionsTable.find(institutionId)
    );
    
    if (!record) {
      return null;
    }
    
    return {
      id: record.id,
      ...record.fields,
      // Add standardized fields
      name: record.fields.Name,
      domain: record.fields.Domain,
      state: record.fields.State,
      // Timestamp for caching purposes
      lastFetched: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'fetching institution record', { institutionId });
  }
}

/**
 * Gets institution record by ID with caching
 * @param {string} institutionId Institution record ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} Institution record or null if not found
 */
export async function getInstitution(institutionId, options = {}) {
  if (!institutionId) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.INSTITUTIONS, institutionId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchInstitution(institutionId),
    options.ttl || 86400 // 24 hour cache by default (institution data changes very infrequently)
  );
}

/**
 * Looks up institution by email domain
 * @param {string} email Email address to extract domain from
 * @returns {Promise<Object|null>} Institution record or null if not found
 */
export async function lookupInstitutionByEmail(email) {
  try {
    if (!email || !email.includes('@')) {
      return null;
    }
    
    // Extract the domain from email
    const domain = email.split('@')[1].toLowerCase();
    console.log(`Looking up institution for domain: ${domain}`);
    
    const institutionsTable = getInstitutionsTable();
    
    // Find institution with matching domain
    const records = await executeQuery(() => 
      institutionsTable
        .select({
          filterByFormula: `OR(
            LOWER({Domain})="${domain}",
            LOWER({Domain})="*.${domain}",
            SEARCH("${domain}", LOWER({Domain}))
          )`,
          maxRecords: 1
        })
        .firstPage()
    );
    
    if (!records || records.length === 0) {
      return null;
    }
    
    const institution = records[0];
    
    return {
      id: institution.id,
      name: institution.fields.Name,
      domain: institution.fields.Domain,
      state: institution.fields.State
    };
  } catch (error) {
    console.error(`Error looking up institution by email domain: ${error.message}`);
    return null; // Return null instead of throwing, as this is a helper function
  }
}

/**
 * Searches for institutions by name
 * @param {string} query Name search query
 * @param {number} limit Maximum number of results to return
 * @returns {Promise<Array>} Array of matching institutions
 */
export async function searchInstitutionsByName(query, limit = 10) {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    console.log(`Searching institutions for: "${normalizedQuery}"`);
    
    const institutionsTable = getInstitutionsTable();
    
    // Find institutions with matching name (uses case-insensitive FIND function)
    const records = await executeQuery(() => 
      institutionsTable
        .select({
          filterByFormula: `OR(
            SEARCH("${normalizedQuery}", LOWER({Name})),
            SEARCH("${normalizedQuery}", LOWER({Aliases}))
          )`,
          maxRecords: limit,
          sort: [{ field: "Students", direction: "desc" }]
        })
        .firstPage()
    );
    
    if (!records || records.length === 0) {
      return [];
    }
    
    // Map records to simplified objects
    return records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      domain: record.fields.Domain,
      state: record.fields.State,
      type: record.fields.Type
    }));
  } catch (error) {
    throw handleAirtableError(error, 'searching institutions', { query });
  }
}

export default {
  fetchInstitution,
  getInstitution,
  lookupInstitutionByEmail,
  searchInstitutionsByName
};