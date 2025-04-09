/**
 * Centralized exports for server-side entity data fetching
 * 
 * This file exports all entity-specific data fetching functions
 * to be used in server components.
 */

// Contact data
export {
  getCurrentUserContact,
  fetchParticipationByContactId,
  formatContact,
  formatParticipation,
} from './contacts';

// Program data
export {
  getActivePrograms,
  getProgramWithCohorts,
  formatProgram,
  formatCohort,
} from './programs';

// Team data
export {
  getUserTeams,
  getTeamWithMembers,
  getTeamMembers,
  getJoinableTeams,
  getTeamSubmissions,
  formatTeam,
  formatMember,
  formatSubmission,
} from './teams';

// Event data
export {
  getUpcomingEvents,
  getAllUpcomingEvents,
  getPastEvents,
  getContactEvents,
  getProgramEvents,
  getEventById,
  getEventAttendees,
  formatEvent,
  formatAttendee,
} from './events';