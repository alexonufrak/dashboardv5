import { getContactsTable } from '../tables';
import { executeQuery } from '../core/client';
import { 
  createCacheKey, 
  getCachedOrFetch, 
  clearCacheByType,
  CACHE_TYPES 
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches a user by Auth0 ID without caching
 * @param {string} auth0Id Auth0 user ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function fetchUserByAuth0Id(auth0Id) {
  try {
    if (!auth0Id) {
      return null;
    }
    
    console.log(`Looking up user with Auth0 ID: ${auth0Id}`);
    
    // First try to get the record ID from cache if available
    const recordIdCacheKey = createCacheKey(CACHE_TYPES.PROFILE, `auth0_to_record_${auth0Id}`);
    let recordId = null;
    
    try {
      // Try to get cached record ID mapping
      recordId = await getCachedOrFetch(recordIdCacheKey, () => null, 0);
      console.log(`Cache lookup for Auth0 ID ${auth0Id}: ${recordId ? 'Found record ID' : 'No record ID'}`);
    } catch (cacheErr) {
      console.error('Cache lookup error:', cacheErr);
    }
    
    // If we have a cached record ID, use direct record lookup (most reliable)
    if (recordId) {
      try {
        const users = await getUsersByRecordIds([recordId]);
        if (users.length > 0) {
          console.log(`Successfully fetched user by direct record ID: ${recordId}`);
          return users[0];
        } else {
          console.log(`Record ID ${recordId} no longer exists, falling back to formula search`);
        }
      } catch (recordErr) {
        console.error('Error fetching by record ID:', recordErr);
        // Continue to formula search as fallback
      }
    }
    
    // Fallback to traditional formula-based search (less reliable with special chars)
    const contactsTable = getContactsTable();
    
    // Escape special characters in Auth0 ID to prevent formula syntax errors
    const escapedAuth0Id = auth0Id.replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    // Look for contact linked to this Auth0 ID
    // Use SEARCH() instead of direct equality for better handling of special characters
    const records = await executeQuery(() => 
      contactsTable
        .select({
          filterByFormula: `SEARCH("${escapedAuth0Id}", {Auth0 ID})`,
          maxRecords: 1,
          fields: [
            "Email", "First Name", "Last Name",
            "Onboarding", "Participation", "Education",
            "Headshot", "Degree Type (from Education)", 
            "Major (from Education)", "Institution (from Education)",
            "Graduation Year (from Education)", "Graduation Semester (from Education)",
            "Referral Source", "Auth0 ID", 
            "Cohorts (from Participation)",
            "Education"
          ],
        })
        .firstPage()
    );
    
    console.log(`Auth0 ID lookup result: ${records?.length || 0} records found`);
    
    if (!records || records.length === 0) {
      return null;
    }
    
    // Cache the record ID for future use
    try {
      const newRecordId = records[0].id;
      getCachedOrFetch(recordIdCacheKey, () => newRecordId, 86400); // Cache for 24 hours
      console.log(`Cached mapping from Auth0 ID ${auth0Id} to record ID ${newRecordId}`);
    } catch (cacheErr) {
      console.error('Error caching record ID:', cacheErr);
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
      // Get cohorts from the Participation lookup field
      cohorts: records[0].fields["Cohorts (from Participation)"] || [],
      // Get education record ID for later fetching the institution
      education: records[0].fields.Education || [],
      // Timestamp for caching purposes
      lastFetched: new Date().toISOString()
    };
    
    return user;
  } catch (error) {
    throw handleAirtableError(error, 'fetching user by Auth0 ID', { auth0Id });
  }
}

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
            // Removed problematic field that no longer exists in Airtable schema
            "Referral Source", "Auth0 ID", 
            // "Cohorts" field doesn't exist, it's "Cohorts (from Participation)" based on schema
            "Cohorts (from Participation)",
            // Education is the linked record that contains institution data
            // There's no direct "Institution" field on Contacts, that comes from Education
            "Education"
            // "Programs" field doesn't exist in the Contacts table
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
      auth0Id: records[0].fields["Auth0 ID"],
      // Get cohorts from the Participation lookup field
      cohorts: records[0].fields["Cohorts (from Participation)"] || [],
      // Get education record ID for later fetching the institution
      education: records[0].fields.Education || [],
      // Timestamp for caching purposes
      lastFetched: new Date().toISOString()
    };
    
    return user;
  } catch (error) {
    throw handleAirtableError(error, 'fetching user by email', { email });
  }
}

/**
 * Gets a user by Auth0 ID with caching
 * @param {string} auth0Id Auth0 user ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByAuth0Id(auth0Id, options = {}) {
  if (!auth0Id) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.PROFILE, auth0Id);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchUserByAuth0Id(auth0Id),
    options.ttl || 300 // 5 minutes cache by default
  );
}

/**
 * Gets a user by email with caching
 * @param {string} email User email address
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email, options = {}) {
  if (!email) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.PROFILE, email);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchUserByEmail(email),
    options.ttl || 300 // 5 minutes cache by default
  );
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
    
    console.log(`Updating profile for contact ID: ${contactId}`);
    
    // Extract only fields we allow to update directly on contact
    const updateData = {
      // Map between our API field names and Airtable field names
      "First Name": data.firstName,
      "Last Name": data.lastName,
      "Referral Source": data.referralSource,
    };
    
    const contactsTable = getContactsTable();
    
    // Update the contact in Airtable
    const updatedRecord = await executeQuery(() => 
      contactsTable.update(contactId, updateData)
    );
    
    // Handle education-related fields (degree type, institution, graduation year, etc.)
    // These need to be updated in the Education table, not directly on the Contact
    if (data.institutionId || data.degreeType || data.graduationYear || 
        data.graduationSemester || data.major) {
      
      try {
        // Import the education entity module for updating education records
        const { updateEducation } = await import('./education');
        
        // Create education data object for the update
        const educationData = {
          contactId,
          educationId: data.educationId, // Pass through if provided
          institutionId: data.institutionId,
          degreeType: data.degreeType,
          graduationYear: data.graduationYear,
          graduationSemester: data.graduationSemester,
          major: data.major
        };
        
        console.log("Updating related education record:", educationData);
        
        // Update or create the education record
        await updateEducation(educationData);
      } catch (educationError) {
        console.error("Error updating education record:", educationError);
        // We'll continue since the contact update was successful
      }
    }
    
    // Clear cache for this user to ensure fresh data on next fetch
    // We need to clear both by ID and by email since they could access from either
    if (updatedRecord.fields["Auth0 ID"]) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields["Auth0 ID"]);
    }
    if (updatedRecord.fields.Email) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields.Email.toLowerCase());
    }
    
    // Prepare the base return object with contact fields
    const returnData = {
      contactId: updatedRecord.id,
      ...updatedRecord.fields,
      // Add processed properties
      firstName: updatedRecord.fields["First Name"],
      lastName: updatedRecord.fields["Last Name"],
      email: updatedRecord.fields.Email,
      // Ensure we include education record IDs for further processing
      education: updatedRecord.fields.Education || [],
      // Ensure cohorts are included if available
      cohorts: updatedRecord.fields["Cohorts (from Participation)"] || [],
      lastUpdated: new Date().toISOString()
    };
    
    return returnData;
  } catch (error) {
    throw handleAirtableError(error, 'updating user profile', { contactId });
  }
}

/**
 * Updates a user's onboarding status
 * @param {string} contactId Airtable contact ID
 * @param {string} status New onboarding status
 * @returns {Promise<Object>} Updated user
 */
export async function updateOnboardingStatus(contactId, status) {
  try {
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    console.log(`Updating onboarding status for contact ID: ${contactId} to "${status}"`);
    
    const contactsTable = getContactsTable();
    
    // Update the contact in Airtable
    const updatedRecord = await executeQuery(() => 
      contactsTable.update(contactId, {
        "Onboarding": status
      })
    );
    
    // Clear cache for this user
    if (updatedRecord.fields["Auth0 ID"]) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields["Auth0 ID"]);
    }
    if (updatedRecord.fields.Email) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields.Email.toLowerCase());
    }
    
    // Return the updated record
    return {
      success: true,
      contactId: updatedRecord.id,
      onboardingStatus: updatedRecord.fields.Onboarding || status,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'updating user onboarding status', { contactId, status });
  }
}

/**
 * Checks if a user exists by email
 * @param {string} email User email
 * @returns {Promise<boolean>} True if user exists
 */
export async function checkUserExists(email) {
  try {
    const user = await getUserByEmail(email);
    return !!user;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
}

/**
 * Get complete user profile with all related data
 * @param {Object} auth0User Auth0 user object
 * @param {Object} options Options for profile fetching
 * @returns {Promise<Object>} Complete user profile
 */
export async function getCompleteProfile(auth0User, options = {}) {
  try {
    // Extract basic profile data from Auth0
    const basicProfile = {
      auth0Id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
      picture: auth0User.picture,
    };

    // First try to fetch profile by email (more reliable than Auth0 ID lookup)
    let profile = null;
    
    if (auth0User.email) {
      profile = await getUserByEmail(auth0User.email);
    }
    
    // Fallback to Auth0 ID lookup if email lookup failed
    if (!profile && auth0User.sub) {
      profile = await getUserByAuth0Id(auth0User.sub);
    }
    
    // Store user_record_id in cache if found for future direct lookups
    if (profile && profile.contactId) {
      // Cache the mapping between Auth0 ID and record ID for future use
      const cacheKey = createCacheKey(CACHE_TYPES.PROFILE, `auth0_to_record_${auth0User.sub}`);
      getCachedOrFetch(cacheKey, () => profile.contactId, 86400); // Cache for 24 hours
    }
    
    // If we don't have a profile, return the basic info
    if (!profile) {
      return {
        ...basicProfile,
        isProfileComplete: false,
        isOnboardingComplete: false
      };
    }

    // Determine if onboarding is completed
    const isOnboardingComplete = profile.onboardingStatus === "Applied" || profile.hasParticipation;
    
    // Get minimal profile if requested (for faster loading)
    if (options.minimal) {
      return {
        ...basicProfile,
        ...profile,
        isOnboardingComplete,
        lastUpdated: new Date().toISOString()
      };
    }

    // Let's enhance the profile with proper entity relationships
    // If we need more detailed data but not in minimal mode, we can fetch education record
    const enhancedProfile = {
      ...basicProfile,
      ...profile,
      isOnboardingComplete,
      lastUpdated: new Date().toISOString()
    };
    
    // The Education field contains the IDs to education records
    // The Institution field is a property of the Education record, not directly on the Contact
    // This design follows proper domain-driven design with distinct entities and relationships
    
    return enhancedProfile;
  } catch (error) {
    console.error("Error getting complete profile:", error);
    throw error;
  }
}

/**
 * Fetch users by direct record IDs - more reliable than formula filtering
 * @param {string[]} recordIds Array of Airtable record IDs to fetch
 * @returns {Promise<Array>} Array of user records
 */
export async function getUsersByRecordIds(recordIds) {
  try {
    if (!recordIds || recordIds.length === 0) {
      return [];
    }

    const contactsTable = getContactsTable();
    
    // Batch fetch by IDs (much more reliable than formula filtering)
    const records = await Promise.all(
      recordIds.map(id => 
        executeQuery(() => contactsTable.find(id))
          .catch(err => {
            console.error(`Error fetching record ID ${id}:`, err);
            return null;
          })
      )
    );
    
    // Filter out any failed fetches and transform to consistent format
    const users = records
      .filter(record => record !== null)
      .map(record => ({
        contactId: record.id,
        ...record.fields,
        // Add processed properties
        firstName: record.fields["First Name"],
        lastName: record.fields["Last Name"],
        email: record.fields.Email,
        onboardingStatus: record.fields.Onboarding || "Registered",
        hasParticipation: Boolean(
          record.fields.Participation && 
          record.fields.Participation.length > 0
        ),
        auth0Id: record.fields["Auth0 ID"],
        // Get cohorts from the Participation lookup field
        cohorts: record.fields["Cohorts (from Participation)"] || [],
        // Get education record ID for later fetching the institution
        education: record.fields.Education || [],
        // Timestamp for caching purposes
        lastFetched: new Date().toISOString()
      }));
    
    return users;
  } catch (error) {
    throw handleAirtableError(error, 'fetching users by record IDs', { recordIds });
  }
}

/**
 * Gets a user by record ID with caching
 * @param {string} recordId Airtable record ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByRecordId(recordId, options = {}) {
  if (!recordId) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.PROFILE, `record_${recordId}`);
  
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const users = await getUsersByRecordIds([recordId]);
      return users.length > 0 ? users[0] : null;
    },
    options.ttl || 300 // 5 minutes cache by default
  );
}

export default {
  fetchUserByAuth0Id,
  fetchUserByEmail,
  getUserByAuth0Id,
  getUserByEmail,
  getUsersByRecordIds,
  getUserByRecordId,
  updateUserProfile,
  updateOnboardingStatus,
  checkUserExists,
  getCompleteProfile
};