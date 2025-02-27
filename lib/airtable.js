import Airtable from "airtable"

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

// Tables
const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID)
const institutionsTable = base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID)

/**
 * Get user profile from Airtable by Auth0 user ID
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId) {
  try {
    // Look for contact with matching Memberstack ID (Auth0 user ID)
    // Change this field name to match your Airtable structure
    const records = await contactsTable
      .select({
        filterByFormula: `{Memberstack ID}="${userId}"`,
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

export default {
  getUserProfile,
  getInstitution,
  updateUserProfile,
}