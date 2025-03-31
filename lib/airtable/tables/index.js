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