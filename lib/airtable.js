import Airtable from "airtable"

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

// Table references
const contactsTable = base("Contacts")
const institutionsTable = base("Institutions")

// Utility function to fetch user profile from Airtable
export async function getUserProfile(userId) {
  try {
    const records = await contactsTable
      .select({
        filterByFormula: `{Auth0 ID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage()

    if (records.length > 0) {
      return records[0].fields
    } else {
      return null
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw new Error("Failed to fetch user profile")
  }
}

// Utility function to fetch institution details from Airtable
export async function getInstitution(institutionId) {
  try {
    const record = await institutionsTable.find(institutionId)
    return record.fields
  } catch (error) {
    console.error("Error fetching institution:", error)
    throw new Error("Failed to fetch institution details")
  }
}

// Utility function to update user profile in Airtable
export async function updateUserProfile(contactId, data) {
  try {
    const updatedRecord = await contactsTable.update(contactId, data)
    return updatedRecord.fields
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw new Error("Failed to update user profile")
  }
}

