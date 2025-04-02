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
    const escapedAuth0Id = auth0Id.replace(/([\\'\"])/g, "\\$1");
    
    // Look for contact linked to this Auth0 ID
    // Use FIND() instead of SEARCH() for more reliable matching with special characters
    const records = await executeQuery(() => 
      contactsTable
        .select({
          filterByFormula: `FIND("${escapedAuth0Id}", {Auth0 ID}) > 0`,
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
  
  // First try to find user by direct record ID if we've previously found one
  try {
    const recordIdCacheKey = createCacheKey(CACHE_TYPES.PROFILE, `auth0_to_record_${auth0Id}`);
    const recordId = await getCachedOrFetch(recordIdCacheKey, () => null, 0);
    
    if (recordId) {
      console.log(`Using cached record ID ${recordId} for Auth0 ID ${auth0Id}`);
      const user = await getUserByRecordId(recordId);
      if (user) {
        // Update the main cache too
        getCachedOrFetch(cacheKey, () => user, options.ttl || 300);
        return user;
      }
    }
  } catch (error) {
    console.error('Error checking for cached record ID:', error);
  }
  
  // Fall back to traditional Auth0 ID lookup
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
    let contactId = null;
    
    if (auth0User.email) {
      const normalizedEmail = auth0User.email.toLowerCase().trim();
      console.log(`Looking up user with normalized email: ${normalizedEmail}`);
      
      // Try direct email lookup first
      profile = await getUserByEmail(auth0User.email);
      
      // If direct lookup fails, try to find via linked records using email
      if (!profile) {
        try {
          // Get the direct contacts table to look up by email
          const contactsTable = getContactsTable();
          
          // Try to find the contact directly by email (most reliable method)
          const records = await executeQuery(() => 
            contactsTable
              .select({
                filterByFormula: `LOWER({Email})="${normalizedEmail}"`,
                maxRecords: 1
              })
              .firstPage()
          );
          
          console.log(`Email lookup result: ${records?.length || 0} records found`);
          
          if (records && records.length > 0) {
            contactId = records[0].id;
            console.log(`Found contact record with ID: ${contactId}`);
            
            // Get the full user record
            profile = await getUserByRecordId(contactId);
          } else {
            // As a fallback, try linked records
            profile = await findUserViaLinkedRecords(auth0User.email);
          }
        } catch (err) {
          console.error("Error finding user by email:", err);
        }
      }
    }
    
    // Fallback to Auth0 ID lookup if email lookup failed
    if (!profile && auth0User.sub) {
      profile = await getUserByAuth0Id(auth0User.sub);
    }
    
    // Store user_record_id in cache if found for future direct lookups
    if (profile && profile.contactId && auth0User.sub) {
      // Cache the mapping between Auth0 ID and record ID for future use
      const cacheKey = createCacheKey(CACHE_TYPES.PROFILE, `auth0_to_record_${auth0User.sub}`);
      getCachedOrFetch(cacheKey, () => profile.contactId, 86400); // Cache for 24 hours
    }
    
    // If we still don't have a profile, return the basic info
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

    // Enhanced profile with applications data from Contact foreign key relationship
    const enhancedProfile = {
      ...basicProfile,
      ...profile,
      isOnboardingComplete,
      lastUpdated: new Date().toISOString()
    };
    
    // Only fetch applications if needed and not minimal mode
    if (!options.skipApplications && profile.contactId) {
      try {
        // fetchApplicationsByContactId now handles errors internally and returns empty array on error
        // This prevents the error from propagating up and breaking the entire profile fetch
        const applications = await fetchApplicationsByContactId(profile.contactId);
        enhancedProfile.applications = applications || [];
        enhancedProfile.hasApplications = Array.isArray(applications) && applications.length > 0;
      } catch (appErr) {
        // This is an extra safety measure in case fetchApplicationsByContactId doesn't handle all errors
        console.error("Error fetching user applications in getCompleteProfile:", appErr);
        enhancedProfile.applications = [];
        enhancedProfile.hasApplications = false;
      }
    }
    
    return enhancedProfile;
  } catch (error) {
    console.error("Error getting complete profile:", error);
    throw error;
  }
}

/**
 * Find a user by traversing linked record paths when direct lookup fails
 * @param {string} email User's email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserViaLinkedRecords(email) {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Import the getTable function directly from definitions
  // This avoids dynamic import issues with the re-exports
  const { getTable } = await import('../tables/definitions');
  
  // Define table IDs directly
  const TABLE_IDS = {
    APPLICATIONS: process.env.AIRTABLE_APPLICATIONS_TABLE_ID || 'tblbPiD3CRtXqZOG5',
    MEMBERS: process.env.AIRTABLE_MEMBERS_TABLE_ID || 'tblNrGg8e8lPcEKnL',
    ATTENDANCE: process.env.AIRTABLE_ATTENDANCE_TABLE_ID || 'tblwIIm1BLm0XbsQe',
    CONTACTS: process.env.AIRTABLE_CONTACTS_TABLE_ID || 'tbl4zBRLQpBaKSY11'
  };
  
  let contactId = null;
  
  // Try Applications table first (Applications → Contact)
  try {
    const applicationsTable = getTable(TABLE_IDS.APPLICATIONS);
    const applications = await executeQuery(() => 
      applicationsTable.select({
        filterByFormula: `LOWER({Email})="${normalizedEmail}"`,
        maxRecords: 1,
        fields: ["Contact", "Email"]
      }).firstPage()
    );
    
    if (applications && applications.length > 0 && applications[0].fields.Contact?.[0]) {
      contactId = applications[0].fields.Contact[0];
      console.log(`Found user via Applications table, Contact ID: ${contactId}`);
      // Get the full contact record
      const contactsTable = getTable(TABLE_IDS.CONTACTS);
      const contact = await executeQuery(() => contactsTable.find(contactId));
      
      if (contact) {
        return {
          contactId: contact.id,
          ...contact.fields,
          firstName: contact.fields["First Name"],
          lastName: contact.fields["Last Name"],
          email: contact.fields.Email,
          onboardingStatus: contact.fields.Onboarding || "Registered",
          hasParticipation: Boolean(
            contact.fields.Participation && 
            contact.fields.Participation.length > 0
          ),
          auth0Id: contact.fields["Auth0 ID"],
          cohorts: contact.fields["Cohorts (from Participation)"] || [],
          education: contact.fields.Education || [],
          lastFetched: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error("Error finding user via Applications:", err);
  }
  
  // Try Members table next (Teams → Members → Contact)
  if (!contactId) {
    try {
      const membersTable = getTable(TABLE_IDS.MEMBERS);
      const members = await executeQuery(() => 
        membersTable.select({
          filterByFormula: `LOWER({Email (from Contact)})="${normalizedEmail}"`,
          maxRecords: 1,
          fields: ["Contact", "Email (from Contact)"] 
        }).firstPage()
      );
      
      if (members && members.length > 0 && members[0].fields.Contact?.[0]) {
        contactId = members[0].fields.Contact[0];
        console.log(`Found user via Members table, Contact ID: ${contactId}`);
        
        // Get the full contact record
        const contactsTable = getTable(TABLE_IDS.CONTACTS);
        const contact = await executeQuery(() => contactsTable.find(contactId));
        
        if (contact) {
          return {
            contactId: contact.id,
            ...contact.fields,
            firstName: contact.fields["First Name"],
            lastName: contact.fields["Last Name"],
            email: contact.fields.Email,
            onboardingStatus: contact.fields.Onboarding || "Registered",
            hasParticipation: Boolean(
              contact.fields.Participation && 
              contact.fields.Participation.length > 0
            ),
            auth0Id: contact.fields["Auth0 ID"],
            cohorts: contact.fields["Cohorts (from Participation)"] || [],
            education: contact.fields.Education || [],
            lastFetched: new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.error("Error finding user via Members:", err);
    }
  }
  
  // Try Attendance table as a last resort (Events → Attendance → Contacts)
  if (!contactId) {
    try {
      const attendanceTable = getTable(TABLE_IDS.ATTENDANCE);
      const attendanceRecords = await executeQuery(() => 
        attendanceTable.select({
          filterByFormula: `LOWER({Email})="${normalizedEmail}"`,
          maxRecords: 1,
          fields: ["Contacts", "Email"]
        }).firstPage()
      );
      
      if (attendanceRecords && attendanceRecords.length > 0 && attendanceRecords[0].fields.Contacts?.[0]) {
        contactId = attendanceRecords[0].fields.Contacts[0];
        console.log(`Found user via Attendance table, Contact ID: ${contactId}`);
        
        // Get the full contact record
        const contactsTable = getTable(TABLE_IDS.CONTACTS);
        const contact = await executeQuery(() => contactsTable.find(contactId));
        
        if (contact) {
          return {
            contactId: contact.id,
            ...contact.fields,
            firstName: contact.fields["First Name"],
            lastName: contact.fields["Last Name"],
            email: contact.fields.Email,
            onboardingStatus: contact.fields.Onboarding || "Registered",
            hasParticipation: Boolean(
              contact.fields.Participation && 
              contact.fields.Participation.length > 0
            ),
            auth0Id: contact.fields["Auth0 ID"],
            cohorts: contact.fields["Cohorts (from Participation)"] || [],
            education: contact.fields.Education || [],
            lastFetched: new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.error("Error finding user via Attendance:", err);
    }
  }
  
  return null;
}

/**
 * Fetch applications by contact ID using the foreign key relationship
 * @param {string} contactId Contact's record ID
 * @returns {Promise<Array>} Array of application records
 */
async function fetchApplicationsByContactId(contactId) {
  if (!contactId) return [];
  
  try {
    // Use the table definitions directly instead of dynamic imports
    // This avoids potential bundling issues with dynamic imports
    const { getTable } = await import('../tables/definitions');
    
    // Get the applications table by its ID
    const TABLE_IDS = {
      APPLICATIONS: process.env.AIRTABLE_APPLICATIONS_TABLE_ID || 'tblbPiD3CRtXqZOG5'
    };
    
    const applicationsTable = getTable(TABLE_IDS.APPLICATIONS);
    
    if (!applicationsTable) {
      console.error('Failed to get Applications table');
      return [];
    }
    
    // Query applications where Contact field contains contactId
    // Use a safer approach with equality instead of FIND when possible
    const applications = await executeQuery(() => 
      applicationsTable.select({
        filterByFormula: `OR(
          {Contact}="${contactId}", 
          AND(
            NOT(ISERROR(FIND("${contactId}", ARRAYJOIN({Contact}, ",")))),
            FIND("${contactId}", ARRAYJOIN({Contact}, ",")) > 0
          )
        )`,
        fields: [
          "Status", "Cohort", "cohortShortName", "Initiative (from Cohort)",
          "Email", "First Name", "Last Name",
          "Institution", "Major", "Graduation Year", "Graduation Semester",
          "Resume", "Unofficial Transcript"
        ]
      }).firstPage()
    );
    
    console.log(`Found ${applications?.length || 0} applications for contact ID ${contactId}`);
    
    // Handle case where applications might be undefined
    if (!applications || !Array.isArray(applications)) {
      console.warn(`Invalid applications result for contact ID ${contactId}`);
      return [];
    }
    
    // Process applications to return a clean array of application objects
    return applications.map(record => ({
      applicationId: record.id,
      ...record.fields,
      cohort: record.fields.cohortShortName?.[0] || null,
      initiative: record.fields["Initiative (from Cohort)"]?.[0] || null,
      institution: record.fields.Institution?.[0] || null,
      major: record.fields.Major?.[0] || null,
      hasResume: Boolean(record.fields.Resume?.length),
      hasTranscript: Boolean(record.fields["Unofficial Transcript"]?.length)
    }));
  } catch (error) {
    console.error('Error fetching applications by contact ID:', error);
    // Return empty array instead of throwing error to prevent breaking the entire profile
    console.log('Returning empty applications array to prevent breaking the profile');
    return [];
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

/**
 * Backward-compatibility adapter function for getUserProfile
 * 
 * This function provides backward compatibility for API routes that 
 * still use the old getUserProfile function name. It internally redirects
 * to getUserByAuth0Id which is the new equivalent function.
 * 
 * @param {string} auth0Id - Auth0 user ID
 * @returns {Promise<Object|null>} User profile data or null if not found
 */
export function getUserProfile(auth0Id) {
  console.log(`Using compatibility getUserProfile adapter for Auth0 ID: ${auth0Id}`);
  return getUserByAuth0Id(auth0Id);
}

// Make the helper functions non-exported but still accessible via the default export
export default {
  // Original functions
  fetchUserByAuth0Id,
  fetchUserByEmail,
  getUserByAuth0Id,
  getUserByEmail,
  getUsersByRecordIds,
  getUserByRecordId,
  updateUserProfile,
  updateOnboardingStatus,
  checkUserExists,
  getCompleteProfile,
  
  // Backward compatibility
  getUserProfile,
  
  // New linked record helpers
  findUserViaLinkedRecords,
  fetchApplicationsByContactId,
  
  // High-level user lookup function
  findUserByAnyIdentifier: async (identifiers) => {
    // Try direct record ID lookup (fastest)
    if (identifiers.contactId) {
      const user = await getUserByRecordId(identifiers.contactId);
      if (user) return user;
    }
    
    // Try email lookup (reliable)
    if (identifiers.email) {
      // Direct email lookup
      const user = await getUserByEmail(identifiers.email);
      if (user) return user;
      
      // Try linked record paths
      const linkedUser = await findUserViaLinkedRecords(identifiers.email);
      if (linkedUser) return linkedUser;
    }
    
    // Try Auth0 ID lookup (least reliable)
    if (identifiers.auth0Id) {
      return getUserByAuth0Id(identifiers.auth0Id);
    }
    
    return null;
  }
};