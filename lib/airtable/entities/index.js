import * as users from './users';
import * as education from './education';
import * as institutions from './institutions';

// Re-export all entity modules
export {
  users,
  education,
  institutions
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

// Default export with all entities
export default {
  users,
  education,
  institutions
};