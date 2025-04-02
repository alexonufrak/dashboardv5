/**
 * Query Keys Factory
 * 
 * Centralized system for managing TanStack Query cache keys.
 * This helps prevent key collisions and ensures consistent naming patterns.
 */

/**
 * User/Profile related query keys
 */
export const userKeys = {
  all: ['user'],
  lists: () => [...userKeys.all, 'list'],
  profile: () => [...userKeys.all, 'profile'],
  detail: (userId) => [...userKeys.all, 'detail', userId],
  contact: (userId) => ['contact', userId],
  currentContact: () => ['contact', 'current'],
  auth0: (auth0Id) => ['contact', 'auth0', auth0Id],
};

/**
 * Education related query keys
 */
export const educationKeys = {
  all: ['education'],
  lists: () => [...educationKeys.all, 'list'],
  detail: (educationId) => [...educationKeys.all, 'detail', educationId],
  byUser: (userId) => [...educationKeys.all, 'user', userId],
  current: () => [...educationKeys.all, 'current'],
};

/**
 * Participation related query keys
 */
export const participationKeys = {
  all: ['participation'],
  lists: () => [...participationKeys.all, 'list'],
  detail: (participationId) => [...participationKeys.all, 'detail', participationId],
  byUser: (userId) => [...participationKeys.all, 'user', userId],
  byProgram: (programId) => [...participationKeys.all, 'program', programId],
  byCohort: (cohortId) => [...participationKeys.all, 'cohort', cohortId],
};

/**
 * Program related query keys
 */
export const programKeys = {
  all: ['program'],
  lists: () => [...programKeys.all, 'list'],
  detail: (programId) => [...programKeys.all, 'detail', programId],
  byInstitution: (institutionId) => [...programKeys.all, 'institution', institutionId],
  active: () => [...programKeys.all, 'active'],
};

/**
 * Combined profile query keys (contact + education + other user data)
 */
export const profileKeys = {
  all: ['profile'],
  detail: (userId) => [...profileKeys.all, 'detail', userId],
  current: () => [...profileKeys.all, 'current'],
  composed: (contactId) => [...profileKeys.all, 'composed', contactId],
};

export default {
  userKeys,
  educationKeys,
  participationKeys,
  programKeys,
  profileKeys,
};