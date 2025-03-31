import { getEducationTable, getContactsTable } from '../tables';
import { executeQuery } from '../core/client';
import { 
  createCacheKey, 
  getCachedOrFetch, 
  clearCacheByType,
  CACHE_TYPES 
} from '../core/cache';
import { handleAirtableError } from '../core/errors';

/**
 * Fetches education record by ID without caching
 * @param {string} educationId Education record ID
 * @returns {Promise<Object|null>} Education record or null if not found
 */
export async function fetchEducation(educationId) {
  try {
    if (!educationId) {
      return null;
    }
    
    console.log(`Fetching education record: ${educationId}`);
    
    const educationTable = getEducationTable();
    
    // Fetch the education record
    const record = await executeQuery(() => 
      educationTable.find(educationId)
    );
    
    if (!record) {
      return null;
    }
    
    return {
      id: record.id,
      ...record.fields,
      // Add standardized fields
      degreeType: record.fields["Degree Type"],
      major: record.fields.Major,
      majorName: record.fields["Major (from Major)"],
      graduationYear: record.fields["Graduation Year"],
      graduationSemester: record.fields["Graduation Semester"],
      institution: record.fields.Institution,
      institutionName: record.fields["Name (from Institution)"],
      // Timestamp for caching purposes
      lastFetched: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'fetching education record', { educationId });
  }
}

/**
 * Gets education record by ID with caching
 * @param {string} educationId Education record ID
 * @param {Object} options Cache options
 * @returns {Promise<Object|null>} Education record or null if not found
 */
export async function getEducation(educationId, options = {}) {
  if (!educationId) return null;
  
  const cacheKey = createCacheKey(CACHE_TYPES.EDUCATION, educationId);
  
  return getCachedOrFetch(
    cacheKey,
    () => fetchEducation(educationId),
    options.ttl || 3600 // 1 hour cache by default (education data changes infrequently)
  );
}

/**
 * Updates or creates an education record
 * @param {Object} data Education data to update
 * @param {string} data.educationId Optional existing education record ID
 * @param {string} data.contactId Contact ID this education is linked to
 * @param {string} data.institutionId Institution ID
 * @param {string} data.degreeType Degree type
 * @param {string} data.major Major ID
 * @param {string|number} data.graduationYear Graduation year
 * @param {string} data.graduationSemester Graduation semester
 * @returns {Promise<Object>} Updated or created education record
 */
export async function updateEducation(data) {
  try {
    const { educationId, contactId, institutionId, ...educationData } = data;
    
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    console.log(`${educationId ? 'Updating' : 'Creating'} education record for contact: ${contactId}`);
    
    const educationTable = getEducationTable();
    const contactsTable = getContactsTable();
    
    // Prepare the data for Airtable
    const recordData = {
      // Link to the contact
      "Contact": [contactId],
      // Link to institution if provided
      ...(institutionId ? { "Institution": [institutionId] } : {}),
      // Education details
      "Degree Type": educationData.degreeType,
      "Graduation Year": educationData.graduationYear,
      "Graduation Semester": educationData.graduationSemester,
      // Link to major if provided
      ...(educationData.major ? { "Major": [educationData.major] } : {}),
    };
    
    let educationRecord;
    
    if (educationId) {
      // Update existing record
      educationRecord = await executeQuery(() => 
        educationTable.update(educationId, recordData)
      );
    } else {
      // Create new record
      educationRecord = await executeQuery(() => 
        educationTable.create(recordData)
      );
      
      // Link the new education record to the contact
      await executeQuery(() => 
        contactsTable.update(contactId, {
          "Education": [educationRecord.id]
        })
      );
    }
    
    // Clear caches
    clearCacheByType(CACHE_TYPES.EDUCATION, educationId);
    clearCacheByType(CACHE_TYPES.PROFILE, contactId);
    
    return {
      id: educationRecord.id,
      ...educationRecord.fields,
      // Add standardized fields
      degreeType: educationRecord.fields["Degree Type"],
      graduationYear: educationRecord.fields["Graduation Year"],
      graduationSemester: educationRecord.fields["Graduation Semester"],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw handleAirtableError(error, 'updating education record', { 
      educationId: data.educationId,
      contactId: data.contactId 
    });
  }
}

export default {
  fetchEducation,
  getEducation,
  updateEducation
};