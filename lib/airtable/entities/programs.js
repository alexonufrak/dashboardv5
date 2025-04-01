import { getProgramsTable, getInitiativesTable } from '../tables';
import { executeQuery } from '../core/client';
import {
  createCacheKey,
  getCachedOrFetch,
  clearCacheByType,
  CACHE_TYPES
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches a program by ID without caching
 * @param {string} programId Program/initiative ID
 * @returns {Promise<Object|null>} Program object or null if not found
 */
export async function fetchProgramById(programId) {
  try {
    if (!programId) {
      return null;
    }

    console.log(`Fetching program with ID: ${programId}`);

    // Try fetching from both the Programs and Initiatives tables
    // since the ID might be in either one depending on the use case
    const programsTable = getProgramsTable();
    const initiativesTable = getInitiativesTable();

    let program = null;

    // First try the Initiatives table
    try {
      program = await executeQuery(() => initiativesTable.find(programId));
      
      if (program) {
        console.log(`Found program in Initiatives table: ${program.id}`);
        
        // Format initiative data
        return {
          id: program.id,
          name: program.fields.Name || "Unnamed Initiative",
          description: program.fields.Description || "",
          participationType: program.fields["Participation Type"] || "Individual",
          status: program.fields.Status || "Unknown",
          source: "initiatives",
          // Include the original fields for reference
          fields: program.fields
        };
      }
    } catch (error) {
      if (error.statusCode !== 404) {
        console.error(`Error fetching from initiatives table:`, error);
      }
      // Continue to try the Programs table if not found
    }

    // If not found in Initiatives, try Programs table
    try {
      program = await executeQuery(() => programsTable.find(programId));
      
      if (program) {
        console.log(`Found program in Programs table: ${program.id}`);
        
        // Format program data
        return {
          id: program.id,
          name: program.fields.Name || program.fields.Major || "Unnamed Program",
          description: program.fields.Description || "",
          institution: program.fields.Institution && program.fields.Institution.length > 0 
            ? program.fields.Institution[0] 
            : null,
          status: program.fields.Status || "Unknown",
          source: "programs",
          // For education programs, include major field
          major: program.fields.Major || program.fields.Name || "",
          // Include the original fields for reference
          fields: program.fields
        };
      }
    } catch (error) {
      if (error.statusCode !== 404) {
        console.error(`Error fetching from programs table:`, error);
      }
      // Return null below if not found
    }

    // If we get here, the program wasn't found in either table
    console.log(`Program with ID ${programId} not found in any table`);
    return null;
  } catch (error) {
    throw handleAirtableError(error, 'fetching program by ID', { programId });
  }
}

/**
 * Gets a program by ID with caching
 * @param {string} programId Program/initiative ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} Program object or null if not found
 */
export async function getProgramById(programId, options = {}) {
  if (!programId) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.PROGRAMS, programId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchProgramById(programId),
    options.ttl || 900 // 15 minutes cache by default
  );
}

/**
 * Fetches programs/majors by institution ID without caching
 * @param {string} institutionId Institution ID
 * @returns {Promise<Array>} Array of program objects
 */
export async function fetchProgramsByInstitution(institutionId) {
  try {
    if (!institutionId) {
      return [];
    }
    
    console.log(`Fetching programs for institution ID: ${institutionId}`);
    
    const programsTable = getProgramsTable();
    
    // Create a safe formula to find programs for this institution
    const safeInstitutionId = institutionId.replace(/['"\\]/g, '');
    const formula = `FIND("${safeInstitutionId}", {Institution})`;
    
    // Fetch programs for this institution
    const records = await executeQuery(() => 
      programsTable.select({
        filterByFormula: formula
      }).firstPage()
    );
    
    console.log(`Found ${records.length} programs for institution ${institutionId}`);
    
    // Format program data
    return records.map(record => ({
      id: record.id,
      name: record.fields.Name || record.fields.Major || "Unnamed Program",
      description: record.fields.Description || "",
      major: record.fields.Major || record.fields.Name || "",
      institution: record.fields.Institution && record.fields.Institution.length > 0 
        ? record.fields.Institution[0] 
        : null,
      status: record.fields.Status || "Unknown",
      source: "programs"
    }));
  } catch (error) {
    throw handleAirtableError(error, 'fetching programs by institution', { institutionId });
  }
}

/**
 * Gets programs/majors by institution ID with caching
 * @param {string} institutionId Institution ID
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of program objects
 */
export async function getProgramsByInstitution(institutionId, options = {}) {
  if (!institutionId) return [];
  
  const cacheKey = createCacheKey(CACHE_TYPES.PROGRAMS, `institution_${institutionId}`);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchProgramsByInstitution(institutionId),
    options.ttl || 3600 // 1 hour cache by default
  );
}

/**
 * Fetches initiatives (program-type) with active cohorts
 * @returns {Promise<Array>} Array of initiative objects
 */
export async function fetchActiveInitiatives() {
  try {
    console.log('Fetching active initiatives');
    
    const initiativesTable = getInitiativesTable();
    
    // Fetch active initiatives
    const records = await executeQuery(() => 
      initiativesTable.select({
        filterByFormula: `{Status}="Active"`
      }).firstPage()
    );
    
    console.log(`Found ${records.length} active initiatives`);
    
    // Format initiative data
    return records.map(record => ({
      id: record.id,
      name: record.fields.Name || "Unnamed Initiative",
      description: record.fields.Description || "",
      participationType: record.fields["Participation Type"] || "Individual",
      status: "Active", // We filtered for active only
      source: "initiatives"
    }));
  } catch (error) {
    throw handleAirtableError(error, 'fetching active initiatives');
  }
}

/**
 * Gets active initiatives with caching
 * @param {Object} options Cache options
 * @returns {Promise<Array>} Array of initiative objects
 */
export async function getActiveInitiatives(options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.PROGRAMS, 'active_initiatives');
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchActiveInitiatives(),
    options.ttl || 900 // 15 minutes cache by default
  );
}

/**
 * Search for programs/majors by name
 * @param {string} query Search query
 * @param {Object} options Search options
 * @returns {Promise<Array>} Array of matching program objects
 */
export async function searchProgramsByName(query, options = {}) {
  try {
    if (!query || query.length < 2) {
      return [];
    }
    
    // Format query for searching
    const normalizedQuery = query.toLowerCase().trim();
    console.log(`Searching programs for: "${normalizedQuery}"`);
    
    const programsTable = getProgramsTable();
    
    // Create a formula for case-insensitive search
    // Try both Name and Major fields
    const formula = `OR(
      LOWER({Name}) LIKE "%${normalizedQuery}%",
      LOWER({Major}) LIKE "%${normalizedQuery}%"
    )`;
    
    // Get options
    const limit = options.limit || 10;
    const institutionId = options.institutionId;
    
    // Add institution filter if specified
    let finalFormula = formula;
    if (institutionId) {
      const safeInstitutionId = institutionId.replace(/['"\\]/g, '');
      finalFormula = `AND(
        ${formula},
        FIND("${safeInstitutionId}", {Institution})
      )`;
    }
    
    // Fetch matching programs
    const records = await executeQuery(() => 
      programsTable.select({
        filterByFormula: finalFormula,
        maxRecords: limit,
        sort: [{ field: "Name" }]
      }).firstPage()
    );
    
    console.log(`Found ${records.length} programs matching "${normalizedQuery}"`);
    
    // Format program data
    return records.map(record => ({
      id: record.id,
      name: record.fields.Name || record.fields.Major || "Unnamed Program",
      major: record.fields.Major || record.fields.Name || "",
      institution: record.fields.Institution && record.fields.Institution.length > 0 
        ? record.fields.Institution[0] 
        : null,
      source: "programs"
    }));
  } catch (error) {
    throw handleAirtableError(error, 'searching programs', { query });
  }
}

export default {
  fetchProgramById,
  getProgramById,
  fetchProgramsByInstitution,
  getProgramsByInstitution,
  fetchActiveInitiatives,
  getActiveInitiatives,
  searchProgramsByName
};