import * as profileHooks from './useProfile';

// Re-export all hooks modules
export {
  profileHooks
};

// Re-export specific hooks for convenience
export const {
  useProfileData,
  useUpdateProfile,
  useCheckUserExists
} = profileHooks;

// Default export with all hooks
export default {
  ...profileHooks
};