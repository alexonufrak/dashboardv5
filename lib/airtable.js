import Airtable from "airtable"

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

// In-memory cache for server-side
const memoryCache = new Map()

// Cache key registry for easier management and invalidation
export const CACHE_TYPES = {
  SUBMISSIONS: 'submissions',
  TEAMS: 'teams',
  MILESTONES: 'milestones',
  USER: 'user',
  GENERAL: 'general'
}

// Rate limiting utilities
let requestTimestamps = []
const MAX_REQUESTS_PER_SECOND = 5

/**
 * Throttles API requests to stay under Airtable rate limits
 * @returns {Promise<void>}
 */
export const throttleRequests = async () => {
  const now = Date.now()
  
  // Remove timestamps older than 1 second
  requestTimestamps = requestTimestamps.filter(time => now - time <= 1000)
  
  // If at rate limit, wait until we can make another request
  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestRequest = requestTimestamps[0]
    const waitTime = 1000 - (now - oldestRequest) + 50 // Add buffer
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return throttleRequests() // Check again after waiting
  }
  
  // Track this request
  requestTimestamps.push(now)
}

/**
 * Get cached data or fetch from Airtable with throttling and 429 error handling
 * @param {string} cacheKey - Unique identifier for this query
 * @param {Function} fetchFn - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @param {number} retryCount - Number of retry attempts for this request
 * @returns {Promise<any>} The cached or fetched data
 */
export const getCachedOrFetch = async (cacheKey, fetchFn, ttl = 300, retryCount = 0) => {
  // Check cache first
  const cached = memoryCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) {
    console.log(`Cache hit for key: ${cacheKey}`)
    return cached.data
  }
  
  // Apply throttling
  await throttleRequests()
  
  // Fetch fresh data
  console.log(`Cache miss for key: ${cacheKey}, fetching from Airtable`)
  
  try {
    const data = await fetchFn()
    
    // Store in cache
    memoryCache.set(cacheKey, {
      data,
      expiry: Date.now() + (ttl * 1000)
    })
    
    return data
  } catch (error) {
    // Handle rate limit errors with exponential backoff
    if (error.statusCode === 429) {
      // Max 5 retries
      if (retryCount >= 5) {
        console.error('Airtable rate limit (429) retry attempts exhausted')
        throw error
      }
      
      // Calculate exponential backoff with jitter
      const baseDelay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s, 8s, 16s
      const jitter = Math.random() * 1000 // Add up to 1s of random jitter
      const retryDelay = baseDelay + jitter
      
      console.warn(`Airtable rate limit hit (429). Retry ${retryCount+1}/5 after ${Math.round(retryDelay/1000)}s delay`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      
      // Clear recent request timestamps to reset our rate limiting
      requestTimestamps = []
      
      // Try again with incremented retry count
      return getCachedOrFetch(cacheKey, fetchFn, ttl, retryCount + 1)
    }
    
    // Return stale data if available rather than failing
    if (cached) {
      console.warn(`Returning stale data for ${cacheKey} due to error: ${error.message}`)
      return cached.data
    }
    
    // Re-throw other errors
    throw error
  }
}

/**
 * Creates a structured, predictable cache key using the provided parts
 * @param {string} type - The main entity type (from CACHE_TYPES)
 * @param {string} id - The entity ID
 * @param {Object} params - Additional parameters for the key
 * @returns {string} A structured cache key
 */
export const createCacheKey = (type, id = null, params = null) => {
  // Start with the main type
  let key = type;
  
  // Add ID if provided
  if (id) {
    key += `:${id}`;
  }
  
  // Add params hash if provided
  if (params) {
    // Create a simple hash for the params
    const paramsStr = JSON.stringify(params);
    // Use a simple hash function for the params
    const hash = Array.from(paramsStr)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)
      .toString(16);
    
    key += `:${hash}`;
  }
  
  return key;
}

/**
 * Clears cache entries by type and optional ID
 * @param {string} type - Cache type from CACHE_TYPES
 * @param {string} id - Optional entity ID
 * @returns {number} Number of entries cleared
 */
export const clearCacheByType = (type, id = null) => {
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
  
  // Log detailed information about what was cleared
  console.log(`Cleared ${clearedCount} cache entries of type: ${type}${id ? ` for ID: ${id}` : ''}`);
  if (clearedCount > 0 && clearedCount <= 5) {
    console.log(`Cleared keys: ${clearedKeys.join(', ')}`);
  }
  
  return clearedCount;
}

/**
 * Legacy function for backward compatibility
 * @param {string} keyPattern - Pattern to match in cache keys
 * @param {Object} details - Additional details for matching
 * @returns {number} Number of entries cleared
 */
export const clearCacheByPattern = (keyPattern, details = null) => {
  console.log(`[DEPRECATED] Using pattern-based cache clearing: ${keyPattern}`);
  let clearedCount = 0;
  let clearedKeys = [];
  
  // Get all cache keys first to avoid modification during iteration
  const allKeys = [...memoryCache.keys()];
  
  // If we have specific details for more targeted clearing
  if (details && details.teamId) {
    console.log(`Looking for submissions for team: ${details.teamId}`);
    
    // Look for cache entries that match both the pattern and team ID
    for (const key of allKeys) {
      if (key.includes(keyPattern) && key.includes(details.teamId)) {
        clearedKeys.push(key);
        memoryCache.delete(key);
        clearedCount++;
      }
    }
  } else {
    // Generic pattern clearing
    for (const key of allKeys) {
      if (key.includes(keyPattern)) {
        clearedKeys.push(key);
        memoryCache.delete(key);
        clearedCount++;
      }
    }
  }
  
  // Log detailed information about what was cleared for debugging
  console.log(`Cleared ${clearedCount} cache entries matching pattern: ${keyPattern}`);
  if (clearedCount > 0 && clearedCount <= 5) {
    console.log(`Cleared keys: ${clearedKeys.join(', ')}`);
  }
  
  return clearedCount;
}

/**
 * Batch fetch records from Airtable with integrated caching
 * @param {string} tableId - Airtable table ID
 * @param {Object} options - Query options
 * @param {string} cacheTypeOverride - Override the default cache type determination
 * @param {string} entityIdOverride - Override the default entity ID extraction
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Array>} Array of records
 */
export const batchFetchRecords = async (tableId, options, cacheTypeOverride = null, entityIdOverride = null, forceRefresh = false) => {
  // Determine the cache type based on table ID or override
  let cacheType = cacheTypeOverride || CACHE_TYPES.GENERAL;
  
  // Use the override first, but if not provided, try to determine from table ID
  if (!cacheTypeOverride) {
    if (tableId === process.env.AIRTABLE_SUBMISSIONS_TABLE_ID) {
      cacheType = CACHE_TYPES.SUBMISSIONS;
    } else if (tableId === process.env.AIRTABLE_TEAMS_TABLE_ID) {
      cacheType = CACHE_TYPES.TEAMS;
    } else if (tableId === process.env.AIRTABLE_MILESTONES_TABLE_ID) {
      cacheType = CACHE_TYPES.MILESTONES;
    }
  }
  
  // Extract entity ID for specific queries if applicable
  let entityId = entityIdOverride || null;
  
  // If no override was provided, try to extract ID from the query
  if (!entityId) {
    // For submissions, try to extract team ID
    if (cacheType === CACHE_TYPES.SUBMISSIONS && options.filterByFormula) {
      const teamMatch = options.filterByFormula.match(/FIND\("([^"]+)".*teamId/);
      if (teamMatch && teamMatch[1]) {
        entityId = teamMatch[1];
      }
    }
  }
  
  // Generate a structured, predictable cache key
  const newCacheKey = createCacheKey(cacheType, entityId, options);
  
  // For backward compatibility, also generate the old-style key
  const legacyCacheKey = `batch_${tableId}_${JSON.stringify(options)}`;
  
  // Use the new key for the cache
  const cacheKey = newCacheKey;
  
  // Log the mapping for debugging
  console.log(`Cache key mapping: 
    - New format: ${newCacheKey}
    - Legacy format: ${legacyCacheKey}`);
  
  // If forceRefresh is true, clear any existing cached data
  if (forceRefresh && memoryCache.has(cacheKey)) {
    console.log(`Force refreshing data for key: ${cacheKey}`);
    memoryCache.delete(cacheKey);
  }
  
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const table = base(tableId)
      const records = await table.select(options).all()
      return records
    }
  )
}

// Export the base and utility functions
export { base }

// Tables
// Add null checks to prevent errors if environment variables are missing
const contactsTable = process.env.AIRTABLE_CONTACTS_TABLE_ID 
  ? base(process.env.AIRTABLE_CONTACTS_TABLE_ID) 
  : null;

const institutionsTable = process.env.AIRTABLE_INSTITUTIONS_TABLE_ID 
  ? base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) 
  : null;

const educationTable = process.env.AIRTABLE_EDUCATION_TABLE_ID 
  ? base(process.env.AIRTABLE_EDUCATION_TABLE_ID) 
  : null;

const programsTable = process.env.AIRTABLE_PROGRAMS_TABLE_ID 
  ? base(process.env.AIRTABLE_PROGRAMS_TABLE_ID) 
  : null;

const initiativesTable = process.env.AIRTABLE_INITIATIVES_TABLE_ID 
  ? base(process.env.AIRTABLE_INITIATIVES_TABLE_ID) 
  : null;

const cohortsTable = process.env.AIRTABLE_COHORTS_TABLE_ID 
  ? base(process.env.AIRTABLE_COHORTS_TABLE_ID) 
  : null;

const participationTable = process.env.AIRTABLE_PARTICIPATION_TABLE_ID
  ? base(process.env.AIRTABLE_PARTICIPATION_TABLE_ID)
  : null;

const partnershipsTable = process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID 
  ? base(process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID) 
  : null;

const topicsTable = process.env.AIRTABLE_TOPICS_TABLE_ID 
  ? base(process.env.AIRTABLE_TOPICS_TABLE_ID) 
  : null;

const classesTable = process.env.AIRTABLE_CLASSES_TABLE_ID 
  ? base(process.env.AIRTABLE_CLASSES_TABLE_ID) 
  : null;

const invitesTable = process.env.AIRTABLE_INVITES_TABLE_ID
  ? base(process.env.AIRTABLE_INVITES_TABLE_ID)
  : null;
  
// Get the Teams table ID from environment variables for use in functions
const teamsTable = process.env.AIRTABLE_TEAMS_TABLE_ID
  ? base(process.env.AIRTABLE_TEAMS_TABLE_ID)
  : null;

// Get the Members table ID from environment variables for use in functions
const membersTable = process.env.AIRTABLE_MEMBERS_TABLE_ID
  ? base(process.env.AIRTABLE_MEMBERS_TABLE_ID)
  : null;

/**
 * Get user profile from Airtable by email with enhanced data processing
 * @param {string} userId - Auth0 user ID (not used for lookup but kept for compatibility)
 * @param {string} email - User's email address
 * @returns {Promise<Object>} User profile data with enhanced processing
 */
export async function getUserProfile(userId, email) {
  try {
    // Normalize the email for lookup
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Looking up user profile with normalized email: ${normalizedEmail}`);
    
    // Look for contact with matching email using case-insensitive LOWER function
    // This ensures we catch emails that may differ only in case
    const records = await contactsTable
      .select({
        filterByFormula: `LOWER({Email})="${normalizedEmail}"`,
        maxRecords: 1,
        // Specify fields to reduce payload size as recommended
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
      
    console.log(`Airtable lookup result: ${records?.length || 0} records found`);
    
    // Define hasParticipation outside the conditional blocks to make it accessible throughout the function
    let hasParticipation = false;
    
    if (records?.length > 0) {
      console.log(`Found Airtable record with ID: ${records[0].id}`);
      
      // Process onboarding status here as recommended
      const onboardingStatus = records[0].fields.Onboarding || 'Not set';
      console.log(`Contact Onboarding status: ${onboardingStatus}`);
      
      // Check if user has any participation records
      hasParticipation = Boolean(records[0].fields.Participation && 
                             records[0].fields.Participation.length > 0);
      
      // Automatically set onboarding to "Applied" if participation exists
      if (hasParticipation && onboardingStatus !== "Applied") {
        console.log("User has participation records - setting Onboarding to 'Applied'");
        
        try {
          await contactsTable.update(records[0].id, {
            "Onboarding": "Applied"
          });
          console.log(`Updated contact ${records[0].id} Onboarding to Applied based on participation`);
          
          // Update the field in the returned data
          records[0].fields.Onboarding = "Applied";
        } catch (updateError) {
          console.error("Error updating Onboarding based on participation:", updateError);
        }
      }
      // If Onboarding field is not set and no participation, default to "Registered"
      else if (!records[0].fields.Onboarding) {
        console.log("Setting default Onboarding status to 'Registered'");
        
        // Update the contact with default "Registered" status
        try {
          await contactsTable.update(records[0].id, {
            "Onboarding": "Registered"
          });
          console.log(`Updated contact ${records[0].id} with default Onboarding status: Registered`);
          
          // Add the Onboarding field to the returned data
          records[0].fields.Onboarding = "Registered";
        } catch (updateError) {
          console.error("Error setting default Onboarding status:", updateError);
          // Continue without updating
        }
      }
    }

    if (records && records.length > 0) {
      // Return enhanced profile data with processed properties
      return {
        contactId: records[0].id,
        ...records[0].fields,
        // Add processed properties as recommended
        hasActiveParticipation: hasParticipation,
        onboardingStatus: records[0].fields.Onboarding || "Registered",
        isOnboardingComplete: records[0].fields.Onboarding === "Applied" || hasParticipation,
        // Timestamp for caching purposes
        lastFetched: new Date().toISOString()
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw new Error("Failed to fetch user profile")
  }
}

/**
 * Get participation records for a contact
 * @param {string} contactId - Airtable contact ID
 * @returns {Promise<Array>} Array of participation records with cohort and initiative details
 */
export async function getParticipationRecords(contactId) {
  try {
    if (!contactId || !participationTable || !cohortsTable || !initiativesTable) {
      console.error("Required parameters or tables missing for participation lookup");
      return [];
    }
    
    console.log(`Fetching participation records for contact ID: ${contactId}`);
    
    // Sanitize the contact ID to prevent formula injection
    const safeContactId = contactId.replace(/['"\\]/g, '');
    
    // Log and attempt to get the contact record directly first to debug
    console.log(`Getting contact record ${safeContactId} to find member links`);
    
    try {
      const contactRecord = await contactsTable.find(safeContactId);
      // Check if the contact has any participation records linked directly
      if (contactRecord && contactRecord.fields && contactRecord.fields.Participation) {
        console.log(`Found ${contactRecord.fields.Participation.length} participation links in contact`);
      } else {
        console.log("No participation field found in contact record");
      }
    } catch (contactError) {
      console.error("Error fetching contact record:", contactError);
    }
    
    // Try multiple approaches to find participation records
    
    // Approach 1: Use FIND in formula to check for contact ID in the Contacts field
    const formula1 = `OR(
      FIND("${safeContactId}", {Contacts}),
      FIND("${safeContactId}", {contactId}),
      FIND("${safeContactId}", Contacts)
    )`;
    
    // Approach 2: Use direct lookup with recordId in array
    const formula2 = `Contact = "${safeContactId}"`;
    
    // Try both formulas if available
    let participationRecords = [];
    
    try {
      // Try formula 1 first
      console.log(`Using participation lookup formula 1: ${formula1}`);
      const records1 = await participationTable.select({
        filterByFormula: formula1
      }).firstPage();
      
      if (records1 && records1.length > 0) {
        participationRecords = records1;
        console.log(`Found ${records1.length} participation records with formula 1`);
      } else {
        // If formula 1 didn't work, try formula 2
        console.log(`Using participation lookup formula 2: ${formula2}`);
        const records2 = await participationTable.select({
          filterByFormula: formula2
        }).firstPage();
        
        if (records2 && records2.length > 0) {
          participationRecords = records2;
          console.log(`Found ${records2.length} participation records with formula 2`);
        }
      }
    } catch (error) {
      console.error("Error in participation formulas:", error);
    }
    
    // If we didn't find any records with formulas, try direct ID lookup
    if (participationRecords.length === 0) {
      try {
        // Get all participation records from contact
        const contactRecord = await contactsTable.find(safeContactId);
        if (contactRecord && 
            contactRecord.fields && 
            contactRecord.fields.Participation &&
            contactRecord.fields.Participation.length > 0) {
            
          console.log(`Getting ${contactRecord.fields.Participation.length} participation records by ID`);
          
          // Fetch each participation record directly by ID
          const directRecords = await Promise.all(
            contactRecord.fields.Participation.map(async (partId) => {
              try {
                return await participationTable.find(partId);
              } catch (findError) {
                console.error(`Error finding participation record ${partId}:`, findError);
                return null;
              }
            })
          );
          
          // Filter out any nulls from failed lookups
          participationRecords = directRecords.filter(Boolean);
          console.log(`Found ${participationRecords.length} participation records by direct ID lookup`);
        } else {
          console.log("No Participation field in contact or it's empty");
        }
      } catch (directError) {
        console.error("Error in direct participation lookup:", directError);
      }
    }
    
    console.log(`Found ${participationRecords.length} participation records for contact ${contactId}`);
    
    if (participationRecords.length === 0) {
      return [];
    }
    
    // Process each participation record to include related data
    const enhancedRecords = [];
    
    // Prepare parallel promises for faster processing
    const processRecordPromises = participationRecords.map(async (record) => {
      try {
        // Extract key fields from the participation record
        const cohortIds = record.fields.Cohorts || 
                         (record.fields.Cohort ? [record.fields.Cohort] : []);
        
        if (cohortIds.length === 0) {
          console.log(`Skipping participation record ${record.id} - no cohorts found`);
          return null; // Return null for records to be filtered out later
        }
        
        // Process all cohorts for this participation in parallel
        const cohortPromises = cohortIds.map(async (cohortId) => {
          try {
            // Get cohort details
            const cohort = await cohortsTable.find(cohortId);
            
            // Get initiative details if available
            const initiativeIds = cohort.fields.Initiative || [];
            let initiativeDetails = null;
            
            if (initiativeIds.length > 0) {
              try {
                const initiative = await initiativesTable.find(initiativeIds[0]);
                
                // Process participation type with standardized format
                let participationType = "Individual";
                if (initiative.fields["Participation Type"]) {
                  const rawType = String(initiative.fields["Participation Type"]);
                  // Normalize to consistent format
                  participationType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
                  
                  // If it contains "team" anywhere, treat it as team participation
                  if (participationType.toLowerCase().includes("team")) {
                    participationType = "Team";
                  }
                }
                
                initiativeDetails = {
                  id: initiative.id,
                  name: initiative.fields.Name || "Untitled Initiative",
                  description: initiative.fields.Description || "",
                  "Participation Type": participationType,
                  isTeamBased: participationType === "Team"
                };
              } catch (initiativeError) {
                console.error(`Error fetching initiative ${initiativeIds[0]}:`, initiativeError);
              }
            }
            
            // Get team information if applicable
            let teamData = null;
            const teamIds = record.fields.Team || [];
            
            if (teamIds.length > 0 && teamsTable) {
              try {
                const team = await teamsTable.find(teamIds[0]);
                teamData = {
                  id: team.id,
                  name: team.fields.Name || team.fields["Team Name"] || "Unnamed Team",
                  description: team.fields.Description || ""
                };
              } catch (teamError) {
                console.error(`Error fetching team ${teamIds[0]}:`, teamError);
              }
            }
            
            // Determine cohort status
            const startDate = cohort.fields["Start Date"] || null;
            const endDate = cohort.fields["End Date"] || null;
            
            // Determine if cohort is current based on dates and status fields
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
            
            // Check field-based currency (override if explicitly marked as current)
            if (cohort.fields["Current Cohort"] === true || 
                cohort.fields["Is Current"] === true) {
              isCurrent = true;
            }
            
            // Return an enhanced record with all needed information
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
              isTeamParticipation: initiativeDetails?.isTeamBased || false,
              // Original record fields for reference
              recordFields: record.fields
            };
          } catch (cohortError) {
            console.error(`Error processing cohort ${cohortId}:`, cohortError);
            return null; // Return null for error cases
          }
        });
        
        // Wait for all cohort promises to resolve and filter out nulls
        const cohortResults = await Promise.all(cohortPromises);
        return cohortResults.filter(Boolean); // Filter out nulls
        
      } catch (recordError) {
        console.error(`Error processing participation record ${record.id}:`, recordError);
        return null;
      }
    });
    
    // Wait for all record promises to resolve
    const results = await Promise.all(processRecordPromises);
    
    // Flatten the results (each record could have multiple cohorts) and filter out nulls
    const flattenedRecords = results
      .filter(Boolean) // Remove null entries
      .flat(); // Flatten the array of arrays
    
    // Filter records to only include Active status or records without a status
    const activeRecords = flattenedRecords.filter(record => 
      !record.status || record.status === "Active" || record.status === "active"
    );
    
    console.log(`Found ${flattenedRecords.length} total participation records, ${activeRecords.length} with Active status`);
    return activeRecords;
  } catch (error) {
    console.error("Error fetching participation records:", error);
    return [];
  }
}

/**
 * Get institution details by ID
 * @param {string} institutionId - Airtable institution ID
 * @returns {Promise<Object>} Institution data
 */
export async function getInstitution(institutionId) {
  try {
    const institution = await institutionsTable.find(institutionId)
    
    if (institution) {
      return {
        id: institution.id,
        ...institution.fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching institution:", error)
    throw new Error("Failed to fetch institution details")
  }
}

/**
 * Update user profile in Airtable
 * @param {string} contactId - Airtable contact ID
 * @param {Object} data - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(contactId, data) {
  try {
    console.log("Updating user profile with data:", {
      "FirstName": data.FirstName,
      "LastName": data.LastName,
      "DegreeType": data.DegreeType,
      "Major": data.Major,
      "GraduationYear": data.GraduationYear,
      "educationId": data.educationId,
      "Onboarding": data.Onboarding
    });
    
    // Validate the Degree Type to ensure it's one of the allowed values
    const validDegreeTypes = ["Undergraduate", "Graduate", "Doctorate", "Certificate"];
    const degreeType = validDegreeTypes.includes(data.DegreeType) ? data.DegreeType : null;
    
    if (!degreeType && data.DegreeType) {
      console.warn(`Invalid degree type: "${data.DegreeType}". Must be one of: ${validDegreeTypes.join(", ")}`);
    }
    
    // Parse graduation year (if provided)
    let graduationYear = null;
    if (data.GraduationYear) {
      // Remove any non-digit characters and convert to number
      graduationYear = parseInt(String(data.GraduationYear).replace(/\D/g, ''), 10);
      if (isNaN(graduationYear)) {
        console.warn("Invalid graduation year format:", data.GraduationYear);
        graduationYear = null;
      }
    }
    
    // Update the contact record with basic information
    const contactData = {
      "First Name": data.FirstName,
      "Last Name": data.LastName,
    };
    
    // Handle Referral Source if provided
    if (data.ReferralSource) {
      contactData["Referral Source"] = data.ReferralSource;
    }
    
    // Add Onboarding status if provided (for new onboarding field)
    if (data.Onboarding) {
      const validOnboardingValues = ["Registered", "Applied"];
      if (validOnboardingValues.includes(data.Onboarding)) {
        contactData["Onboarding"] = data.Onboarding;
        console.log(`Updating Onboarding status to: ${data.Onboarding}`);
      } else {
        console.warn(`Invalid Onboarding value: "${data.Onboarding}". Must be one of: ${validOnboardingValues.join(", ")}`);
      }
    }
    
    const updatedContact = await contactsTable.update(contactId, contactData);
    
    // Attempt to find existing education record if ID not provided
    let educationId = data.educationId;
    
    if (!educationId && updatedContact.fields.Education && updatedContact.fields.Education.length > 0) {
      educationId = updatedContact.fields.Education[0];
      console.log("Found existing education record from contact:", educationId);
    }
    
    // If we have an education record ID, update the education record
    if (educationId) {
      console.log(`Updating education record ${educationId} with academic information`);
      
      // Create education data object with only valid fields
      const educationData = {};
      
      // Only add degree type if it's valid
      if (degreeType) {
        educationData["Degree Type"] = degreeType;
      }
      
      // Only add graduation year if it's valid
      if (graduationYear) {
        educationData["Graduation Year"] = graduationYear;
      }
      
      // Add graduation semester if provided
      if (data.GraduationSemester) {
        // Validate it's one of the allowed values
        const validSemesters = ["Fall", "Spring", "Summer"];
        if (validSemesters.includes(data.GraduationSemester)) {
          educationData["Graduation Semester"] = data.GraduationSemester;
        } else {
          console.warn(`Invalid graduation semester: "${data.GraduationSemester}". Must be one of: ${validSemesters.join(", ")}`);
        }
      }
      
      // For Major in education records, it's a linked record
      if (data.Major !== undefined) {
        if (data.Major === null) {
          // Explicitly clear the Major field
          educationData["Major"] = null;
          console.log("Clearing Major field (null value provided)");
        } else if (typeof data.Major === 'string' && data.Major.trim() !== '' && data.Major.startsWith('rec')) {
          // Format as array with single ID - required format for linking in Airtable
          educationData["Major"] = [data.Major];
          console.log(`Setting Major field to: [${data.Major}]`);
        } else if (data.Major) {
          console.warn("Major field has invalid format and will be ignored:", data.Major);
        }
      }
      
      // For Institution in education records, it's a linked record
      if (data.InstitutionId) {
        educationData["Institution"] = [data.InstitutionId]; // Format as array with single ID
      }
      
      // Only update if we have data to update
      if (Object.keys(educationData).length > 0) {
        console.log("Education data to update:", educationData);
        await educationTable.update(educationId, educationData);
      } else {
        console.log("No valid education data to update");
      }
    } 
    // Create a new education record if needed
    else if (data.InstitutionId || degreeType || graduationYear || data.Major) {
      console.log("Creating new education record");
      
      // Create basic education data with only valid fields
      const educationData = {
        "Contact": [contactId], // Link to the contact
      };
      
      // Add optional fields if available and valid
      if (data.InstitutionId) {
        educationData["Institution"] = [data.InstitutionId];
      }
      
      if (degreeType) {
        educationData["Degree Type"] = degreeType;
      }
      
      if (graduationYear) {
        educationData["Graduation Year"] = graduationYear;
      }
      
      // Add graduation semester if provided
      if (data.GraduationSemester) {
        // Validate it's one of the allowed values
        const validSemesters = ["Fall", "Spring", "Summer"];
        if (validSemesters.includes(data.GraduationSemester)) {
          educationData["Graduation Semester"] = data.GraduationSemester;
        } else {
          console.warn(`Invalid graduation semester: "${data.GraduationSemester}". Must be one of: ${validSemesters.join(", ")}`);
        }
      }
      
      if (data.Major) {
        educationData["Major"] = [data.Major];
      }
      
      console.log("New education data:", educationData);
      
      // Create new education record
      const newEducation = await educationTable.create(educationData);
      console.log("Created new education record:", newEducation.id);
      
      // Update the contact to link to this new education record
      await contactsTable.update(contactId, {
        "Education": [newEducation.id]
      });
    } else {
      console.log("No education data provided to create or update education record");
    }
    
    // Return the updated contact with its fields
    return {
      contactId: updatedContact.id,
      ...updatedContact.fields,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update user profile");
  }
}

/**
 * Look up institution by email domain
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} Institution data or null if not found
 */
export async function lookupInstitutionByEmail(email) {
  try {
    if (!email || !institutionsTable) {
      return null;
    }
    
    // Extract domain from email
    const domainMatch = email.match(/@(.+)$/);
    if (!domainMatch || !domainMatch[1]) {
      return null;
    }
    
    const domain = domainMatch[1];
    console.log(`Looking up institution for domain: "${domain}"`);
    
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
    const matchingRecords = records.filter(record => {
      if (!record.fields.Domains) return false;
      
      // Split domains by comma and trim whitespace
      const domainList = record.fields.Domains.split(',').map(d => d.trim());
      
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
 * Get education record by ID
 * @param {string} educationId - Airtable education record ID
 * @returns {Promise<Object>} Education data
 */
export async function getEducation(educationId) {
  try {
    const education = await educationTable.find(educationId)
    
    if (education) {
      return {
        id: education.id,
        ...education.fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching education record:", error)
    throw new Error("Failed to fetch education details")
  }
}

/**
 * Get program (major) details by ID
 * @param {string} programId - Airtable program ID
 * @returns {Promise<Object>} Program data
 */
export async function getProgram(programId) {
  try {
    if (!programsTable) {
      console.error("Programs table not initialized - missing environment variable");
      return null;
    }
    
    const program = await programsTable.find(programId);
    
    if (program) {
      return {
        id: program.id,
        ...program.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching program:", error);
    return null;
  }
}

/**
 * Get all programs (majors)
 * @returns {Promise<Array>} Array of program data objects
 */
export async function getAllPrograms() {
  try {
    if (!programsTable) {
      console.error("Programs table not initialized - missing environment variable");
      return [];
    }
    
    // Get all programs from the Programs table
    const records = await programsTable.select({
      sort: [{ field: "Major", direction: "asc" }]
    }).firstPage();
    
    // Process records and ensure they all have valid IDs
    const validRecords = [];
    
    for (const record of records) {
      // Validate record has an ID and it's in Airtable format
      if (!record.id || !record.id.startsWith('rec')) {
        console.warn(`Skipping program with invalid ID format: ${record.id}`);
        continue;
      }
      
      // Validate it has a name
      if (!record.fields.Major && !record.fields.name) {
        console.warn(`Skipping program without a name: ${record.id}`);
        continue;
      }
      
      // Add record with properly structured data
      validRecords.push({
        id: record.id,
        name: record.fields.Major || record.fields.name || "Unnamed Major",
        // Include original fields for reference
        fields: record.fields
      });
    }
    
    console.log(`Found ${records.length} total programs, ${validRecords.length} with valid IDs`);
    
    // Sort by name for consistent dropdown ordering
    validRecords.sort((a, b) => a.name.localeCompare(b.name));
    
    return validRecords;
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
}

/**
 * Get initiative details by ID
 * @param {string} initiativeId - Airtable initiative ID
 * @returns {Promise<Object>} Initiative data
 */
export async function getInitiative(initiativeId) {
  try {
    if (!initiativesTable) {
      console.error("Initiatives table not initialized - missing environment variable");
      return null;
    }
    
    const initiative = await initiativesTable.find(initiativeId);
    
    if (initiative) {
      // Include all fields, with special handling for Participation Type
      const fields = {
        ...initiative.fields,
        // Ensure Participation Type is a string defaulting to "Individual" if not set
        "Participation Type": initiative.fields["Participation Type"] || "Individual"
      };
      
      return {
        id: initiative.id,
        ...fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching initiative:", error);
    return null;
  }
}

/**
 * Get topic details by ID
 * @param {string} topicId - Airtable topic ID
 * @returns {Promise<Object>} Topic data
 */
export async function getTopic(topicId) {
  try {
    if (!topicsTable) {
      console.error("Topics table not initialized - missing environment variable");
      return null;
    }
    
    const topic = await topicsTable.find(topicId);
    
    if (topic) {
      return {
        id: topic.id,
        ...topic.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching topic:", error);
    return null;
  }
}

/**
 * Get class details by ID
 * @param {string} classId - Airtable class ID
 * @returns {Promise<Object>} Class data
 */
export async function getClass(classId) {
  try {
    if (!classesTable) {
      console.error("Classes table not initialized - missing environment variable");
      return null;
    }
    
    const classRecord = await classesTable.find(classId);
    
    if (classRecord) {
      return {
        id: classRecord.id,
        ...classRecord.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching class:", error);
    return null;
  }
}

/**
 * Get cohorts available for an institution
 * @param {string} institutionId - Airtable institution ID
 * @returns {Promise<Array>} List of cohorts
 */
export async function getCohortsByInstitution(institutionId) {
  try {
    if (!partnershipsTable || !cohortsTable || !initiativesTable || !topicsTable || !classesTable) {
      console.error("Required tables not initialized - missing environment variables");
      return [];
    }
    
    console.log(`Looking for partnerships with institution ID: ${institutionId}`);
    
    // Step 1: Get partnerships with this institution ID - direct approach
    let partnerships = [];
    try {
      // Just get ALL partnerships and filter client-side - most reliable approach
      const allPartnerships = await partnershipsTable.select().firstPage();
      
      // Filter for partnerships that include our institution ID
      partnerships = allPartnerships.filter(partnership => {
        const institutions = partnership.fields.Institution || [];
        return institutions.includes(institutionId);
      });
      
      console.log(`Found ${partnerships.length} partnerships for institution ${institutionId}`);
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      return [];
    }
    
    if (partnerships.length === 0) {
      console.log("No partnerships found for this institution");
      return [];
    }
    
    // Step 2: Get cohort IDs from partnerships
    const cohortIds = [];
    partnerships.forEach(partnership => {
      const partnershipCohorts = partnership.fields.Cohorts || [];
      partnershipCohorts.forEach(cohortId => {
        if (!cohortIds.includes(cohortId)) {
          cohortIds.push(cohortId);
        }
      });
    });
    
    console.log(`Found ${cohortIds.length} unique cohort IDs:`, cohortIds);
    
    if (cohortIds.length === 0) {
      console.log("No cohorts found in partnerships");
      return [];
    }
    
    // Step 3: Fetch each cohort directly by ID for maximum reliability
    const cohorts = [];
    const initiativeIds = new Set(); // Track unique initiative IDs
    const topicIds = new Set(); // Track unique topic IDs
    const classIds = new Set(); // Track unique class IDs
    
    for (const cohortId of cohortIds) {
      try {
        const cohort = await cohortsTable.find(cohortId);
        console.log(`Fetched cohort ${cohortId}, status: ${cohort.fields.Status}`);
        
        // Only process cohorts with "Applications Open" status
        if (cohort.fields.Status === "Applications Open") {
          // Track initiative IDs for later lookup
          if (cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
            cohort.fields.Initiative.forEach(id => initiativeIds.add(id));
          }
          
          // Track topic IDs for later lookup
          if (cohort.fields.Topics && cohort.fields.Topics.length > 0) {
            cohort.fields.Topics.forEach(id => topicIds.add(id));
          }
          
          // Track class IDs for later lookup
          if (cohort.fields.Classes && cohort.fields.Classes.length > 0) {
            cohort.fields.Classes.forEach(id => classIds.add(id));
          }
          
          cohorts.push({
            id: cohort.id,
            ...cohort.fields
          });
        }
      } catch (error) {
        console.error(`Error fetching cohort ${cohortId}:`, error);
      }
    }
    
    // Step 4: Fetch all linked records in batches
    
    // 4.1: Fetch initiatives
    const initiativeDetails = {};
    if (initiativeIds.size > 0) {
      try {
        // Create a filter formula to get all initiatives at once
        const initiativeIdsArray = Array.from(initiativeIds);
        const initiativeConditions = initiativeIdsArray.map(id => `RECORD_ID()="${id}"`).join(",");
        const filterFormula = `OR(${initiativeConditions})`;
        
        const initiatives = await initiativesTable
          .select({
            filterByFormula: filterFormula
          })
          .firstPage();
        
        // Create a lookup map for initiatives
        initiatives.forEach(initiative => {
          // Extract participation type with fallback
          let participationType = "Individual";
          if (initiative.fields["Participation Type"]) {
            // Convert to string, normalize to title case
            const rawType = String(initiative.fields["Participation Type"]);
            participationType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
          }
          
          // Log the raw field value and our processed value
          console.log(`Initiative ${initiative.id} - Participation Type:`, {
            raw: initiative.fields["Participation Type"],
            processed: participationType
          });
          
          initiativeDetails[initiative.id] = {
            name: initiative.fields.Name || "Untitled Initiative",
            description: initiative.fields.Description || "",
            "Participation Type": participationType
          };
        });
        
        console.log(`Fetched ${initiatives.length} initiatives`);
      } catch (error) {
        console.error("Error fetching initiatives:", error);
      }
    }
    
    // 4.2: Fetch topics
    const topicDetails = {};
    if (topicIds.size > 0) {
      try {
        const topicIdsArray = Array.from(topicIds);
        const topicConditions = topicIdsArray.map(id => `RECORD_ID()="${id}"`).join(",");
        const filterFormula = `OR(${topicConditions})`;
        
        const topics = await topicsTable
          .select({
            filterByFormula: filterFormula
          })
          .firstPage();
        
        topics.forEach(topic => {
          topicDetails[topic.id] = {
            name: topic.fields.Name || "Untitled Topic",
            description: topic.fields.Description || ""
          };
        });
        
        console.log(`Fetched ${topics.length} topics:`, topicDetails);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    }
    
    // 4.3: Fetch classes
    const classDetails = {};
    if (classIds.size > 0) {
      try {
        const classIdsArray = Array.from(classIds);
        const classConditions = classIdsArray.map(id => `RECORD_ID()="${id}"`).join(",");
        const filterFormula = `OR(${classConditions})`;
        
        const classes = await classesTable
          .select({
            filterByFormula: filterFormula
          })
          .firstPage();
        
        classes.forEach(classItem => {
          classDetails[classItem.id] = {
            name: classItem.fields.Name || "Untitled Class"
          };
        });
        
        console.log(`Fetched ${classes.length} classes:`, classDetails);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    }
    
    // Step 5: Enhance cohorts with all details
    const enhancedCohorts = cohorts.map(cohort => {
      const result = { ...cohort };
      
      // Add initiative details if available
      if (cohort.Initiative && cohort.Initiative.length > 0) {
        const initiativeId = cohort.Initiative[0];
        if (initiativeDetails[initiativeId]) {
          // Copy initiative details
          const details = { ...initiativeDetails[initiativeId] };
          
          // Make sure Participation Type exists and is properly formatted
          // This is critical for determining if a cohort uses team or individual enrollment
          const participationType = details["Participation Type"];
          
          // Process participation type
          let finalParticipationType = "Individual";
          
          if (participationType && typeof participationType === 'string') {
            // Normalize the participation type for reliable comparisons
            const normalizedType = participationType.trim().toLowerCase();
            
            // If it contains "team" anywhere, treat it as a team participation type
            if (normalizedType.includes('team')) {
              finalParticipationType = "Team";
            } else {
              finalParticipationType = participationType;
            }
          }
          
          result.initiativeDetails = {
            ...details,
            // Set the normalized participation type
            "Participation Type": finalParticipationType
          };
          
          // Add direct access to participation type to make it easier to check
          result.participationType = finalParticipationType;
          
          console.log(`Cohort ${cohort.id} - Initiative ${initiativeId} participation type:`, {
            original: participationType,
            normalized: finalParticipationType
          });
        }
      }
      
      // Add topic details if available
      if (cohort.Topics && cohort.Topics.length > 0) {
        const topicNames = cohort.Topics.map(topicId => 
          topicDetails[topicId]?.name || "Unknown Topic"
        ).filter(name => name !== "Unknown Topic"); // Only include topics we found
        
        if (topicNames.length > 0) {
          result.topicNames = topicNames;
        }
      }
      
      // Add class details if available
      if (cohort.Classes && cohort.Classes.length > 0) {
        const classNames = cohort.Classes.map(classId => 
          classDetails[classId]?.name || "Unknown Class"
        ).filter(name => name !== "Unknown Class"); // Only include classes we found
        
        if (classNames.length > 0) {
          result.classNames = classNames;
        }
      }
      
      return result;
    });
    
    console.log(`Found ${enhancedCohorts.length} open cohorts with details`);
    
    // Log a sample cohort
    if (enhancedCohorts.length > 0) {
      console.log("Sample cohort with details:", enhancedCohorts[0]);
    }
    
    return enhancedCohorts;
  } catch (error) {
    console.error("Error in getCohortsByInstitution:", error);
    return [];
  }
}

/**
 * Get teams where the user is a member
 * @param {string} contactId - Airtable contact ID
 * @returns {Promise<Array|null>} Array of team data objects with members or null if no teams found
 */
/**
 * Get a specific team by ID with member details
 * @param {string} teamId - Airtable team ID
 * @param {string} contactId - Current user's contact ID for marking as current user
 * @returns {Promise<Object|null>} Team data or null if not found
 */
export async function getTeamById(teamId, contactId) {
  try {
    if (!teamId) {
      console.error("Team ID is required to fetch team");
      return null;
    }
    
    // Get the Teams table ID from environment variables
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    if (!teamsTableId) {
      console.error("Teams table ID not configured");
      return null;
    }
    
    // Initialize the teams table
    const teamsTable = base(teamsTableId);
    
    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      console.error("Members table ID not configured");
      return null;
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
    
    // Initialize the contacts table
    const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID);
    
    // Get the team details
    console.log(`Fetching team with ID: ${teamId}`);
    const team = await teamsTable.find(teamId);
    
    if (!team) {
      console.log(`Team ${teamId} not found`);
      return null;
    }
    
    console.log(`Found team ${teamId}:`, team.fields.Name || team.fields["Team Name"]);
    
    // Get all members of this team using the member IDs from the team record
    const teamMemberIds = team.fields.Members || [];
    
    if (teamMemberIds.length === 0) {
      console.log(`Team ${teamId} has no members`);
      // Return team with empty members array
      return {
        id: team.id,
        name: team.fields.Name || team.fields["Team Name"] || "Unnamed Team",
        description: team.fields.Description || "",
        points: team.fields["Team Points"] || team.fields["Total Points"] || team.fields.Points || 0,
        members: [],
        cohortIds: team.fields.Cohorts || []
      };
    }
    
    // Process member IDs in batches to avoid formula length limits
    const memberBatches = [];
    for (let i = 0; i < teamMemberIds.length; i += 10) {
      const batchIds = teamMemberIds.slice(i, i + 10);
      const conditions = batchIds.map(id => `RECORD_ID()="${id}"`).join(",");
      memberBatches.push(
        membersTable.select({
          filterByFormula: `OR(${conditions})`,
          fields: ["Contact", "Status"]
        }).firstPage()
      );
    }
    
    const teamMembersResults = await Promise.all(memberBatches);
    const teamMembers = teamMembersResults.flat();
    
    // Get contact IDs for all members
    const memberContactIds = teamMembers
      .map(member => member.fields.Contact?.[0])
      .filter(Boolean);
    
    // Create a lookup mapping of contact IDs to member records
    const memberLookup = {};
    teamMembers.forEach(member => {
      if (member.fields.Contact && member.fields.Contact.length > 0) {
        memberLookup[member.fields.Contact[0]] = {
          id: member.id,
          status: member.fields.Status || "Unknown"
        };
      }
    });
    
    // Fetch all member contacts in a single query
    let memberContacts = [];
    if (memberContactIds.length > 0) {
      const contactBatches = [];
      
      // Process in batches of 10 to avoid filter length limitations
      for (let i = 0; i < memberContactIds.length; i += 10) {
        const batchIds = memberContactIds.slice(i, i + 10);
        const conditions = batchIds.map(id => `RECORD_ID()="${id}"`).join(",");
        const formula = `OR(${conditions})`;
        
        contactBatches.push(
          contactsTable.select({
            filterByFormula: formula,
            fields: ["First Name", "Last Name", "Email"]
          }).firstPage()
        );
      }
      
      const contactResults = await Promise.all(contactBatches);
      memberContacts = contactResults.flat();
    }
    
    // Map contact details to member records
    const members = memberContacts.map(contact => {
      const memberInfo = memberLookup[contact.id] || {};
      const firstName = contact.fields["First Name"] || "";
      const lastName = contact.fields["Last Name"] || "";
      
      return {
        id: contact.id,
        name: `${firstName} ${lastName}`.trim(),
        email: contact.fields.Email || "",
        status: memberInfo.status || "Inactive",
        isCurrentUser: contactId ? contact.id === contactId : false,
        memberRecordId: memberInfo.id // Add the member record ID
      };
    });
    
    // Use the actual field names from the team record
    const teamName = team.fields.Name || team.fields["Team Name"] || "Unnamed Team";
    let teamPoints = null;
    if (team.fields["Team Points"] !== undefined) {
      teamPoints = team.fields["Team Points"];
    } else if (team.fields["Total Points"] !== undefined) {
      teamPoints = team.fields["Total Points"];
    } else if (team.fields.Points !== undefined) {
      teamPoints = team.fields.Points;
    }
    
    // Get team's associated cohorts if any
    const teamCohorts = team.fields.Cohorts || [];
    
    // Get team's associated submissions if any
    const teamSubmissions = team.fields.Submissions || [];
    
    // Check if team has institution and try to get institution details
    let institutionData = null;
    if (team.fields.Institution && team.fields.Institution.length > 0) {
      const institutionId = team.fields.Institution[0];
      
      // Log what we find for debugging
      console.log(`Team ${team.id} institution data:`, {
        institutionId,
        nameFromInstitution: team.fields["Name (from Institution)"],
        institutionName: team.fields["Institution Name"]
      });
      
      // First try to get institution name from team record
      const nameFromTeamRecord = team.fields["Institution Name"] || 
                                (Array.isArray(team.fields["Name (from Institution)"]) ? 
                                 team.fields["Name (from Institution)"][0] : 
                                 team.fields["Name (from Institution)"]);
      
      // If no name found in team record, try to fetch directly from institutions table
      if (!nameFromTeamRecord && process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) {
        try {
          const institutionsTable = base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID);
          const institution = await institutionsTable.find(institutionId);
          
          if (institution && institution.fields.Name) {
            institutionData = {
              id: institutionId,
              name: institution.fields.Name
            };
            console.log(`Found institution name directly: ${institution.fields.Name}`);
          }
        } catch (instError) {
          console.error(`Error fetching institution ${institutionId}:`, instError);
        }
      }
      
      // If we didn't get data from direct lookup, use team record data
      if (!institutionData) {
        institutionData = {
          id: institutionId,
          name: nameFromTeamRecord || "Unknown Institution"
        };
      }
    }
    
    // Create the team object with all relevant data
    return {
      id: team.id,
      name: teamName,
      description: team.fields.Description || "",
      points: teamPoints,
      members: members,
      cohortIds: teamCohorts, // Include the cohort IDs associated with this team
      submissions: teamSubmissions, // Include the submission IDs
      institution: institutionData
    };
  } catch (error) {
    console.error(`Error fetching team ${teamId}:`, error);
    return null;
  }
}

/**
 * Get teams by their IDs
 * @param {Array<string>} teamIds - Array of team IDs to fetch
 * @returns {Promise<Array<Object>>} Array of team objects
 */
export async function getTeamsByIds(teamIds) {
  try {
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      console.error("Valid team IDs array is required");
      return [];
    }
    
    if (!teamsTable) {
      console.error("Teams table not initialized");
      return [];
    }
    
    console.log(`Fetching ${teamIds.length} teams by IDs:`, teamIds);
    
    // For a small number of IDs, create an OR formula to find teams
    if (teamIds.length <= 10) {
      const formula = `OR(${teamIds.map(id => `RECORD_ID()='${id}'`).join(',')})`;
      console.log("Using formula:", formula);
      
      const records = await teamsTable
        .select({
          filterByFormula: formula,
          maxRecords: teamIds.length
        })
        .firstPage();
      
      console.log(`Found ${records.length} teams`);
      
      // Log the found team records for debugging
      records.forEach(record => {
        console.log(`Team record ${record.id} data:`, {
          hasName: !!record.fields.Name,
          hasTeamName: !!record.fields["Team Name"],
          nameValue: record.fields.Name || record.fields["Team Name"] || "Unnamed Team",
          fields: Object.keys(record.fields),
          institutionField: record.fields.Institution,
          institutionNameField: record.fields["Institution Name"],
          nameFromInstitutionField: record.fields["Name (from Institution)"]
        });
      });
      
      // Process each record and fetch institutions if needed
      const teamResults = await Promise.all(records.map(async record => {
        // Make sure to get the team name with fallbacks and add debugging info
        const teamName = record.fields.Name || record.fields["Team Name"] || `Team ${record.id.slice(-5)}`;
        
        // Check institution data and potentially fetch if needed
        let institutionData = null;
        
        if (record.fields.Institution) {
          const institutionId = Array.isArray(record.fields.Institution) ? 
            record.fields.Institution[0] : record.fields.Institution;
          
          // Log institution data for debugging
          console.log(`Team ${record.id} institution info:`, {
            id: institutionId,
            nameInTeam: record.fields["Institution Name"],
            nameFromInstitution: record.fields["Name (from Institution)"]
          });
          
          // First check if we have name in the record itself
          const nameFromRecord = record.fields["Institution Name"] || 
                              (Array.isArray(record.fields["Name (from Institution)"]) ? 
                              record.fields["Name (from Institution)"][0] : 
                              record.fields["Name (from Institution)"]);
          
          if (nameFromRecord) {
            institutionData = {
              id: institutionId,
              name: nameFromRecord
            };
          } 
          // If not, try to fetch directly from institutions table
          else if (process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) {
            try {
              const institutionsTable = base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID);
              const institution = await institutionsTable.find(institutionId);
              
              if (institution && institution.fields.Name) {
                institutionData = {
                  id: institutionId,
                  name: institution.fields.Name
                };
                console.log(`Found institution name via direct lookup: ${institution.fields.Name}`);
              }
            } catch (err) {
              console.error(`Error fetching institution ${institutionId}:`, err.message);
            }
          }
          
          // If we still don't have data, use "Unknown Institution"
          if (!institutionData) {
            institutionData = {
              id: institutionId,
              name: "Unknown Institution"
            };
          }
        }
        
        return {
          id: record.id,
          name: teamName,
          teamName: teamName, // Add an additional field for compatibility
          description: record.fields.Description,
          members: record.fields.Members || [],
          cohortIds: record.fields.Cohorts || [],
          institution: institutionData,
          displayMembers: record.fields["Member Names"] || record.fields["Name (from Contact) (from Members)"] || [],
          memberCount: record.fields["Member Count"] || record.fields["Count (Members)"] || 0,
          joinable: true, // We assume teams fetched by ID are joinable
          _debug: {
            originalName: record.fields.Name,
            teamNameField: record.fields["Team Name"],
            hasNameField: !!record.fields.Name,
            hasTeamNameField: !!record.fields["Team Name"]
          }
        };
      }));
      
      return teamResults;
    } 
    // For larger sets, process in batches
    else {
      const allTeams = [];
      
      // Process in batches of 10
      for (let i = 0; i < teamIds.length; i += 10) {
        const batchIds = teamIds.slice(i, i + 10);
        const batchTeams = await getTeamsByIds(batchIds);
        allTeams.push(...batchTeams);
      }
      
      return allTeams;
    }
  } catch (error) {
    console.error("Error fetching teams by IDs:", error);
    return [];
  }
}

export async function getUserTeams(contactId) {
  try {
    if (!contactId) {
      console.error("Contact ID is required to fetch user teams");
      return null;
    }
    
    if (!teamsTable) {
      console.error("Teams table not initialized");
      return null;
    }
    
    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      console.error("Members table ID not configured");
      return null;
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
    
    // First, we need to get the Contact record to find the Members links
    const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID);
    
    // Get the contact record with its Member links
    console.log(`Getting contact record ${contactId} to find member links`);
    let contactRecord;
    try {
      contactRecord = await contactsTable.find(contactId);
      console.log("Found contact record:", contactRecord.id);
    } catch (contactErr) {
      console.error("Error finding contact record:", contactErr);
      return null;
    }
    
    // Initialize empty array for member IDs in case we don't find any
    let memberIds = [];
    
    // Check if contact record has Members field and it has entries
    if (contactRecord?.fields?.Members && Array.isArray(contactRecord.fields.Members) && contactRecord.fields.Members.length > 0) {
      memberIds = contactRecord.fields.Members;
      console.log(`Found ${memberIds.length} member records linked to contact ${contactId}:`, memberIds);
    } else {
      console.log(`No Members found in contact record ${contactId}`);
      
      // Try to find members directly by searching in members table
      try {
        console.log(`Searching for members directly with contact ID ${contactId}`);
        const directMembers = await membersTable.select({
          filterByFormula: `{Contact}="${contactId}"`,
          maxRecords: 100
        }).firstPage();
        
        if (directMembers && directMembers.length > 0) {
          memberIds = directMembers.map(m => m.id);
          console.log(`Found ${memberIds.length} members by direct lookup:`, memberIds);
        } else {
          console.log("No members found by direct lookup");
          return null;
        }
      } catch (memberError) {
        console.error("Error searching for members directly:", memberError);
        return null;
      }
    }
    
    // Get the Member records
    let memberRecords = [];
    for (let i = 0; i < memberIds.length; i++) {
      try {
        const memberRecord = await membersTable.find(memberIds[i]);
        memberRecords.push(memberRecord);
      } catch (error) {
        console.error(`Error fetching member record ${memberIds[i]}:`, error);
      }
    }
    
    console.log(`Retrieved ${memberRecords.length} member records`);
    
    if (memberRecords.length === 0) {
      return null;
    }
    
    // Filter to get active member records with Team links
    const activeMembers = memberRecords.filter(member => {
      const status = member.fields.Status ? String(member.fields.Status).trim().toLowerCase() : '';
      console.log(`Member status: ${status}`);
      return status === "active" &&
             member.fields.Team &&
             member.fields.Team.length > 0;
    });
    
    if (activeMembers.length === 0) {
      console.log("No active member records with team links found");
      return null;
    }
    
    console.log(`Found ${activeMembers.length} active member records with team links`);
    
    // Get all team IDs - we now support multiple teams per user
    const teamIds = [];
    activeMembers.forEach(member => {
      member.fields.Team.forEach(teamId => {
        if (!teamIds.includes(teamId)) {
          teamIds.push(teamId);
        }
      });
    });
    
    console.log(`Found ${teamIds.length} unique team IDs:`, teamIds);
    
    if (teamIds.length === 0) {
      return null;
    }
    
    // Process each team to get full details
    const teams = [];
    
    for (const teamId of teamIds) {
      try {
        // Get the team details
        const team = await teamsTable.find(teamId);
        
        if (!team) {
          console.log(`Team ${teamId} not found`);
          continue;
        }
        
        console.log(`Processing team ${teamId}:`, team.fields.Name || team.fields["Team Name"]);
        
        // Get all members of this team using the member IDs from the team record
        const teamMemberIds = team.fields.Members || [];
        
        if (teamMemberIds.length === 0) {
          console.log(`Team ${teamId} has no members`);
          continue;
        }
        
        // Process member IDs in batches to avoid formula length limits
        const memberBatches = [];
        for (let i = 0; i < teamMemberIds.length; i += 10) {
          const batchIds = teamMemberIds.slice(i, i + 10);
          const conditions = batchIds.map(id => `RECORD_ID()="${id}"`).join(",");
          memberBatches.push(
            membersTable.select({
              filterByFormula: `OR(${conditions})`,
              fields: ["Contact", "Status"]
            }).firstPage()
          );
        }
        
        const teamMembersResults = await Promise.all(memberBatches);
        const teamMembers = teamMembersResults.flat();
        
        // Get contact IDs for all members
        const memberContactIds = teamMembers
          .map(member => member.fields.Contact?.[0])
          .filter(Boolean);
        
        // Create a lookup mapping of contact IDs to member records
        const memberLookup = {};
        teamMembers.forEach(member => {
          if (member.fields.Contact && member.fields.Contact.length > 0) {
            memberLookup[member.fields.Contact[0]] = {
              id: member.id,
              status: member.fields.Status || "Unknown"
            };
          }
        });
        
        // Fetch all member contacts in a single query
        let memberContacts = [];
        if (memberContactIds.length > 0) {
          const contactBatches = [];
          
          // Process in batches of 10 to avoid filter length limitations
          for (let i = 0; i < memberContactIds.length; i += 10) {
            const batchIds = memberContactIds.slice(i, i + 10);
            const conditions = batchIds.map(id => `RECORD_ID()="${id}"`).join(",");
            const formula = `OR(${conditions})`;
            
            contactBatches.push(
              contactsTable.select({
                filterByFormula: formula,
                fields: ["First Name", "Last Name", "Email"]
              }).firstPage()
            );
          }
          
          const contactResults = await Promise.all(contactBatches);
          memberContacts = contactResults.flat();
        }
        
        // Map contact details to member records
        const members = memberContacts.map(contact => {
          const memberInfo = memberLookup[contact.id] || {};
          const firstName = contact.fields["First Name"] || "";
          const lastName = contact.fields["Last Name"] || "";
          
          return {
            id: contact.id,
            name: `${firstName} ${lastName}`.trim(),
            email: contact.fields.Email || "",
            status: memberInfo.status || "Inactive",
            isCurrentUser: contact.id === contactId,
            memberRecordId: memberInfo.id // Add the member record ID
          };
        });
        
        // Use the actual field names from the team record
        const teamName = team.fields.Name || team.fields["Team Name"] || "Unnamed Team";
        let teamPoints = null;
        if (team.fields["Team Points"] !== undefined) {
          teamPoints = team.fields["Team Points"];
        } else if (team.fields["Total Points"] !== undefined) {
          teamPoints = team.fields["Total Points"];
        } else if (team.fields.Points !== undefined) {
          teamPoints = team.fields.Points;
        }
        
        // Get team's associated cohorts if any
        const teamCohorts = team.fields.Cohorts || [];
        
        // Get team's submissions if any
        const teamSubmissions = team.fields.Submissions || [];
        
        // Add the team to our list with all relevant data
        teams.push({
          id: team.id,
          name: teamName,
          description: team.fields.Description || "",
          points: teamPoints,
          members: members,
          cohortIds: teamCohorts, // Include the cohort IDs associated with this team
          submissions: teamSubmissions // Include the submission IDs associated with this team
        });
      } catch (error) {
        console.error(`Error processing team ${teamId}:`, error);
      }
    }
    
    console.log(`Processed ${teams.length} teams in total`);
    
    // For backward compatibility: if only one team, return it as an object
    // Otherwise, return the array of teams
    return teams.length > 0 ? teams : null;
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return null;
  }
}

/**
 * Check if a user is already participating in a conflicting initiative
 * Uses the Participation table as source of truth
 * @param {string} contactId - Airtable contact ID
 * @param {string} initiativeName - Name of the initiative to check conflicts with
 * @returns {Promise<Object>} Conflict info - { hasConflict, conflictingInitiative }
 */
export async function checkInitiativeConflicts(contactId, initiativeName) {
  try {
    if (!contactId || !initiativeName || !participationTable || !contactsTable) {
      console.error("Missing required parameters or tables for initiative conflict check");
      return { hasConflict: false };
    }
    
    console.log(`Checking initiative conflicts for contact ${contactId} with initiative ${initiativeName}`);
    
    // Normalize the initiative name for comparison
    const normalizedInitiative = initiativeName.toLowerCase();
    const isXperience = normalizedInitiative.includes("xperience");
    const isXtrapreneurs = normalizedInitiative.includes("xtrapreneurs");
    
    // Log initiative type check
    console.log(`Initiative check: initiative="${initiativeName}", isXperience=${isXperience}, isXtrapreneurs=${isXtrapreneurs}`);
    
    // Get the contact record with participation records
    const contactRecord = await contactsTable.find(contactId);
    
    if (!contactRecord || !contactRecord.fields.Participation || !contactRecord.fields.Participation.length) {
      console.log(`No participation records found for contact ${contactId}`);
      return { hasConflict: false };
    }
    
    // Get participation record IDs
    const participationIds = contactRecord.fields.Participation;
    console.log(`Found ${participationIds.length} participation records for contact ${contactId}:`, participationIds);
    
    // Fetch all participation records
    const participationRecords = [];
    for (const id of participationIds) {
      try {
        const record = await participationTable.find(id);
        
        // Only include active participation records or those without a status
        // Default to treating records without status as active for backwards compatibility
        const status = record.fields.Status || 'active';
        if (status.toLowerCase() === 'active') {
          participationRecords.push(record);
          console.log(`Including active participation record: ${record.id}`);
        } else {
          console.log(`Skipping inactive participation record: ${record.id}, Status: ${status}`);
        }
      } catch (error) {
        console.error(`Error fetching participation record ${id}:`, error);
      }
    }
    
    if (participationRecords.length === 0) {
      console.log(`No active participation records found for contact ${contactId}`);
      return { hasConflict: false };
    }
    
    console.log(`Retrieved ${participationRecords.length} active participation records`);
    
    // Get all cohort IDs from the participation records
    const cohortIds = [];
    participationRecords.forEach(record => {
      if (record.fields.Cohorts && record.fields.Cohorts.length > 0) {
        record.fields.Cohorts.forEach(id => {
          if (!cohortIds.includes(id)) {
            cohortIds.push(id);
          }
        });
      }
    });
    
    if (cohortIds.length === 0) {
      return { hasConflict: false };
    }
    
    console.log(`Found ${cohortIds.length} cohort IDs in participation records:`, cohortIds);
    
    // Get details for each cohort
    const initiativeInfo = {};
    
    for (const cohortId of cohortIds) {
      try {
        const cohort = await cohortsTable.find(cohortId);
        
        if (cohort && cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
          const initiativeId = cohort.fields.Initiative[0];
          
          try {
            const initiative = await initiativesTable.find(initiativeId);
            
            if (initiative) {
              const initiativeName = initiative.fields.Name || "Unknown Initiative";
              
              // Get the participation type
              let participationType = "Individual";
              if (initiative.fields["Participation Type"]) {
                participationType = String(initiative.fields["Participation Type"]).trim();
              }
              
              // Track this initiative
              if (!initiativeInfo[initiativeId]) {
                initiativeInfo[initiativeId] = {
                  name: initiativeName,
                  participationType: participationType,
                  cohorts: []
                };
              }
              
              // Add this cohort to the initiative
              initiativeInfo[initiativeId].cohorts.push({
                id: cohort.id,
                name: cohort.fields['Short Name'] || "Unknown Cohort"
              });
            }
          } catch (error) {
            console.error(`Error fetching initiative ${initiativeId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching cohort ${cohortId}:`, error);
      }
    }
    
    console.log("Found initiatives:", initiativeInfo);
    
    // Check for conflicts
    let conflictingInitiative = null;
    
    // Get the participation type of the current initiative
    // First, need to look up the initiative by name
    let requestedInitiativeParticipationType = "Unknown";
    try {
      // Get all initiatives to find the one we're checking against
      const allInitiatives = await initiativesTable.select({
        filterByFormula: `SEARCH("${initiativeName}", {Name})`,
        maxRecords: 1
      }).firstPage();
      
      if (allInitiatives && allInitiatives.length > 0) {
        const requestedInitiative = allInitiatives[0];
        requestedInitiativeParticipationType = requestedInitiative.fields["Participation Type"] || "Individual";
      }
    } catch (error) {
      console.error(`Error fetching initiative by name ${initiativeName}:`, error);
    }
    
    console.log(`Requested initiative "${initiativeName}" participation type:`, requestedInitiativeParticipationType);
    
    // Check if requested initiative has team participation - using standardized detection
    const normalizedRequestedType = requestedInitiativeParticipationType.trim().toLowerCase();
    const isRequestedTeamParticipation = 
      normalizedRequestedType === "team" || 
      normalizedRequestedType.includes("team") ||
      normalizedRequestedType === "teams" ||
      normalizedRequestedType === "group" ||
      normalizedRequestedType.includes("group") ||
      normalizedRequestedType === "collaborative" ||
      normalizedRequestedType.includes("collaborative");
    
    console.log(`Is requested initiative "${initiativeName}" a team initiative? ${isRequestedTeamParticipation} (${requestedInitiativeParticipationType})`);
    
    // For each initiative, check if it conflicts with the target initiative
    for (const id in initiativeInfo) {
      const initiative = initiativeInfo[id];
      const currentName = initiative.name.toLowerCase();
      const currentParticipationType = initiative.participationType.toLowerCase();
      
      console.log(`Checking against initiative: "${initiative.name}" (${currentParticipationType})`);
      
      // Check for conflicts between Xperience and Xtrapreneurs (legacy check)
      if ((isXperience && currentName.includes("xtrapreneurs")) || 
          (isXtrapreneurs && currentName.includes("xperience"))) {
        conflictingInitiative = initiative.name;
        console.log(`Found specific conflict between Xperience and Xtrapreneurs: ${conflictingInitiative}`);
        break;
      }
      
      // Check for team participation type conflicts - standardized detection
      // This provides a more robust way to check for team-based participation types
      const normalizedType = currentParticipationType.trim().toLowerCase();
      const isCurrentTeamParticipation = 
        normalizedType === "team" || 
        normalizedType.includes("team") ||
        normalizedType === "teams" ||
        normalizedType === "group" ||
        normalizedType.includes("group") ||
        normalizedType === "collaborative" ||
        normalizedType.includes("collaborative");
      
      console.log(`Current initiative "${initiative.name}" is team participation? ${isCurrentTeamParticipation} (${currentParticipationType})`);
      
      // If both initiatives are team-based, that's a conflict
      if (isRequestedTeamParticipation && isCurrentTeamParticipation) {
        conflictingInitiative = initiative.name;
        console.log(`Found conflict between team initiatives: ${initiative.name} vs ${initiativeName}`);
        break;
      }
    }
    
    if (conflictingInitiative) {
      // Extract additional team information if available
      
      // First try to find a participation record with a direct link to the initiative
      let conflictingParticipation = participationRecords.find(
        p => {
          // First check if we have an initiative ID
          if (!p.fields.Initiative || !Array.isArray(p.fields.Initiative) || p.fields.Initiative.length === 0) {
            return false;
          }
          
          // Get the initiative name from the initiativeInfo object
          const initiativeId = p.fields.Initiative[0];
          const initiativeData = initiativeInfo[initiativeId];
          
          // Check if this participation record is for the conflicting initiative
          return initiativeData && initiativeData.name === conflictingInitiative;
        }
      );
      
      // If we didn't find it with direct initiative link, try with initiative name field
      if (!conflictingParticipation) {
        conflictingParticipation = participationRecords.find(
          p => {
            // Check initiative name field if it exists
            if (p.fields['Initiative Name'] && p.fields['Initiative Name'] === conflictingInitiative) {
              return true;
            }
            
            // Check for a cohort with a matching initiative name
            if (p.fields.Cohorts && Array.isArray(p.fields.Cohorts) && p.fields.Cohorts.length > 0) {
              // For any cohort in this record, check if its initiative matches
              for (const cohortId of p.fields.Cohorts) {
                // Look through the initiativeInfo to find a matching cohort
                for (const id in initiativeInfo) {
                  const initiative = initiativeInfo[id];
                  if (initiative.name === conflictingInitiative && 
                      initiative.cohorts.some(c => c.id === cohortId)) {
                    return true;
                  }
                }
              }
            }
            
            return false;
          }
        );
      }
      
      // As a last resort, try to get the first team-based participation record
      if (!conflictingParticipation) {
        conflictingParticipation = participationRecords.find(
          p => p.fields.Team && Array.isArray(p.fields.Team) && p.fields.Team.length > 0
        );
        
        if (conflictingParticipation) {
          console.log("Falling back to first team participation record found");
        }
      }
      
      let teamId = null;
      let teamName = null;
      
      // If team participation, try to get the team info
      if (conflictingParticipation) {
        // Log the found participation record
        console.log("Found participation record for conflict:", {
          id: conflictingParticipation.id,
          fields: conflictingParticipation.fields
        });
        
        const teamRecordId = conflictingParticipation.fields.Team;
        
        if (teamRecordId && Array.isArray(teamRecordId) && teamRecordId.length > 0) {
          teamId = teamRecordId[0];
          console.log(`Found team ID from participation record: ${teamId}`);
          
          // Try to get team name from fields
          if (conflictingParticipation.fields['Team Name']) {
            teamName = conflictingParticipation.fields['Team Name'];
          }
          // Fall back to Team Lookup if available
          else if (conflictingParticipation.fields['Team Lookup'] && 
              Array.isArray(conflictingParticipation.fields['Team Lookup']) && 
              conflictingParticipation.fields['Team Lookup'].length > 0) {
            teamName = conflictingParticipation.fields['Team Lookup'][0];
          }
          // If we have a team ID but no name, try to fetch the team
          else {
            try {
              // Check if teamsTable is available
              if (teamsTable) {
                // We need to await the find operation
                teamName = "Team " + teamId; // Default name as fallback
                
                // Since we can't easily use await here in this structure,
                // we'll set a reasonable fallback and leave detailed fetching
                // to the component that needs it
                console.log(`Need to fetch team name for ${teamId} - using fallback name`);
              }
            } catch (error) {
              console.error(`Error handling team name for ${teamId}:`, error);
            }
          }
        }
      }
      
      console.log(`Found conflicting initiative: ${conflictingInitiative} (Team ID: ${teamId || 'N/A'}, Team Name: ${teamName || 'Unknown'})`);
      
      // If we couldn't find a team ID in participation records,
      // we should try to find it from team membership records
      if (!teamId) {
        console.log("Team ID not found in participation records - will check team memberships");
        
        try {
          // Look up team membership for this contact
          const memberRecords = await membersTable.select({
            filterByFormula: `AND(SEARCH("${contactId}", ARRAYJOIN({Contact})), {Status}="Active")`,
            fields: ["Team", "Status", "Team Name"]
          }).firstPage();
          
          // Filter to active members with team
          const activeMembers = memberRecords.filter(member => {
            return member.fields.Team && member.fields.Team.length > 0;
          });
          
          if (activeMembers.length > 0) {
            // Get the first active team membership
            const firstMember = activeMembers[0];
            teamId = firstMember.fields.Team[0];
            teamName = firstMember.fields["Team Name"] || (conflictingInitiative ? `${conflictingInitiative} Team` : "Your Team");
            
            console.log(`Found team from member records: ${teamId} (${teamName})`);
          } else {
            console.log("No active team memberships found - using generic values");
            teamId = "unknown";
            teamName = conflictingInitiative ? `${conflictingInitiative} Team` : "Your Current Team";
          }
        } catch (error) {
          console.error("Error looking up team membership:", error);
          teamId = "unknown";
          teamName = conflictingInitiative ? `${conflictingInitiative} Team` : "Your Current Team";
        }
      }
      
      // Double-check that we have values for teamId and teamName
      if (!teamId) teamId = "unknown";
      if (!teamName) teamName = conflictingInitiative || "Your Current Team";
      
      return { 
        hasConflict: true, 
        conflictingInitiative,
        teamId,
        teamName
      };
    }
    
    // Return no conflict if we get here
    return { hasConflict: false };
  } catch (error) {
    console.error("Error checking initiative conflicts:", error);
    return { hasConflict: false };
  }
}

/**
 * Create a participation record for a user when they apply to a cohort
 * Only creates the record if initiative enrollment type is "Immediate"
 * @param {string} contactId - Airtable contact ID
 * @param {string} cohortId - Airtable cohort ID
 * @returns {Promise<Object>} Result of the operation
 */
export async function createParticipationRecord(contactId, cohortId) {
  try {
    if (!contactId || !cohortId || !participationTable || !cohortsTable || !initiativesTable) {
      console.error("Missing required parameters or tables for creating participation record");
      return { success: false, error: "Missing required parameters or tables" };
    }
    
    console.log(`Creating participation record for contact ${contactId} in cohort ${cohortId}`);
    
    // Get the cohort record
    const cohort = await cohortsTable.find(cohortId);
    
    if (!cohort || !cohort.fields.Initiative || !cohort.fields.Initiative.length) {
      console.error(`Cohort ${cohortId} not found or has no initiative`);
      return { success: false, error: "Cohort not found or has no initiative" };
    }
    
    const initiativeId = cohort.fields.Initiative[0];
    
    // Get the initiative record
    const initiative = await initiativesTable.find(initiativeId);
    
    if (!initiative) {
      console.error(`Initiative ${initiativeId} not found`);
      return { success: false, error: "Initiative not found" };
    }
    
    // Check enrollment type and initiative name
    const enrollmentType = initiative.fields["Enrollment Type"] || "Review";
    const initiativeName = initiative.fields.Name || "";
    console.log(`Initiative ${initiativeName} has enrollment type: ${enrollmentType}`);
    
    // Get participation type for additional checks
    const participationType = initiative.fields["Participation Type"] || "Individual";
    const isTeamBased = 
      participationType.toLowerCase().includes("team") ||
      participationType.toLowerCase() === "teams" ||
      participationType.toLowerCase() === "group" ||
      participationType.toLowerCase().includes("collaborative");
    
    // Check if this is Xperiment which requires approval
    const isXperiment = initiativeName.toLowerCase().includes("xperiment");
    
    // Skip participation record creation only in these cases:
    // 1. It's Xperiment (requires approval)
    // 2. It's a team join request (handled separately)
    // 3. Explicitly set to "Review" enrollment AND not a direct join program
    if (isXperiment) {
      console.log(`Skipping participation record creation - Xperiment requires approval`);
      return { 
        success: true, 
        created: false, 
        message: `Xperiment program requires approval - record will be created manually` 
      };
    }
    
    // For team-based programs, we should only auto-create participation if it's not a team join request
    // This is handled at the API level before calling this function
    
    // For all other programs, create participation record regardless of enrollment type
    // This is our new behavior - no application, just direct participation
    
    // Create the participation record
    const participationData = {
      'Contacts': [contactId],
      'Cohorts': [cohortId],
      'Capacity': 'Participant'
    };
    
    const newRecord = await participationTable.create(participationData);
    
    console.log(`Created new participation record: ${newRecord.id}`);
    
    return { 
      success: true, 
      created: true, 
      participationId: newRecord.id 
    };
  } catch (error) {
    console.error("Error creating participation record:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update team details
 * @param {string} teamId - Airtable team ID
 * @param {Object} data - Updated team data (name, description, image)
 * @returns {Promise<Object>} Updated team data
 */
export async function updateTeam(teamId, data) {
  try {
    if (!teamId) {
      console.error("Team ID is required to update team");
      throw new Error("Team ID is required");
    }
    
    // Get the Teams table ID from environment variables
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    if (!teamsTableId) {
      console.error("Teams table ID not configured");
      throw new Error("Teams table not configured");
    }
    
    // Initialize the teams table
    const teamsTable = base(teamsTableId);
    
    console.log(`Updating team ${teamId} with data:`, {
      name: data.name,
      description: data.description?.slice(0, 50) + (data.description?.length > 50 ? '...' : ''),
      hasImage: !!data.image
    });
    
    // Prepare team data
    const teamData = {};
    
    // Only add fields that are provided
    if (data.name) {
      teamData['Team Name'] = data.name.trim();
    }
    
    if (data.description !== undefined) {
      teamData['Description'] = data.description.trim();
    }
    
    // Handle image data if provided
    if (data.image && Array.isArray(data.image)) {
      console.log(`Adding image attachment to team ${teamId}`);
      teamData['Image'] = data.image.map(img => ({
        url: img.url,
        filename: img.filename || `team_image_${Date.now()}`
      }));
    }
    
    // Update the team record
    const updatedTeam = await teamsTable.update(teamId, teamData);
    
    // Extract image URL from the updated record if available
    const imageAttachments = updatedTeam.fields['Image'];
    const imageUrl = imageAttachments && imageAttachments.length > 0 
      ? imageAttachments[0].url 
      : null;
    
    return {
      id: updatedTeam.id,
      name: updatedTeam.fields['Team Name'] || updatedTeam.fields.Name || "",
      description: updatedTeam.fields.Description || "",
      image: imageUrl
    };
  } catch (error) {
    console.error("Error updating team:", error);
    throw new Error("Failed to update team: " + error.message);
  }
}

/**
 * Generate a secure random invitation token
 * @returns {string} A unique token for team invitations
 */
function generateInviteToken() {
  // Create a random string for the token using crypto API
  const randomBytes = new Uint8Array(32);
  
  // Fill with random values (works in both browser and Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for older Node.js environments
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(32);
    randomBytes.set(bytes);
  }
  
  // Convert to base64 and make URL-safe
  const base64 = Buffer.from(randomBytes).toString('base64');
  const urlSafe = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
    
  // Add a timestamp component for uniqueness
  const timestamp = Date.now().toString(36);
  
  return `${timestamp}-${urlSafe}`;
}

/**
 * Create a team invitation in Airtable
 * @param {Object} inviteData - The invitation data
 * @param {string} inviteData.email - Invitee's email address
 * @param {string} inviteData.firstName - Invitee's first name
 * @param {string} inviteData.lastName - Invitee's last name
 * @param {string} inviteData.teamId - Airtable team ID
 * @param {string} inviteData.memberId - Airtable member record ID
 * @param {string} inviteData.createdById - Airtable contact ID of the inviter
 * @param {number} inviteData.expiresInDays - Days until expiration (default: 7)
 * @returns {Promise<Object>} Created invitation data
 */
export async function createTeamInvitation(inviteData) {
  try {
    if (!invitesTable) {
      throw new Error("Invites table not configured. Please set AIRTABLE_INVITES_TABLE_ID environment variable.");
    }
    
    const {
      email,
      firstName,
      lastName,
      teamId,
      memberId,
      createdById,
      expiresInDays = 7,
    } = inviteData;
    
    // Validate required fields
    if (!email || !teamId || !memberId) {
      throw new Error("Missing required invitation data");
    }
    
    // Generate a unique token
    const token = generateInviteToken();
    
    // Calculate expiration date (default: 7 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    
    // Create the invitation record
    const inviteRecord = await invitesTable.create({
      'Invite Token': token,
      'Email': email.toLowerCase().trim(),
      'First Name': firstName || '',
      'Last Name': lastName || '',
      'Team': [teamId],
      'Member': [memberId],
      'Created By': createdById ? [createdById] : undefined,
      'Expiration Date': expirationDate.toISOString().split('T')[0], // YYYY-MM-DD format
      'Status': 'Pending',
      'Created At': new Date().toISOString()
    });
    
    // Return the created invitation data
    return {
      id: inviteRecord.id,
      token: inviteRecord.fields['Invite Token'],
      email: inviteRecord.fields['Email'],
      firstName: inviteRecord.fields['First Name'],
      lastName: inviteRecord.fields['Last Name'],
      teamId: inviteRecord.fields['Team'][0],
      memberId: inviteRecord.fields['Member'][0],
      expirationDate: inviteRecord.fields['Expiration Date'],
      status: inviteRecord.fields['Status']
    };
  } catch (error) {
    console.error("Error creating team invitation:", error);
    throw new Error(`Failed to create team invitation: ${error.message}`);
  }
}

/**
 * Get invitation details by token
 * @param {string} token - The invitation token
 * @returns {Promise<Object|null>} Invitation data or null if not found
 */
export async function getInvitationByToken(token) {
  try {
    if (!invitesTable) {
      throw new Error("Invites table not configured");
    }
    
    if (!token) {
      return null;
    }
    
    // Find the invitation with matching token
    const records = await invitesTable.select({
      filterByFormula: `{Invite Token} = "${token}"`,
      maxRecords: 1
    }).firstPage();
    
    if (!records || records.length === 0) {
      return null;
    }
    
    const invite = records[0];
    
    // Check if invitation has expired
    const expirationDate = new Date(invite.fields['Expiration Date']);
    const now = new Date();
    const isExpired = expirationDate < now;
    
    // If expired but not marked as such, update the status
    if (isExpired && invite.fields['Status'] !== 'Expired') {
      await invitesTable.update(invite.id, {
        'Status': 'Expired'
      });
      invite.fields['Status'] = 'Expired';
    }
    
    // Get team details if available
    let team = null;
    if (invite.fields['Team'] && invite.fields['Team'].length > 0) {
      try {
        const teamId = invite.fields['Team'][0];
        team = await getTeamById(teamId);
      } catch (error) {
        console.error("Error fetching team for invitation:", error);
      }
    }
    
    // Get member record if available
    let memberRecord = null;
    if (invite.fields['Member'] && invite.fields['Member'].length > 0) {
      try {
        const memberId = invite.fields['Member'][0];
        const membersTable = base(process.env.AIRTABLE_MEMBERS_TABLE_ID);
        const member = await membersTable.find(memberId);
        
        if (member) {
          memberRecord = {
            id: member.id,
            status: member.fields['Status'] || 'Unknown'
          };
        }
      } catch (error) {
        console.error("Error fetching member record for invitation:", error);
      }
    }
    
    // Return enhanced invitation data
    return {
      id: invite.id,
      token: invite.fields['Invite Token'],
      email: invite.fields['Email'],
      firstName: invite.fields['First Name'] || '',
      lastName: invite.fields['Last Name'] || '',
      teamId: invite.fields['Team'] ? invite.fields['Team'][0] : null,
      memberId: invite.fields['Member'] ? invite.fields['Member'][0] : null,
      expirationDate: invite.fields['Expiration Date'],
      status: invite.fields['Status'],
      isExpired,
      createdAt: invite.fields['Created At'],
      team,
      memberRecord
    };
  } catch (error) {
    console.error("Error getting invitation by token:", error);
    return null;
  }
}

/**
 * Accept a team invitation and update the member status
 * @param {string} token - The invitation token
 * @param {string} contactId - The contact ID of the user accepting the invitation
 * @returns {Promise<Object>} Result of the operation
 */
export async function acceptTeamInvitation(token, contactId) {
  try {
    if (!invitesTable) {
      throw new Error("Invites table not configured");
    }
    
    if (!token || !contactId) {
      throw new Error("Missing required parameters");
    }
    
    // Get the invitation
    const invitation = await getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    
    if (invitation.status === 'Expired') {
      throw new Error("This invitation has expired");
    }
    
    if (invitation.status === 'Accepted') {
      throw new Error("This invitation has already been accepted");
    }
    
    // Get the member table
    const membersTable = base(process.env.AIRTABLE_MEMBERS_TABLE_ID);
    
    if (!membersTable) {
      throw new Error("Members table not configured");
    }
    
    // Update the member record with the contact ID and status
    await membersTable.update(invitation.memberId, {
      'Contact': [contactId],
      'Status': 'Active'
    });
    
    // Update the invitation status
    await invitesTable.update(invitation.id, {
      'Status': 'Accepted'
    });
    
    // Return the updated invitation with team
    return {
      success: true,
      invitation: {
        ...invitation,
        status: 'Accepted'
      }
    };
  } catch (error) {
    console.error("Error accepting team invitation:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Updates user's onboarding status in Airtable
 * @param {string} contactId - Airtable contact ID
 * @param {string} status - Onboarding status ("Registered" or "Applied")
 * @returns {Promise<Object>} Updated user data
 */
export async function updateOnboardingStatus(contactId, status) {
  try {
    if (!contactId) {
      throw new Error("Contact ID is required to update onboarding status");
    }
    
    // Validate the status
    const validStatuses = ["Registered", "Applied"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid onboarding status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    }
    
    console.log(`Updating onboarding status for contact ${contactId} to: ${status}`);
    
    // Update the contact record with the new onboarding status
    const updatedContact = await contactsTable.update(contactId, {
      "Onboarding": status
    });
    
    return {
      contactId: updatedContact.id,
      onboardingStatus: updatedContact.fields.Onboarding || null,
      success: true
    };
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user's onboarding status from Airtable
 * @param {string} contactId - Airtable contact ID
 * @returns {Promise<Object>} Onboarding status data
 */
export async function getOnboardingStatus(contactId) {
  try {
    if (!contactId) {
      throw new Error("Contact ID is required to get onboarding status");
    }
    
    // Get the contact record
    const contact = await contactsTable.find(contactId);
    
    if (!contact) {
      throw new Error(`Contact not found with ID: ${contactId}`);
    }
    
    // Extract onboarding status
    const onboardingStatus = contact.fields.Onboarding || null;
    
    // If no status is set but user exists, default to "Registered"
    const normalizedStatus = onboardingStatus || "Registered";
    
    // Check if user has completed onboarding (Applied status)
    const completed = normalizedStatus === "Applied";
    
    return {
      status: normalizedStatus,
      completed,
      contactId
    };
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return {
      status: null,
      completed: false,
      error: error.message
    };
  }
}

export default {
  getUserProfile,
  getInstitution,
  getEducation,
  getProgram,
  getAllPrograms,
  getInitiative,
  getTopic,
  getClass,
  getCohortsByInstitution,
  updateUserProfile,
  getUserTeams,
  getTeamById,
  updateTeam,
  lookupInstitutionByEmail,
  checkInitiativeConflicts,
  createParticipationRecord,
  createTeamInvitation,
  getInvitationByToken,
  acceptTeamInvitation,
  updateOnboardingStatus,
  getOnboardingStatus,
  getParticipationRecords
}