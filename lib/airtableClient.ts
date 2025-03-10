/**
 * Airtable API client for accessing data
 * Manages connections to Airtable and provides utility functions
 */
import Airtable from 'airtable';

// Initialize Airtable with API key
let base: any = null;

export function initAirtable() {
  if (base) return base;
  
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error('AIRTABLE_API_KEY environment variable is required');
  }
  
  if (!process.env.AIRTABLE_BASE_ID) {
    throw new Error('AIRTABLE_BASE_ID environment variable is required');
  }
  
  // Initialize Airtable base
  base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  
  return base;
}

// Table IDs
export const TABLES = {
  TEAMS: process.env.AIRTABLE_TEAMS_TABLE_ID,
  MEMBERS: process.env.AIRTABLE_MEMBERS_TABLE_ID,
  CONTACTS: process.env.AIRTABLE_CONTACTS_TABLE_ID,
  SUBMISSIONS: process.env.AIRTABLE_SUBMISSIONS_TABLE_ID,
  MILESTONES: process.env.AIRTABLE_MILESTONES_TABLE_ID,
  COHORTS: process.env.AIRTABLE_COHORTS_TABLE_ID,
  PROGRAMS: process.env.AIRTABLE_PROGRAMS_TABLE_ID,
  MAJORS: process.env.AIRTABLE_MAJORS_TABLE_ID,
  APPLICATIONS: process.env.AIRTABLE_APPLICATIONS_TABLE_ID,
  EDUCATION: process.env.AIRTABLE_EDUCATION_TABLE_ID,
  INSTITUTIONS: process.env.AIRTABLE_INSTITUTIONS_TABLE_ID,
  PARTICIPATION: process.env.AIRTABLE_PARTICIPATION_TABLE_ID,
  ACHIEVEMENTS: process.env.AIRTABLE_ACHIEVEMENTS_TABLE_ID,
  TRANSACTIONS: process.env.AIRTABLE_TRANSACTIONS_TABLE_ID,
};

// Get a reference to a specific table
export function getTable(tableName: keyof typeof TABLES) {
  const tableId = TABLES[tableName];
  
  if (!tableId) {
    throw new Error(`No table ID configured for ${tableName}`);
  }
  
  const airtableBase = initAirtable();
  return airtableBase(tableId);
}

/**
 * Find a record by ID
 * @param tableName - The table to query
 * @param recordId - The record ID to find
 * @returns The record data
 */
export async function findRecordById(tableName: keyof typeof TABLES, recordId: string) {
  try {
    const table = getTable(tableName);
    const record = await table.find(recordId);
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error fetching ${tableName} record ${recordId}:`, error);
    throw error;
  }
}

/**
 * Query records with a filter formula
 * @param tableName - The table to query
 * @param filterFormula - Airtable formula to filter records
 * @param options - Additional options like fields to select
 * @returns Array of matching records
 */
export async function queryRecords(
  tableName: keyof typeof TABLES, 
  filterFormula?: string,
  options: {
    maxRecords?: number;
    sort?: Array<{field: string; direction: 'asc' | 'desc'}>;
    fields?: string[];
  } = {}
) {
  try {
    const table = getTable(tableName);
    
    const query: any = {};
    if (filterFormula) query.filterByFormula = filterFormula;
    if (options.maxRecords) query.maxRecords = options.maxRecords;
    if (options.sort) query.sort = options.sort;
    if (options.fields) query.fields = options.fields;
    
    const records = await table.select(query).all();
    
    return records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create a new record
 * @param tableName - The table to add to
 * @param fields - Record fields to create
 * @returns The created record
 */
export async function createRecord(tableName: keyof typeof TABLES, fields: any) {
  try {
    const table = getTable(tableName);
    const record = await table.create(fields);
    
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error creating ${tableName} record:`, error);
    throw error;
  }
}

/**
 * Update an existing record
 * @param tableName - The table to update
 * @param recordId - The record ID to update
 * @param fields - Fields to update
 * @returns The updated record
 */
export async function updateRecord(tableName: keyof typeof TABLES, recordId: string, fields: any) {
  try {
    const table = getTable(tableName);
    const record = await table.update(recordId, fields);
    
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error(`Error updating ${tableName} record ${recordId}:`, error);
    throw error;
  }
}

/**
 * Delete a record
 * @param tableName - The table to delete from
 * @param recordId - The record ID to delete
 * @returns Success indicator
 */
export async function deleteRecord(tableName: keyof typeof TABLES, recordId: string) {
  try {
    const table = getTable(tableName);
    await table.destroy(recordId);
    
    return { success: true, id: recordId };
  } catch (error) {
    console.error(`Error deleting ${tableName} record ${recordId}:`, error);
    throw error;
  }
}

/**
 * Format attachments for Airtable
 * @param attachments - Array of attachment objects with URLs
 * @returns Formatted attachment array for Airtable
 */
export function formatAttachments(attachments: Array<{ url: string; filename?: string; }>) {
  return attachments.map(attachment => ({
    url: attachment.url,
    filename: attachment.filename || attachment.url.split('/').pop() || 'file'
  }));
}

/**
 * Look up an institution by email domain
 * @param email - Email address to extract domain from and find institution
 * @returns Institution data if found, null otherwise
 */
export async function lookupInstitutionByEmail(email: string) {
  try {
    if (!email || !TABLES.INSTITUTIONS) {
      return null;
    }
    
    // Extract domain from email
    const domainMatch = email.match(/@(.+)$/);
    if (!domainMatch || !domainMatch[1]) {
      return null;
    }
    
    const domain = domainMatch[1];
    console.log(`Looking up institution for domain: "${domain}"`);
    
    // Get institutions table
    const institutionsTable = getTable('INSTITUTIONS');
    
    // Pre-filter with FIND to get candidates
    const recordsQuery = await institutionsTable.select({
      fields: ['Name', 'Domains'],
      filterByFormula: `OR(FIND("${domain},", {Domains}), FIND("${domain}", {Domains}))`
    }).firstPage();
    
    // If no results, try to get all records as fallback
    const records = recordsQuery.length > 0 ? recordsQuery : 
      await institutionsTable.select({
        fields: ['Name', 'Domains'],
      }).firstPage();
    
    // Filter records manually to match exact domains
    const matchingRecords = records.filter((record: any) => {
      if (!record.fields.Domains) return false;
      
      // Split domains by comma and trim whitespace
      const domainList = record.fields.Domains.split(',').map((d: string) => d.trim());
      
      // Check if domain matches exactly
      return domainList.includes(domain);
    });
    
    if (matchingRecords && matchingRecords.length > 0) {
      // Return the first matching institution
      return {
        id: matchingRecords[0].id,
        name: matchingRecords[0].fields.Name,
        domains: matchingRecords[0].fields.Domains
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error looking up institution by email:", error);
    return null;
  }
}

/**
 * Get user by email from Airtable
 * @param email - Email address to look up
 * @returns User data if found, null otherwise
 */
export async function getUserByEmail(email: string) {
  try {
    if (!email || !TABLES.CONTACTS) {
      return null;
    }
    
    // Normalize the email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Query the contacts table for the user with this email
    const contactsTable = getTable('CONTACTS');
    const records = await contactsTable.select({
      maxRecords: 1,
      filterByFormula: `LOWER({Email}) = "${normalizedEmail}"`
    }).firstPage();
    
    if (records.length === 0) {
      return null;
    }
    
    // Return the user data with ID
    return {
      contactId: records[0].id,
      ...records[0].fields
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}