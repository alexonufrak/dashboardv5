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
    
    const contactsTable = getContactsTable();
    
    // Look for contact linked to this Auth0 ID
    const records = await executeQuery(() => 
      contactsTable
        .select({
          filterByFormula: `{Auth0ID}="${auth0Id}"`,
          maxRecords: 1,
          fields: [
            "Email", "First Name", "Last Name",
            "Onboarding", "Participation", "Education",
            "Headshot", "Degree Type (from Education)", 
            "Major (from Education)", "Institution (from Education)",
            "Graduation Year (from Education)", "Graduation Semester (from Education)",
            // Removed problematic field that no longer exists in Airtable schema
            "Referral Source", "Auth0ID"
          ],
        })
        .firstPage()
    );
    
    console.log(`Auth0 ID lookup result: ${records?.length || 0} records found`);
    
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
            "Referral Source", "Auth0ID"
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
      auth0Id: records[0].fields.Auth0ID,
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
    
    // Extract only fields we allow to update
    const updateData = {
      // Map between our API field names and Airtable field names
      "First Name": data.firstName,
      "Last Name": data.lastName,
      "Referral Source": data.referralSource,
      // Institution and education-related fields are handled differently
      // as they may require updates to related tables
    };
    
    // Handle degree information updates if provided
    if (data.degreeType) {
      updateData["Degree Type"] = data.degreeType;
    }
    
    // Handle graduation information if provided
    if (data.graduationYear !== undefined) {
      updateData["Graduation Year"] = data.graduationYear;
    }
    
    if (data.graduationSemester) {
      updateData["Graduation Semester"] = data.graduationSemester;
    }
    
    const contactsTable = getContactsTable();
    
    // Update the contact in Airtable
    const updatedRecord = await executeQuery(() => 
      contactsTable.update(contactId, updateData)
    );
    
    // Clear cache for this user to ensure fresh data on next fetch
    // We need to clear both by ID and by email since they could access from either
    if (updatedRecord.fields.Auth0ID) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields.Auth0ID);
    }
    if (updatedRecord.fields.Email) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields.Email.toLowerCase());
    }
    
    // Return the updated record
    return {
      contactId: updatedRecord.id,
      ...updatedRecord.fields,
      // Add processed properties
      firstName: updatedRecord.fields["First Name"],
      lastName: updatedRecord.fields["Last Name"],
      email: updatedRecord.fields.Email,
      lastUpdated: new Date().toISOString()
    };
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
export async function updateUserOnboarding(contactId, status) {
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
    if (updatedRecord.fields.Auth0ID) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields.Auth0ID);
    }
    if (updatedRecord.fields.Email) {
      clearCacheByType(CACHE_TYPES.PROFILE, updatedRecord.fields.Email.toLowerCase());
    }
    
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

export default {
  fetchUserByAuth0Id,
  fetchUserByEmail,
  getUserByAuth0Id,
  getUserByEmail,
  updateUserProfile,
  updateUserOnboarding,
  checkUserExists
};