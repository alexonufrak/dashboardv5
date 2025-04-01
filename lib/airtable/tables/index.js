import * as definitions from './definitions';

// Re-export the table definitions module
export default definitions;

// Re-export common functions and constants
export const {
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
} = definitions;

// Export table constants to fix entity imports
export const EVENTS = TABLE_IDS.EVENTS || process.env.AIRTABLE_EVENTS_TABLE_ID;
export const RESOURCES = TABLE_IDS.RESOURCES || process.env.AIRTABLE_RESOURCES_TABLE_ID;
export const POINTS_TRANSACTIONS = TABLE_IDS.POINTS_TRANSACTIONS || process.env.AIRTABLE_POINTS_TRANSACTIONS_TABLE_ID;
export const REWARDS = TABLE_IDS.REWARDS || process.env.AIRTABLE_REWARDS_TABLE_ID;
export const REWARD_CLAIMS = TABLE_IDS.REWARD_CLAIMS || process.env.AIRTABLE_REWARD_CLAIMS_TABLE_ID;
export const MILESTONE_SUBMISSIONS = TABLE_IDS.SUBMISSIONS || process.env.AIRTABLE_SUBMISSIONS_TABLE_ID;
export const PARTICIPATION = TABLE_IDS.PARTICIPATION;