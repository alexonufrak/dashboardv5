import * as profileHooks from './useProfile';
import * as participationHooks from './useParticipation';
import * as teamHooks from './useTeams';
import * as cohortHooks from './useCohorts';
import * as programHooks from './usePrograms';
import * as submissionHooks from './useSubmissions';
import * as pointsHooks from './usePoints';
import * as resourcesHooks from './useResources';
import * as eventsHooks from './useEvents';
import * as partnershipsHooks from './usePartnerships';
import * as onboardingHooks from './useOnboarding';
import * as applicationHooks from './useApplications';
import * as milestoneHooks from './useMilestones';
import * as contactHooks from './useContact';
import * as educationRecordsHooks from './useEducationRecords';
import * as educationHooks from './useEducation';
import * as cohortApplicationHooks from './useCohortApplications';
import useCompositeProfile from './useProfileComposite';

// Re-export all hooks modules
export {
  profileHooks,
  participationHooks,
  teamHooks,
  cohortHooks,
  programHooks,
  submissionHooks,
  pointsHooks,
  resourcesHooks,
  eventsHooks,
  partnershipsHooks,
  onboardingHooks,
  applicationHooks,
  milestoneHooks,
  contactHooks,
  educationRecordsHooks,
  educationHooks,
  cohortApplicationHooks
};

// Re-export specific hooks for convenience
export const {
  useProfileData,
  useUpdateProfile,
  useCheckUserExists
} = profileHooks;

export const {
  useUpdateOnboardingStatus,
  isOnboardingCompleted
} = onboardingHooks;

export const {
  useUserApplications,
  useHasAppliedToCohort,
  useMyApplications,
  useSubmitApplication,
  useSubmitTeamApplication
} = applicationHooks;

export const {
  useCohortMilestones,
  useCurrentMilestones
} = milestoneHooks;

export const {
  useMyContact,
  useMyContactByEmail,
  // Domain-specific hook names
  useContactViaApi,
  useUpdateContactViaApi,
  useCheckContact,
  useInvalidateContact,
  // Legacy/compatibility hooks
  useProfile
  // useUpdateProfile is already exported above
} = contactHooks;

export const {
  useEducationByUser,
  useMyEducation,
  useEducationRecord,
  useAllMajors
} = educationRecordsHooks;

export const {
  // Modern API-first hooks
  useEducationViaApi,
  useUpdateEducationViaApi,
  useEducationByIdViaApi,
  useInvalidateEducation,
  
  // Legacy hooks for backward compatibility
  useUpdateEducation,
  useEducation: useEducationById,
  useEducationData
} = educationHooks;

export const {
  useCohortApplication,
  useCheckInitiativeConflicts
} = cohortApplicationHooks;

export const {
  useParticipation,
  useProgramParticipation,
  useCohortParticipation
} = participationHooks;

export const {
  useTeam,
  useTeamMembers,
  useCreateTeam,
  useUpdateTeam,
  useTeamsByCohort,
  useUserTeams
} = teamHooks;

export const {
  useCohort,
  useCohortsByInstitution,
  useCohortsByProgram,
  useActiveCohorts,
  useUserCohorts
} = cohortHooks;

export const {
  useProgram,
  useProgramsByInstitution,
  useActivePrograms,
  useUserPrograms,
  useSearchPrograms
} = programHooks;

export const {
  useSubmission,
  useTeamSubmissions,
  useMilestoneSubmissions,
  useCreateSubmission,
  useUpdateSubmission
} = submissionHooks;

export const {
  useUserPointsTransactions,
  useTeamPointsTransactions,
  useRewardItems,
  useUserClaimedRewards,
  useUserPointsSummary,
  useCreatePointsTransaction,
  useClaimReward
} = pointsHooks;

export const {
  useProgramResources,
  useCohortResources,
  useGlobalResources,
  useResource,
  useAllAvailableResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource
} = resourcesHooks;

export const {
  useEvent,
  useUpcomingEvents,
  useProgramEvents,
  useCohortEvents,
  useUserEvents,
  useAllRelevantEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent
} = eventsHooks;

export const {
  usePartnership,
  useInstitutionPartnerships,
  useInitiativePartnerships,
  // Legacy hooks for backward compatibility
  useProgramPartnerships,
  useCreatePartnership,
  useUpdatePartnership
} = partnershipsHooks;

// Default export with all hooks
// Export the composite profile hook directly
export { useCompositeProfile };

export default {
  ...profileHooks,
  ...participationHooks,
  ...teamHooks,
  ...cohortHooks,
  ...programHooks,
  ...submissionHooks,
  ...pointsHooks,
  ...resourcesHooks,
  ...eventsHooks,
  ...partnershipsHooks,
  ...onboardingHooks,
  ...applicationHooks,
  ...milestoneHooks,
  ...contactHooks,
  ...educationRecordsHooks,
  ...educationHooks,
  ...cohortApplicationHooks,
  // Also include the composite profile hook
  useCompositeProfile
};