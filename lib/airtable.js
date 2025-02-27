import Airtable from "airtable"

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

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

const partnershipsTable = process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID 
  ? base(process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID) 
  : null;

const topicsTable = process.env.AIRTABLE_TOPICS_TABLE_ID 
  ? base(process.env.AIRTABLE_TOPICS_TABLE_ID) 
  : null;

const classesTable = process.env.AIRTABLE_CLASSES_TABLE_ID 
  ? base(process.env.AIRTABLE_CLASSES_TABLE_ID) 
  : null;

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
      return {
        id: initiative.id,
        ...initiative.fields,
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
    if (!partnershipsTable || !cohortsTable) {
      console.error("Partnerships or Cohorts table not initialized - missing environment variables");
      return [];
    }
    
    console.log(`Searching for partnerships with institution ID: ${institutionId}`);
    
    // First try to get ALL partnerships to see what we're working with
    const allPartnerships = await partnershipsTable
      .select({
        // No filter initially, just get everything to see what we're working with
      })
      .firstPage();
    
    console.log(`Found ${allPartnerships?.length || 0} total partnerships`);
    
    // Log each partnership's institution IDs to debug
    if (allPartnerships && allPartnerships.length > 0) {
      allPartnerships.forEach((partnership, index) => {
        const partnerInstitutions = partnership.fields.Institution || [];
        console.log(`Partnership ${index + 1} institutions: ${JSON.stringify(partnerInstitutions)}`);
      });
    }
    
    // Now try to find partnerships for this specific institution with a simpler formula
    const partnerships = await partnershipsTable
      .select({
        // Use a simpler formula that just checks if the institution ID is in the array
        filterByFormula: `OR(SEARCH("${institutionId}", ARRAYJOIN({Institution})))`,
      })
      .firstPage();
    
    console.log(`Found ${partnerships?.length || 0} partnerships for this institution`);
    
    if (!partnerships || partnerships.length === 0) {
      return [];
    }

    // Get all cohort IDs from partnerships
    const cohortIds = partnerships.flatMap(partnership => {
      const cohorts = partnership.fields.Cohorts || [];
      console.log(`Partnership has ${cohorts.length} cohorts: ${JSON.stringify(cohorts)}`);
      return cohorts;
    });
    
    if (cohortIds.length === 0) {
      console.log("No cohort IDs found in partnerships");
      return [];
    }

    console.log(`Found ${cohortIds.length} total cohort IDs: ${JSON.stringify(cohortIds)}`);

    // First get ALL cohorts to see what's available without filtering
    const allCohorts = await cohortsTable
      .select({})
      .firstPage();
    
    console.log(`Found ${allCohorts?.length || 0} total cohorts`);
    
    // Log each cohort's status
    if (allCohorts && allCohorts.length > 0) {
      allCohorts.forEach((cohort, index) => {
        console.log(`Cohort ${index + 1} ID: ${cohort.id}, Status: ${cohort.fields.Status || 'Unknown'}`);
      });
    }

    // Now try to get the specific cohorts we want - try a different approach
    // We'll build an array of OR conditions for each cohort ID
    const cohortConditions = cohortIds.map(id => `RECORD_ID()="${id}"`);
    const filterFormula = `OR(${cohortConditions.join(",")})`;
    
    console.log(`Using filter formula: ${filterFormula}`);
    
    // Fetch the cohorts without the status filter first
    const matchedCohorts = await cohortsTable
      .select({
        filterByFormula: filterFormula,
      })
      .firstPage();
    
    console.log(`Found ${matchedCohorts?.length || 0} matched cohorts before status filter`);
    
    // Filter cohorts by status client-side
    const openCohorts = matchedCohorts.filter(cohort => 
      cohort.fields.Status === "Open"
    );
    
    console.log(`After filtering by Status="Open", found ${openCohorts.length} cohorts`);
    
    // Return detailed cohort data
    return openCohorts.map(cohort => ({
      id: cohort.id,
      ...cohort.fields,
    }));
  } catch (error) {
    console.error("Error fetching cohorts by institution:", error);
    return [];
  }
}

export default {
  getUserProfile,
  getInstitution,
  getEducation,
  getProgram,
  getInitiative,
  getTopic,
  getClass,
  getCohortsByInstitution,
  updateUserProfile,
}