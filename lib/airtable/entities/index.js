/*
 * Expose all Airtable entity modules in a single export
 */

// Core entity modules
import users from './users';
import education from './education';
import institutions from './institutions';
import participation from './participation';
import teams from './teams';
import cohorts from './cohorts';
import programs from './programs';
import submissions from './submissions';
import points from './points';
import resources from './resources';
import events from './events';
import partnerships from './partnerships';

// Re-export all individual functions for backwards compatibility
export const {
  getCompleteProfile,
  getUserProfile,
  updateUserProfile,
  updateOnboardingStatus,
  getUserByEmail,
  getUserByAuth0Id,
  createUserProfile,
  updateUserByEmail,
  updateUserMetadata
} = users;

export const {
  getEducationRecords,
  getEducationHistoryByUser,
  createEducationRecord,
  updateEducationRecord
} = education;

export const {
  fetchInstitution,
  getInstitution,
  lookupInstitutionByEmail,
  searchInstitutionsByName
} = institutions;

export const {
  fetchParticipationRecords,
  getParticipationRecords,
  getParticipationForCohort,
  getParticipationForInitiative,
  createParticipationRecord
} = participation;

export const {
  fetchTeamById,
  getTeamById,
  getTeamMembers,
  createTeam,
  updateTeam,
  getTeamsForCohort
} = teams;

export const {
  fetchCohortById,
  getCohortById,
  getCohortsByProgram,
  getCohortsByStatus,
  getActiveCohorts,
  getUpcomingCohorts,
  createCohort,
  updateCohort
} = cohorts;

export const {
  getProgramById,
  getProgramBySlug,
  getPrograms,
  getActivePrograms
} = programs;

export const {
  getSubmission,
  getSubmissionsByTeam,
  getSubmissionsByUser,
  getSubmissionsByCohort,
  createSubmission,
  updateSubmission
} = submissions;

export const {
  getPointTransactions,
  getUserPointSummary,
  getPointsByUser,
  createPointTransaction
} = points;

export const {
  getResources,
  getResourcesForProgram,
  getResourceById,
  createResource,
  updateResource
} = resources;

export const {
  getEventById,
  getUpcomingEvents,
  getEventsByUser,
  getEventsByCohort,
  getEventsByProgram,
  createEvent,
  updateEvent,
  deleteEvent
} = events;

export const {
  getPartnershipById,
  getPartnershipsByProgram,
  getPartnershipsByInstitution,
  createPartnership,
  updatePartnership,
  deletePartnership
} = partnerships;

// Export the modules as a default export as well
export {
  users,
  education,
  institutions,
  participation,
  teams,
  cohorts,
  programs,
  submissions,
  points,
  resources,
  events,
  partnerships
};
