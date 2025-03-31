import { getBase } from '../core/client';

// Table IDs from environment variables
export const TABLE_IDS = {
  CONTACTS: process.env.AIRTABLE_CONTACTS_TABLE_ID,
  INSTITUTIONS: process.env.AIRTABLE_INSTITUTIONS_TABLE_ID,
  EDUCATION: process.env.AIRTABLE_EDUCATION_TABLE_ID,
  PROGRAMS: process.env.AIRTABLE_PROGRAMS_TABLE_ID,
  INITIATIVES: process.env.AIRTABLE_INITIATIVES_TABLE_ID,
  COHORTS: process.env.AIRTABLE_COHORTS_TABLE_ID,
  PARTICIPATION: process.env.AIRTABLE_PARTICIPATION_TABLE_ID,
  TEAMS: process.env.AIRTABLE_TEAMS_TABLE_ID,
  PARTNERSHIPS: process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID,
  TOPICS: process.env.AIRTABLE_TOPICS_TABLE_ID,
  CLASSES: process.env.AIRTABLE_CLASSES_TABLE_ID,
  MILESTONES: process.env.AIRTABLE_MILESTONES_TABLE_ID,
  SUBMISSIONS: process.env.AIRTABLE_SUBMISSIONS_TABLE_ID,
  INVITES: process.env.AIRTABLE_INVITES_TABLE_ID,
  MEMBERS: process.env.AIRTABLE_MEMBERS_TABLE_ID,
  // Add any other table IDs as needed
};

// Table objects cache
const tables = {};

/**
 * Get a table object with error handling
 * @param {string} tableId The table ID or name from TABLE_IDS
 * @returns {Object} Airtable table object
 */
export function getTable(tableId) {
  // If passed a table name instead of ID, convert to ID
  const actualTableId = TABLE_IDS[tableId] || tableId;
  
  // Check if table ID is valid
  if (!actualTableId) {
    throw new Error(`Invalid table ID: ${tableId}`);
  }
  
  // Return cached table object if available
  if (tables[actualTableId]) {
    return tables[actualTableId];
  }
  
  // Create new table object and cache it
  const base = getBase();
  tables[actualTableId] = base(actualTableId);
  
  return tables[actualTableId];
}

/**
 * Get the contacts table
 * @returns {Object} Contacts table
 */
export function getContactsTable() {
  return getTable('CONTACTS');
}

/**
 * Get the institutions table
 * @returns {Object} Institutions table
 */
export function getInstitutionsTable() {
  return getTable('INSTITUTIONS');
}

/**
 * Get the education table
 * @returns {Object} Education table
 */
export function getEducationTable() {
  return getTable('EDUCATION');
}

/**
 * Get the programs table
 * @returns {Object} Programs table
 */
export function getProgramsTable() {
  return getTable('PROGRAMS');
}

/**
 * Get the initiatives table
 * @returns {Object} Initiatives table
 */
export function getInitiativesTable() {
  return getTable('INITIATIVES');
}

/**
 * Get the cohorts table
 * @returns {Object} Cohorts table
 */
export function getCohortsTable() {
  return getTable('COHORTS');
}

/**
 * Get the participation table
 * @returns {Object} Participation table
 */
export function getParticipationTable() {
  return getTable('PARTICIPATION');
}

/**
 * Get the teams table
 * @returns {Object} Teams table
 */
export function getTeamsTable() {
  return getTable('TEAMS');
}

/**
 * Get the milestones table
 * @returns {Object} Milestones table
 */
export function getMilestonesTable() {
  return getTable('MILESTONES');
}

/**
 * Get the submissions table
 * @returns {Object} Submissions table
 */
export function getSubmissionsTable() {
  return getTable('SUBMISSIONS');
}

/**
 * Get the members table
 * @returns {Object} Members table
 */
export function getMembersTable() {
  return getTable('MEMBERS');
}

/**
 * Get the invites table
 * @returns {Object} Invites table
 */
export function getInvitesTable() {
  return getTable('INVITES');
}

// Export table getters
export default {
  getTable,
  getContactsTable,
  getInstitutionsTable,
  getEducationTable,
  getProgramsTable,
  getInitiativesTable,
  getCohortsTable,
  getParticipationTable,
  getTeamsTable,
  getMilestonesTable,
  getSubmissionsTable,
  getMembersTable,
  getInvitesTable,
  TABLE_IDS
};