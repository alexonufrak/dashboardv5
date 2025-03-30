# Comprehensive Airtable Integration Refactoring Plan

## 1. Current Problems

The current Airtable integration has several structural issues:

1. **Monolithic Design**: The `airtable.js` file is nearly 3,000 lines, making it unmaintainable
2. **Mixed Concerns**: Caching, data fetching, error handling, and business logic are intertwined
3. **Redundant API Calls**: Multiple components fetch the same data independently
4. **Inconsistent Patterns**: Different functions handle caching, error handling, and data transformation differently
5. **Poor Abstraction**: Implementation details like table IDs are exposed throughout the codebase
6. **Inefficient Queries**: The code makes many small queries instead of optimized batch operations
7. **Complex Data Flows**: It's difficult to trace how data moves through the system

## 2. Architecture Goals

Our refactoring will achieve these goals:

1. **Domain-Driven Design**: Organize code around business domains (users, teams, participation)
2. **Clean Separation of Concerns**: Each module has a single responsibility
3. **Client-Side Caching Strategy**: Use React Query as the primary data management layer
4. **Consistent Patterns**: Standardize how we fetch, cache, and transform data
5. **Optimized Data Loading**: Batch related queries and use a normalized data store
6. **Progressive Enhancement**: Improve one component at a time while maintaining compatibility
7. **Developer Experience**: Make the codebase easier to understand and extend

## 3. Folder Structure

```
lib/
  airtable/
    core/
      client.js        # Airtable client configuration
      cache.js         # Caching mechanisms 
      throttle.js      # Rate limiting logic
      errors.js        # Error handling utilities
      index.js         # Re-exports core functionality
    
    tables/
      definitions.js   # Table definitions and environment variables
      schemas.js       # TypeScript/JSDoc schemas for table data (optional)
      index.js         # Re-exports table definitions
    
    entities/
      users.js         # User profile operations
      teams.js         # Team operations
      participation.js # Participation operations
      education.js     # Education operations
      institutions.js  # Institution operations 
      programs.js      # Programs and initiatives operations
      cohorts.js       # Cohort operations
      index.js         # Re-exports all entity operations
      
    utils/
      normalization.js # Data normalization utilities
      transforms.js    # Common data transformation functions
      validation.js    # Input validation functions
      index.js         # Re-exports utilities
      
    hooks/
      useProfile.js    # React Query hooks for user profile
      useTeams.js      # React Query hooks for teams
      useParticipation.js # React Query hooks for participation
      index.js         # Re-exports all hooks
      
    index.js           # Main entry point, re-exports public API
```

## 4. Core Infrastructure

### 4.1 Airtable Client (`core/client.js`)

```javascript
import Airtable from 'airtable';

// Private variables
let airtableClient = null;
let baseId = null;

/**
 * Initialize the Airtable client with credentials
 * @param {Object} config Configuration options
 * @param {string} config.apiKey Airtable API key
 * @param {string} config.baseId Airtable base ID
 */
export function initializeClient(config) {
  if (!config.apiKey) {
    throw new Error('Airtable API key is required');
  }
  
  if (!config.baseId) {
    throw new Error('Airtable base ID is required');
  }
  
  baseId = config.baseId;
  airtableClient = new Airtable({ apiKey: config.apiKey });
  
  return airtableClient;
}

/**
 * Get the Airtable client, initializing if necessary
 * @returns {Object} Airtable client
 */
export function getClient() {
  if (!airtableClient) {
    initializeClient({
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID
    });
  }
  
  return airtableClient;
}

/**
 * Get a base instance for making requests
 * @returns {Object} Airtable base
 */
export function getBase() {
  const client = getClient();
  return client.base(baseId);
}

/**
 * Execute a query function with proper error handling
 * @param {Function} queryFn The function that performs the Airtable query
 * @returns {Promise<*>} The result of the query
 */
export async function executeQuery(queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    // Add request ID and timestamp
    const enhancedError = new Error(`Airtable query failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.requestId = `req_${Date.now().toString(36)}`;
    enhancedError.timestamp = new Date().toISOString();
    
    // Log detailed error information for debugging
    console.error('Airtable query error:', {
      message: error.message,
      requestId: enhancedError.requestId,
      timestamp: enhancedError.timestamp,
      status: error.statusCode,
      stack: error.stack
    });
    
    throw enhancedError;
  }
}
```

### 4.2 Caching System (`core/cache.js`)

```javascript
// In-memory cache for server-side
const memoryCache = new Map();

// Cache types for organization
export const CACHE_TYPES = {
  PROFILE: 'profile',
  TEAMS: 'teams',
  PARTICIPATION: 'participation',
  COHORTS: 'cohorts',
  INSTITUTIONS: 'institutions',
  PROGRAMS: 'programs',
  // Add more types as needed
};

/**
 * Creates a structured, predictable cache key
 * @param {string} type The entity type (from CACHE_TYPES)
 * @param {string} id The entity ID or identifier
 * @param {Object} params Additional parameters
 * @returns {string} A structured cache key
 */
export function createCacheKey(type, id = null, params = null) {
  // Start with the main type
  let key = type;
  
  // Add ID if provided
  if (id) {
    // Normalize IDs by converting to lowercase and removing special chars
    const normalizedId = typeof id === 'string'
      ? id.toLowerCase().replace(/[^a-z0-9]/g, '_')
      : id;
    
    key += `:${normalizedId}`;
  }
  
  // Add params hash if provided
  if (params) {
    // Create a simple hash for the params
    const paramsStr = JSON.stringify(params);
    const hash = Array.from(paramsStr)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)
      .toString(16);
    
    key += `:${hash}`;
  }
  
  return key;
}

/**
 * Get cached data or fetch from source
 * @param {string} cacheKey Unique identifier for this query
 * @param {Function} fetchFn Function to execute if cache miss
 * @param {number} ttl Time to live in seconds
 * @param {number} retryCount Number of retry attempts
 * @returns {Promise<any>} The cached or fetched data
 */
export async function getCachedOrFetch(cacheKey, fetchFn, ttl = 300, retryCount = 0) {
  // Check cache first
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return cached.data;
  }
  
  // Apply throttling
  await throttleRequests();
  
  // Fetch fresh data
  console.log(`Cache miss for key: ${cacheKey}, fetching from source`);
  
  try {
    const data = await fetchFn();
    
    // Store in cache with metadata
    memoryCache.set(cacheKey, {
      data,
      expiry: Date.now() + (ttl * 1000),
      timestamp: new Date().toISOString(),
      key: cacheKey
    });
    
    return data;
  } catch (error) {
    // Handle rate limit errors with exponential backoff
    if (error.statusCode === 429) {
      // Max 5 retries
      if (retryCount >= 5) {
        console.error('Rate limit (429) retry attempts exhausted');
        throw error;
      }
      
      // Calculate exponential backoff with jitter
      const baseDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
      const jitter = Math.random() * 1000; // Add up to 1s of random jitter
      const retryDelay = baseDelay + jitter;
      
      console.warn(`Rate limit hit (429). Retry ${retryCount+1}/5 after ${Math.round(retryDelay/1000)}s delay`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Try again with incremented retry count
      return getCachedOrFetch(cacheKey, fetchFn, ttl, retryCount + 1);
    }
    
    // Return stale data if available rather than failing
    if (cached) {
      console.warn(`Returning stale data for ${cacheKey} due to error: ${error.message}`);
      return cached.data;
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Clear cache entries by type and optional ID
 * @param {string} type Cache type from CACHE_TYPES
 * @param {string} id Optional entity ID
 * @returns {number} Number of entries cleared
 */
export function clearCacheByType(type, id = null) {
  console.log(`Clearing cache entries of type: ${type}${id ? ` for ID: ${id}` : ''}`);
  
  const prefix = id ? `${type}:${id}` : type;
  let clearedCount = 0;
  let clearedKeys = [];
  
  // Get all cache keys first to avoid modification during iteration
  const allKeys = [...memoryCache.keys()];
  
  // Find keys that match our prefix
  for (const key of allKeys) {
    if (key.startsWith(prefix)) {
      clearedKeys.push(key);
      memoryCache.delete(key);
      clearedCount++;
    }
  }
  
  console.log(`Cleared ${clearedCount} cache entries of type: ${type}${id ? ` for ID: ${id}` : ''}`);
  return clearedCount;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let totalEntries = 0;
  let validEntries = 0;
  let expiredEntries = 0;
  let avgTtl = 0;
  let totalSize = 0;
  
  // Count entries by type
  const entriesByType = {};
  
  for (const [key, entry] of memoryCache.entries()) {
    totalEntries++;
    
    // Get the type from the key
    const type = key.split(':')[0];
    entriesByType[type] = (entriesByType[type] || 0) + 1;
    
    // Check if entry is valid
    if (entry.expiry > now) {
      validEntries++;
      avgTtl += (entry.expiry - now) / 1000; // Convert to seconds
    } else {
      expiredEntries++;
    }
    
    // Estimate size (rough approximation)
    totalSize += JSON.stringify(entry.data).length;
  }
  
  // Calculate average TTL
  avgTtl = validEntries > 0 ? avgTtl / validEntries : 0;
  
  return {
    totalEntries,
    validEntries,
    expiredEntries,
    avgTtlSeconds: Math.round(avgTtl),
    sizeBytes: totalSize,
    sizeMb: (totalSize / (1024 * 1024)).toFixed(2),
    entriesByType,
    timestamp: new Date().toISOString()
  };
}

// Export all functions
export default {
  createCacheKey,
  getCachedOrFetch,
  clearCacheByType,
  getCacheStats,
  CACHE_TYPES
};
```

### 4.3 Rate Limiting (`core/throttle.js`)

```javascript
// Track recent request timestamps
let requestTimestamps = [];

// Maximum requests per second (Airtable limit is 5 per second)
const MAX_REQUESTS_PER_SECOND = 4; // Stay under the limit for safety

/**
 * Throttle requests to avoid rate limiting
 * @returns {Promise<void>} Resolves when it's safe to make a request
 */
export async function throttleRequests() {
  // Get current time
  const now = Date.now();
  
  // Clean up old timestamps (older than 1 second)
  requestTimestamps = requestTimestamps.filter(time => now - time < 1000);
  
  // If we haven't hit the limit, allow the request
  if (requestTimestamps.length < MAX_REQUESTS_PER_SECOND) {
    requestTimestamps.push(now);
    return;
  }
  
  // Otherwise, calculate delay needed
  const oldestTimestamp = requestTimestamps[0];
  const delayNeeded = 1000 - (now - oldestTimestamp);
  
  // Log throttling information
  console.log(`Throttling Airtable request for ${delayNeeded}ms to avoid rate limiting`);
  
  // Wait for the delay
  await new Promise(resolve => setTimeout(resolve, delayNeeded));
  
  // Add current time to timestamps and remove oldest
  requestTimestamps.shift();
  requestTimestamps.push(Date.now());
}

export default {
  throttleRequests
};
```

### 4.4 Error Handling (`core/errors.js`)

```javascript
/**
 * Standardized Airtable error with additional context
 */
export class AirtableError extends Error {
  constructor(message, originalError = null, context = {}) {
    super(message);
    this.name = 'AirtableError';
    this.originalError = originalError;
    this.statusCode = originalError?.statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.requestId = `req_${Date.now().toString(36)}`;
  }
  
  /**
   * Format the error for logging
   * @returns {Object} Formatted error object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      requestId: this.requestId,
      originalError: this.originalError ? {
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Handle Airtable errors with proper categorization
 * @param {Error} error The error to handle
 * @param {string} operation Description of the operation that failed
 * @param {Object} context Additional context data
 * @returns {AirtableError} Enhanced error object
 */
export function handleAirtableError(error, operation, context = {}) {
  // Create user-friendly error message based on error type
  let userMessage;
  
  // Check if it's a rate limit error
  if (error.statusCode === 429) {
    userMessage = 'Rate limit exceeded. Please try again in a few moments.';
  } 
  // Check if it's an authentication error
  else if (error.statusCode === 401 || error.statusCode === 403) {
    userMessage = 'Authentication failed. Please contact support.';
  }
  // Check if it's a not found error
  else if (error.statusCode === 404) {
    userMessage = 'The requested data could not be found.';
  }
  // Handle timeout errors
  else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    userMessage = 'The request timed out. Please try again.';
  }
  // Handle network errors
  else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    userMessage = 'Network error. Please check your connection.';
  }
  // Handle invalid JSON responses
  else if (error.message.includes('JSON')) {
    userMessage = 'Invalid response from server. Please try again.';
  }
  // Default error message
  else {
    userMessage = `An error occurred while ${operation}. Please try again or contact support.`;
  }
  
  // Create enhanced error
  return new AirtableError(
    userMessage,
    error,
    {
      operation,
      ...context
    }
  );
}

export default {
  AirtableError,
  handleAirtableError
};
```

## 5. Table Definitions

### 5.1 Table Definitions (`tables/definitions.js`)

```javascript
import { getBase } from '../core/client';

// Table IDs from environment variables
const TABLE_IDS = {
  CONTACTS: process.env.AIRTABLE_CONTACTS_TABLE_ID,
  INSTITUTIONS: process.env.AIRTABLE_INSTITUTIONS_TABLE_ID,
  EDUCATION: process.env.AIRTABLE_EDUCATION_TABLE_ID,
  PROGRAMS: process.env.AIRTABLE_PROGRAMS_TABLE_ID,
  INITIATIVES: process.env.AIRTABLE_INITIATIVES_TABLE_ID,
  COHORTS: process.env.AIRTABLE_COHORTS_TABLE_ID,
  PARTICIPATION: process.env.AIRTABLE_PARTICIPATION_TABLE_ID,
  TEAMS: process.env.AIRTABLE_TEAMS_TABLE_ID,
  PARTNERSHIPS: process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID,
  TOPICS: process.env.AIRTABLE_TOPICS_TABLE_ID,
  CLASSES: process.env.AIRTABLE_CLASSES_TABLE_ID,
  MILESTONES: process.env.AIRTABLE_MILESTONES_TABLE_ID,
  SUBMISSIONS: process.env.AIRTABLE_SUBMISSIONS_TABLE_ID,
};

// Table objects cache
const tables = {};

/**
 * Get a table object with error handling
 * @param {string} tableId The table ID or name from TABLE_IDS
 * @returns {Object} Airtable table object
 */
export function getTable(tableId) {
  // If passed a table name instead of ID, convert to ID
  const actualTableId = TABLE_IDS[tableId] || tableId;
  
  // Check if table ID is valid
  if (!actualTableId) {
    throw new Error(`Invalid table ID: ${tableId}`);
  }
  
  // Return cached table object if available
  if (tables[actualTableId]) {
    return tables[actualTableId];
  }
  
  // Create new table object and cache it
  const base = getBase();
  tables[actualTableId] = base(actualTableId);
  
  return tables[actualTableId];
}

/**
 * Get the contacts table
 * @returns {Object} Contacts table
 */
export function getContactsTable() {
  return getTable('CONTACTS');
}

/**
 * Get the institutions table
 * @returns {Object} Institutions table
 */
export function getInstitutionsTable() {
  return getTable('INSTITUTIONS');
}

/**
 * Get the education table
 * @returns {Object} Education table
 */
export function getEducationTable() {
  return getTable('EDUCATION');
}

/**
 * Get the programs table
 * @returns {Object} Programs table
 */
export function getProgramsTable() {
  return getTable('PROGRAMS');
}

/**
 * Get the initiatives table
 * @returns {Object} Initiatives table
 */
export function getInitiativesTable() {
  return getTable('INITIATIVES');
}

/**
 * Get the cohorts table
 * @returns {Object} Cohorts table
 */
export function getCohortsTable() {
  return getTable('COHORTS');
}

/**
 * Get the participation table
 * @returns {Object} Participation table
 */
export function getParticipationTable() {
  return getTable('PARTICIPATION');
}

/**
 * Get the teams table
 * @returns {Object} Teams table
 */
export function getTeamsTable() {
  return getTable('TEAMS');
}

/**
 * Get the milestones table
 * @returns {Object} Milestones table
 */
export function getMilestonesTable() {
  return getTable('MILESTONES');
}

/**
 * Get the submissions table
 * @returns {Object} Submissions table
 */
export function getSubmissionsTable() {
  return getTable('SUBMISSIONS');
}

// Export table getters
export default {
  getTable,
  getContactsTable,
  getInstitutionsTable,
  getEducationTable,
  getProgramsTable,
  getInitiativesTable,
  getCohortsTable,
  getParticipationTable,
  getTeamsTable,
  getMilestonesTable,
  getSubmissionsTable,
  TABLE_IDS
};
```

## 6. Domain Modules

Each domain module (users, teams, participation) will follow a consistent pattern:

1. **Raw Data Functions**: Pure functions that interact with Airtable but without caching
2. **Cached Wrapper Functions**: Functions that add caching to the raw data functions
3. **Domain-Specific Functions**: Higher-level functions that perform business logic

### 6.1 Users Module (`entities/users.js`)

```javascript
import { getContactsTable } from '../tables/definitions';
import { executeQuery } from '../core/client';
import { createCacheKey, getCachedOrFetch, CACHE_TYPES } from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches a user by email address without caching
 * @param {string} email User email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function fetchUserByEmail(email) {
  try {
    if (!email) {
      return null;
    }
    
    // Normalize the email for lookup
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Looking up user with normalized email: ${normalizedEmail}`);
    
    const contactsTable = getContactsTable();
    
    // Look for contact with matching email using case-insensitive LOWER function
    const records = await executeQuery(() => 
      contactsTable
        .select({
          filterByFormula: `LOWER({Email})="${normalizedEmail}"`,
          maxRecords: 1,
          fields: [
            "Email", "First Name", "Last Name",
            "Onboarding", "Participation", "Education",
            "Headshot", "Degree Type (from Education)", 
            "Major (from Education)", "Institution (from Education)",
            "Graduation Year (from Education)", "Graduation Semester (from Education)",
            "Referral Source"
          ],
        })
        .firstPage()
    );
    
    console.log(`Email lookup result: ${records?.length || 0} records found`);
    
    if (!records || records.length === 0) {
      return null;
    }
    
    // Extract user data from the record
    const user = {
      contactId: records[0].id,
      ...records[0].fields,
      // Add processed properties
      firstName: records[0].fields["First Name"],
      lastName: records[0].fields["Last Name"],
      email: records[0].fields.Email,
      onboardingStatus: records[0].fields.Onboarding || "Registered",
      hasParticipation: Boolean(
        records[0].fields.Participation && 
        records[0].fields.Participation.length > 0
      ),
      // Timestamp for caching purposes
      lastFetched: new Date().toISOString()
    };
    
    return user;
  } catch (error) {
    throw handleAirtableError(error, 'fetching user by email', { email });
  }
}

/**
 * Gets a user by email with caching
 * @param {string} email User email address
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email, options = {}) {
  const cacheKey = createCacheKey(CACHE_TYPES.PROFILE, email);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchUserByEmail(email),
    options.ttl || 300 // 5 minutes cache by default
  );
}

/**
 * Updates a user's onboarding status
 * @param {string} contactId Airtable contact ID
 * @param {string} status New onboarding status
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserOnboarding(contactId, status) {
  try {
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    const contactsTable = getContactsTable();
    
    // Update the contact in Airtable
    const updatedRecord = await executeQuery(() => 
      contactsTable.update(contactId, {
        "Onboarding": status
      })
    );
    
    // Return the updated record
    return {
      contactId: updatedRecord.id,
      ...updatedRecord.fields,
      onboardingStatus: updatedRecord.fields.Onboarding || status,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'updating user onboarding status', { contactId, status });
  }
}

/**
 * Updates a user's profile
 * @param {string} contactId Airtable contact ID
 * @param {Object} data Updated profile data
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserProfile(contactId, data) {
  try {
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    // Extract only fields we allow to update
    const updateData = {
      "First Name": data.firstName,
      "Last Name": data.lastName,
      // Add more fields as needed
    };
    
    const contactsTable = getContactsTable();
    
    // Update the contact in Airtable
    const updatedRecord = await executeQuery(() => 
      contactsTable.update(contactId, updateData)
    );
    
    // Clear cache for this user
    // You'll need to identify all keys that could include this user
    // For example, you might have a key for the user by ID and one by email
    
    // Return the updated record
    return {
      contactId: updatedRecord.id,
      ...updatedRecord.fields,
      // Add processed properties
      firstName: updatedRecord.fields["First Name"],
      lastName: updatedRecord.fields["Last Name"],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'updating user profile', { contactId });
  }
}

export default {
  fetchUserByEmail,
  getUserByEmail,
  updateUserOnboarding,
  updateUserProfile
};
```

### 6.2 Participation Module (`entities/participation.js`)

```javascript
import { getParticipationTable, getCohortsTable, getInitiativesTable, getTeamsTable } from '../tables/definitions';
import { executeQuery } from '../core/client';
import { createCacheKey, getCachedOrFetch, CACHE_TYPES } from '../core/cache';
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
  const cacheKey = createCacheKey(CACHE_TYPES.PARTICIPATION, contactId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchParticipationRecords(contactId),
    options.ttl || 600 // 10 minutes cache by default
  );
}

export default {
  fetchParticipationRecords,
  getParticipationRecords
};
```

## 7. React Query Hooks

The React Query hooks layer is crucial - it's where we manage client-side state and caching:

### 7.1 User Profile Hook (`hooks/useProfile.js`)

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUserByEmail, updateUserProfile } from '../entities/users';

/**
 * Custom hook for user profile data
 * @returns {Object} Query result with user profile data
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('Fetching user profile from API');
      
      // Fetch from API endpoint rather than calling Airtable directly
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      return data.profile || data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
}

/**
 * Custom hook for updating user profile
 * @returns {Object} Mutation result
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedData) => {
      console.log('Updating user profile', updatedData);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['userProfile'], data);
      
      // Show success message
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });
}

/**
 * Hook for checking if a user exists by email
 * @param {string} email Email to check
 * @returns {Object} Query result
 */
export function useCheckUserExists(email) {
  return useQuery({
    queryKey: ['userExists', email],
    queryFn: async () => {
      if (!email || email.length < 3) {
        return { exists: false };
      }
      
      const response = await fetch(`/api/user/check-email?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to check email');
      }
      
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!email && email.length >= 3
  });
}

export default {
  useUserProfile,
  useUpdateUserProfile,
  useCheckUserExists
};
```

### 7.2 Participation Hook (`hooks/useParticipation.js`)

```javascript
import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for user participation data
 * @returns {Object} Query result with participation data
 */
export function useParticipation() {
  return useQuery({
    queryKey: ['participation'],
    queryFn: async () => {
      console.log('Fetching participation data from API');
      
      const response = await fetch('/api/user/participation', {
        cache: 'default' // Use browser's cache for performance
      });
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch participation: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.participation?.length || 0} participation records`);
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('Rate limit')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
    retryDelay: 3000, // 3 second delay between retries
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });
}

/**
 * Custom hook for participation data for a specific program
 * @param {string} programId Program/initiative ID
 * @returns {Object} Query result with filtered participation data
 */
export function useProgramParticipation(programId) {
  const { data, ...rest } = useParticipation();
  
  // Calculate derived data specific to this program
  const filteredData = React.useMemo(() => {
    if (!data || !data.participation || !programId) {
      return {
        participation: [],
        hasParticipation: false
      };
    }
    
    // Filter participation records for this program
    const records = data.participation.filter(p => 
      p.cohort?.initiativeDetails?.id === programId
    );
    
    return {
      participation: records,
      hasParticipation: records.length > 0,
      _meta: data._meta
    };
  }, [data, programId]);
  
  return {
    ...rest,
    data: filteredData
  };
}

export default {
  useParticipation,
  useProgramParticipation
};
```

## 8. API Endpoints

The API endpoints will be streamlined to focus on a single responsibility each:

### 8.1 User Profile Endpoint (`pages/api/user/profile.js`)

```javascript
import { auth0 } from '@/lib/auth0';
import { getCompleteUserProfile } from '@/lib/airtable/entities/users';

/**
 * API endpoint to get a user's profile
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetProfile(req, res, session.user);
      case 'PUT':
        return handleUpdateProfile(req, res, session.user);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

/**
 * Handle GET request for user profile
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user
 */
async function handleGetProfile(req, res, user) {
  try {
    // Get full profile from Airtable
    const profile = await getCompleteUserProfile(user);
    
    // Return the profile data
    return res.status(200).json({
      profile,
      _meta: {
        timestamp: new Date().toISOString(),
        cached: false
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}

/**
 * Handle PUT request to update user profile
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user
 */
async function handleUpdateProfile(req, res, user) {
  try {
    const { 
      firstName, 
      lastName, 
      contactId,
      // Other fields...
    } = req.body;
    
    // Validate required fields
    if (!contactId) {
      return res.status(400).json({ error: "Contact ID is required" });
    }
    
    // Update the profile in Airtable
    const updatedProfile = await updateUserProfile(contactId, {
      firstName,
      lastName,
      // Other fields...
    });
    
    // Return the updated profile
    return res.status(200).json({
      profile: updatedProfile,
      _meta: {
        timestamp: new Date().toISOString(),
        updated: true
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}
```

### 8.2 Participation Endpoint (`pages/api/user/participation.js`)

```javascript
import { auth0 } from '@/lib/auth0';
import { getUserByEmail } from '@/lib/airtable/entities/users';
import { getParticipationRecords } from '@/lib/airtable/entities/participation';
import { getCachedOrFetch } from '@/lib/airtable/core/cache';

/**
 * API endpoint to get a user's program participation
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Create request-specific cache key based on user email
    const userEmail = session.user.email;
    const cacheKey = `participation_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Use getCachedOrFetch for optimal caching with throttling
    const participationData = await getCachedOrFetch(
      cacheKey,
      async () => {
        console.log(`Cache miss: Fetching participation data for ${userEmail}`);
        
        // Get user profile - wrapped in timeout for safety
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("User profile fetch timed out")), 8000)
        );
        
        const profile = await Promise.race([
          getUserByEmail(userEmail),
          timeoutPromise
        ]);
        
        if (!profile || !profile.contactId) {
          console.warn("User profile not found or missing contactId");
          return { 
            participation: [],
            hasData: false,
            recordCount: 0,
            _meta: {
              error: "User profile not found",
              timestamp: new Date().toISOString()
            }
          };
        }
        
        console.log(`Looking up participation for contact ID: "${profile.contactId}"`);
        
        // Fetch participation records with timeout
        const recordsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Participation records fetch timed out")), 8000)
        );
        
        // Use our optimized getParticipationRecords function with timeout
        const participationRecords = await Promise.race([
          getParticipationRecords(profile.contactId),
          recordsTimeoutPromise
        ]);
        
        console.log(`Retrieved ${participationRecords.length} participation records`);
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        console.log(`Successfully processed ${participationRecords.length} participation records in ${processingTime}ms`);
        
        // Return data for caching
        return {
          participation: participationRecords,
          _meta: {
            processingTime,
            timestamp: new Date().toISOString(),
            count: participationRecords.length,
            cached: false
          }
        };
      },
      // Cache for 10 minutes (600 seconds)
      600 
    );
    
    // Set cache headers for client-side caching only
    res.setHeader('Cache-Control', 'private, max-age=180, no-store, must-revalidate');
    
    // Add total processing time
    const totalTime = Date.now() - startTime;
    
    // Return the participation data with enhanced debugging info
    return res.status(200).json({
      ...participationData,
      _meta: {
        ...(participationData._meta || {}),
        totalProcessingTime: totalTime,
        cached: true,
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substring(2, 10)}`,
        userEmail: userEmail,
        recordCount: participationData.participation?.length || 0,
        requestHeaders: {
          referer: req.headers.referer || 'unknown',
          'user-agent': req.headers['user-agent'] || 'unknown'
        }
      }
    });
  } catch (error) {
    console.error("Error fetching participation:", error);
    
    // Handle rate limiting errors gracefully
    if (error.statusCode === 429) {
      res.setHeader('Retry-After', '10');
      return res.status(200).json({ 
        participation: [],
        _meta: {
          error: "Rate limit exceeded. Please try again later.", 
          rateLimited: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to fetch participation", 
      details: error.message,
      participation: []
    });
  }
}
```

## 9. Data Dashboard Integration

To tie everything together, we'll update the Dashboard context to use our new hooks:

### 9.1 Dashboard Context (`contexts/DashboardContext.js`)

```javascript
"use client"

import { createContext, useContext, useState, useMemo, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useQueryClient } from '@tanstack/react-query'

// Import our React Query hooks
import { useUserProfile, useUpdateUserProfile } from '@/lib/airtable/hooks/useProfile'
import { useParticipation } from '@/lib/airtable/hooks/useParticipation'
import { useTeams } from '@/lib/airtable/hooks/useTeams'
import { useMilestones } from '@/lib/airtable/hooks/useMilestones'

// Create context
const DashboardContext = createContext(null)

// Context provider component
export function DashboardProvider({ children }) {
  const { user, isLoading: isUserLoading } = useUser()
  const queryClient = useQueryClient()
  
  // UI state management
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Track active program ID - defined early to avoid initialization error
  const [activeProgramId, setActiveProgramId] = useState(null)
  
  // Store active team for each program - defined early to avoid initialization errors
  const [programTeams, setProgramTeams] = useState({})
  
  // Use React Query hooks for data fetching
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useUserProfile()
  
  const { 
    data: teamsData, 
    isLoading: isTeamsLoading, 
    error: teamsError 
  } = useTeams()
  
  const {
    data: participationData,
    isLoading: isProgramLoading,
    error: programError
  } = useParticipation()
  
  // Extract teams from the teams data
  const teams = teamsData?.teams || []
  
  // Process teams data
  const teamData = useMemo(() => {
    return teams && teams.length > 0 ? teams[0] : null
  }, [teams])
  
  // Process program data - significantly simplified with our new normalized data structure
  const programDataProcessed = useMemo(() => {
    const records = participationData?.participation || []
    
    if (records.length === 0) {
      return {
        cohort: null,
        initiativeName: "Program",
        participationType: null
      }
    }
    
    // Find the most relevant participation record
    const currentParticipations = records.filter(p => p.cohort?.isCurrent)
    const activeParticipation = currentParticipations.length > 0 
      ? currentParticipations[0] 
      : records[0]
    
    if (!activeParticipation?.cohort) {
      return {
        cohort: null,
        initiativeName: "Program",
        participationType: null
      }
    }
    
    return {
      cohort: activeParticipation.cohort,
      initiativeName: activeParticipation.initiative?.name || "Program",
      participationType: activeParticipation.initiative?.["Participation Type"] || "Individual"
    }
  }, [participationData])
  
  // Get cohort ID for milestone fetching
  const cohortId = programDataProcessed.cohort?.id
  
  // Fetch milestones using cohort ID
  const { 
    data: milestonesData,
    isLoading: isMilestonesLoading 
  } = useMilestones(cohortId)
  
  // Extract milestones from the data
  const milestones = milestonesData?.milestones || []
  
  // Combine loading states
  const isLoading = isUserLoading || isProfileLoading
  const isTeamLoading = isTeamsLoading
  const programLoading = isProgramLoading || isMilestonesLoading
  
  // Combine error states
  const error = profileError || teamsError || programError
  
  // Functions and computed properties (shortened for brevity)
  // ... (other functions from original context, refactored to use new data structure)
  
  // Create context value
  const value = {
    // User & profile data
    user,
    profile,
    isLoading,
    error,
    
    // Team data
    teamData,
    teamsData: teams,
    isTeamLoading,
    
    // Program data
    cohort: programDataProcessed.cohort,
    milestones,
    initiativeName: programDataProcessed.initiativeName,
    participationType: programDataProcessed.participationType,
    programLoading,
    programError,
    
    // Raw API data
    participationData,
    
    // UI state
    isEditModalOpen,
    setIsEditModalOpen,
    isUpdating,
    
    // Actions
    refreshData: (dataType) => {
      // Implementation shortened for brevity
      // This would invalidate the appropriate React Query cache keys
    },
    
    // Helper methods
    // ... (shortened for brevity)
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === null) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
```

## 10. Migration Strategy

To implement this refactoring safely, we'll follow this step-by-step approach:

1. **Create New Structure**: Set up the new folder structure without removing existing code
2. **Implement Core Layer**: Add the core utilities first (client, cache, throttle, errors)
3. **Implement Table Definitions**: Create the tables module
4. **Implement Entity Modules**: Start with users, then participation, then others
5. **Create React Query Hooks**: Implement the hooks layer
6. **Update API Endpoints**: Refactor one endpoint at a time
7. **Update Components**: Update components to use the new hooks
8. **Test Thoroughly**: Verify at each step
9. **Remove Legacy Code**: Only after everything is working

Timeline:

1. **Week 1**: Core infrastructure and table definitions
2. **Week 2-3**: Entity modules and React Query hooks
3. **Week 4**: API endpoints and component updates
4. **Week 5**: Testing and legacy code removal

## 11. Benefits of New Architecture

This refactoring will deliver significant benefits:

1. **Modularity**: Clear separation of concerns makes the code easier to understand and maintain
2. **Performance**: Optimized caching and data loading improves dashboard responsiveness
3. **Reliability**: Consistent error handling and fallbacks improve user experience
4. **Maintainability**: Smaller, focused modules are easier to update and debug
5. **Scalability**: New features can be added without adding complexity
6. **Testing**: Isolated modules are easier to test
7. **Documentation**: Clean structure is self-documenting
8. **Onboarding**: New developers can understand the system more quickly

## 12. Future Enhancements

Once the basic refactoring is complete, we can consider these enhancements:

1. **Typed Data Layer**: Add TypeScript or JSDoc type definitions
2. **Query Batching**: Implement batched queries to reduce API calls
3. **Optimistic Updates**: Add optimistic UI updates for a smoother user experience
4. **Offline Support**: Add support for offline data access
5. **Real-time Updates**: Implement webhooks or polling for real-time data
6. **Performance Monitoring**: Add telemetry to track API performance
7. **Enhanced Logging**: Implement structured logging for better debugging
8. **API Versioning**: Add versioning to the API for backward compatibility

## 13. Conclusion

This comprehensive refactoring plan addresses the core issues with the current Airtable integration. By implementing a clean, domain-driven architecture with proper separation of concerns, we'll create a more maintainable, performant, and reliable system.

The client-side caching strategy using React Query will dramatically reduce unnecessary API calls while keeping the UI responsive. The modular structure will make it easier to understand, maintain, and extend the codebase.

Most importantly, this refactoring can be implemented incrementally, with each step providing immediate benefits without disrupting the existing functionality.