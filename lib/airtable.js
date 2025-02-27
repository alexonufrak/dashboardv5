import Airtable from "airtable"

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

// Tables
const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID)
const institutionsTable = base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID)
const educationTable = base(process.env.AIRTABLE_EDUCATION_TABLE_ID)
const majorsTable = base(process.env.AIRTABLE_MAJORS_TABLE_ID)

/**
 * Get user profile from Airtable by email instead of Auth0 user ID
 * @param {string} userId - Auth0 user ID (not used for lookup but kept for compatibility)
 * @param {string} email - User's email address
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId, email) {
  try {
    // Look for contact with matching email instead of Memberstack ID
    const records = await contactsTable
      .select({
        filterByFormula: `{Email}="${email}"`,
        maxRecords: 1,
      })
      .firstPage()

    if (records && records.length > 0) {
      return {
        contactId: records[0].id,
        ...records[0].fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw new Error("Failed to fetch user profile")
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
    const updatedContact = await contactsTable.update(contactId, data)
    
    return {
      contactId: updatedContact.id,
      ...updatedContact.fields,
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw new Error("Failed to update user profile")
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
 * Get major details by ID
 * @param {string} majorId - Airtable major ID
 * @returns {Promise<Object>} Major data
 */
export async function getMajor(majorId) {
  try {
    const major = await majorsTable.find(majorId)
    
    if (major) {
      return {
        id: major.id,
        ...major.fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching major:", error)
    throw new Error("Failed to fetch major details")
  }
}

export default {
  getUserProfile,
  getInstitution,
  getEducation,
  getMajor,
  updateUserProfile,
}