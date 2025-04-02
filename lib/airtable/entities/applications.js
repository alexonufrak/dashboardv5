import { getTable, TABLE_IDS } from '../tables';
import { fetchCohortById } from './cohorts';
import { getProgramById } from './programs';
import { getUserByAuth0Id, getUserByEmail } from './users';

/**
 * Get applications table
 * @returns {Object} Applications table
 */
function getApplicationsTable() {
  return getTable('APPLICATIONS');
}

/**
 * Get application by ID
 * @param {string} id - Application ID
 * @returns {Object} Application data
 */
export async function getApplicationById(id) {
  try {
    const table = getApplicationsTable();
    const record = await table.find(id);
    
    if (!record) {
      return null;
    }
    
    return formatApplicationRecord(record);
  } catch (error) {
    console.error('Error fetching application by ID:', error);
    throw error;
  }
}

/**
 * Get applications by user ID
 * @param {string} userId - Auth0 user ID
 * @param {string} [cohortId] - Optional cohort ID to filter applications
 * @returns {Array} Array of application objects
 */
export async function getApplicationsByUserId(userId, cohortId = null) {
  try {
    // Get user contact ID from Auth0 ID
    const user = await getUserByAuth0Id(userId);
    
    if (!user || !user.contactId) {
      throw new Error('User not found or missing contact ID');
    }
    
    return getApplicationsByContactId(user.contactId, cohortId);
  } catch (error) {
    console.error('Error fetching applications by user ID:', error);
    throw error;
  }
}

/**
 * Get applications by user email
 * @param {string} email - User email
 * @param {string} [cohortId] - Optional cohort ID to filter applications
 * @returns {Array} Array of application objects
 */
export async function getApplicationsByEmail(email, cohortId = null) {
  try {
    // Get user contact ID from email
    const user = await getUserByEmail(email);
    
    if (!user || !user.contactId) {
      throw new Error('User not found or missing contact ID');
    }
    
    return getApplicationsByContactId(user.contactId, cohortId);
  } catch (error) {
    console.error('Error fetching applications by email:', error);
    throw error;
  }
}

/**
 * Get applications by contact ID
 * @param {string} contactId - Airtable contact ID
 * @param {string} [cohortId] - Optional cohort ID to filter applications
 * @returns {Array} Array of application objects
 */
export async function getApplicationsByContactId(contactId, cohortId = null) {
  try {
    const table = getApplicationsTable();
    
    // Build filter formula
    let filterFormula = `{Contact} = "${contactId}"`;
    
    // Add cohort filter if provided
    if (cohortId) {
      filterFormula = `AND(${filterFormula}, {Cohort} = "${cohortId}")`;
    }
    
    // Query applications
    const records = await table.select({
      filterByFormula: filterFormula
    }).all();
    
    // Format records
    const applications = await Promise.all(
      records.map(async record => formatApplicationRecord(record))
    );
    
    return applications;
  } catch (error) {
    console.error('Error fetching applications by contact ID:', error);
    throw error;
  }
}

/**
 * Get applications by cohort ID
 * @param {string} cohortId - Cohort ID
 * @returns {Array} Array of application objects
 */
export async function getApplicationsByCohortId(cohortId) {
  try {
    const table = getApplicationsTable();
    
    const records = await table.select({
      filterByFormula: `{Cohort} = "${cohortId}"`
    }).all();
    
    // Format records
    const applications = await Promise.all(
      records.map(async record => formatApplicationRecord(record))
    );
    
    return applications;
  } catch (error) {
    console.error('Error fetching applications by cohort ID:', error);
    throw error;
  }
}

/**
 * Check if a user has applied to a specific cohort
 * @param {string} userId - Auth0 user ID
 * @param {string} cohortId - Cohort ID
 * @returns {Object} Application status object with hasApplied flag and application details
 */
export async function checkUserApplicationForCohort(userId, cohortId) {
  try {
    const applications = await getApplicationsByUserId(userId, cohortId);
    
    const hasApplied = applications.length > 0;
    const application = applications.length > 0 ? applications[0] : null;
    
    return {
      hasApplied,
      application
    };
  } catch (error) {
    console.error('Error checking user application for cohort:', error);
    throw error;
  }
}

/**
 * Create a new application
 * @param {Object} applicationData - Application data
 * @param {string} applicationData.contactId - Contact ID
 * @param {string} applicationData.cohortId - Cohort ID
 * @param {string} [applicationData.teamId] - Optional team ID for team applications
 * @param {string} [applicationData.status] - Application status (default: "Submitted")
 * @param {string} [applicationData.applicationType] - Application type (e.g., "individual", "team", "joinTeam", "xtrapreneurs")
 * @param {string} [applicationData.reason] - Reason for applying (for xtrapreneurs)
 * @param {string} [applicationData.commitment] - Commitment level (for xtrapreneurs)
 * @param {string} [applicationData.teamToJoin] - Team ID to join (for join team requests)
 * @param {string} [applicationData.joinTeamMessage] - Message for team join request
 * @returns {Object} Created application record
 */
export async function createApplication(applicationData) {
  try {
    const {
      contactId,
      cohortId,
      teamId,
      status = 'Submitted',
      applicationType,
      reason,
      commitment,
      teamToJoin,
      joinTeamMessage
    } = applicationData;
    
    // Validate required fields
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    if (!cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    // Prepare record data
    const recordData = {
      'Contact': [contactId],
      'Cohort': [cohortId],
      'Status': status
    };
    
    // Handle application type specific fields
    if (applicationType === 'xtrapreneurs') {
      if (!reason) {
        throw new Error('Reason is required for xtrapreneurs applications');
      }
      
      if (!commitment) {
        throw new Error('Commitment level is required for xtrapreneurs applications');
      }
      
      recordData['Xtrapreneurs/Reason'] = reason;
      recordData['Xtrapreneurs/Commitment'] = commitment;
      recordData['Status'] = 'Accepted'; // Xtrapreneurs applications are auto-accepted
    } else if (applicationType === 'joinTeam') {
      const targetTeamId = teamToJoin || teamId;
      
      if (!targetTeamId) {
        throw new Error('Team to join is required for team join requests');
      }
      
      if (!joinTeamMessage) {
        throw new Error('Join team message is required for team join requests');
      }
      
      recordData['Team to Join'] = [targetTeamId];
      recordData['Join Team Message'] = joinTeamMessage;
      recordData['Status'] = 'Submitted'; // Team join requests are always submitted for review
    } else if (teamId) {
      // For regular team applications, we don't need to set any team fields
      // But we do need to check if the team exists
      // This will be handled by the caller who should update the team with the cohort
    }
    
    // Create the application record
    const table = getApplicationsTable();
    const record = await table.create(recordData);
    
    return formatApplicationRecord(record);
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
}

/**
 * Update application status
 * @param {string} id - Application ID
 * @param {string} status - New status value
 * @returns {Object} Updated application record
 */
export async function updateApplicationStatus(id, status) {
  try {
    const table = getApplicationsTable();
    
    const record = await table.update(id, {
      'Status': status
    });
    
    return formatApplicationRecord(record);
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
}

/**
 * Format an application record from Airtable
 * @param {Object} record - Airtable record object
 * @returns {Object} Formatted application object
 */
async function formatApplicationRecord(record) {
  try {
    // Extract fields from record
    const fields = record.fields;
    
    // Extract cohort ID
    const cohortId = fields.Cohort && 
      Array.isArray(fields.Cohort) && 
      fields.Cohort.length > 0 
        ? fields.Cohort[0] 
        : null;
    
    // Extract contact ID
    const contactId = fields.Contact && 
      Array.isArray(fields.Contact) && 
      fields.Contact.length > 0 
        ? fields.Contact[0] 
        : null;
    
    // Extract team to join ID
    const teamToJoin = fields['Team to Join'] && 
      Array.isArray(fields['Team to Join']) && 
      fields['Team to Join'].length > 0 
        ? fields['Team to Join'][0] 
        : null;
    
    // Create base application object
    const application = {
      id: record.id,
      contactId,
      cohortId,
      status: fields.Status || 'Submitted',
      createdAt: fields.Created || record._rawJson.createdTime,
      teamToJoin,
      joinTeamMessage: fields['Join Team Message'] || fields['Xperience/Join Team Message'] || null,
      applicationType: fields['Type'] || (teamToJoin ? 'joinTeam' : null),
      // Xtrapreneurs specific fields
      reason: fields['Xtrapreneurs/Reason'] || null,
      commitment: fields['Xtrapreneurs/Commitment'] || null
    };
    
    // Fetch cohort details if available
    if (cohortId) {
      try {
        const cohort = await fetchCohortById(cohortId);
        
        if (cohort) {
          application.cohortDetails = {
            id: cohort.id,
            name: cohort.shortName || cohort.name || "Unknown Cohort",
            programId: cohort.programId,
            programName: cohort.programName,
          };
        }
      } catch (error) {
        console.error(`Error fetching cohort details for application ${record.id}:`, error);
      }
    }
    
    return application;
  } catch (error) {
    console.error('Error formatting application record:', error);
    // Return basic record data on error
    return {
      id: record.id,
      error: 'Error formatting record'
    };
  }
}

// Default export for all functions
export default {
  getApplicationById,
  getApplicationsByUserId,
  getApplicationsByEmail,
  getApplicationsByContactId,
  getApplicationsByCohortId,
  checkUserApplicationForCohort,
  createApplication,
  updateApplicationStatus
};