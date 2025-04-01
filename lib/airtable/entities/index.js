import * as users from './users';
import * as education from './education';
import * as institutions from './institutions';
import * as participation from './participation';
import * as teams from './teams';
import * as cohorts from './cohorts';
import * as programs from './programs';
import * as submissions from './submissions';
import * as points from './points';
import * as resources from './resources';
import * as events from './events';

// Re-export all entity modules
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
  events
};

// Re-export specific functions that might be used frequently
export const {
  getUserByAuth0Id,
  getUserByEmail,
  updateUserProfile,
  updateUserOnboarding,
  checkUserExists
} = users;

export const {
  getEducation,
  updateEducation
} = education;

export const {
  getInstitution,
  lookupInstitutionByEmail,
  searchInstitutionsByName
} = institutions;

export const {
  getParticipationRecords,
  getParticipationForCohort,
  getParticipationForInitiative,
  createParticipationRecord
} = participation;

export const {
  getTeamById,
  getTeamMembers,
  createTeam,
  updateTeam,
  getTeamsForCohort
} = teams;

export const {
  getCohortById,
  getCohortsByInstitution,
  getCurrentCohorts,
  getPublicCohorts
} = cohorts;

export const {
  getProgramById,
  getProgramsByInstitution,
  getActiveInitiatives,
  searchProgramsByName
} = programs;

export const {
  getSubmissionById,
  getSubmissionsByTeam,
  getSubmissionsByMilestone,
  createSubmission,
  updateSubmission
} = submissions;

export const {
  getUserPointsTransactions,
  getTeamPointsTransactions,
  getRewardItems,
  getUserClaimedRewards,
  getUserPointsSummary,
  createPointsTransaction,
  claimReward
} = points;

export const {
  getResourcesByProgram,
  getResourcesByCohort,
  getGlobalResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} = resources;

export const {
  getEventById,
  getUpcomingEvents,
  getEventsByProgram,
  getEventsByCohort,
  getEventsByUser,
  createEvent,
  updateEvent,
  deleteEvent
} = events;

// Default export with all entities
export default {
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
  events
};