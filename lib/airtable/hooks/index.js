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
  milestoneHooks
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
  useHasAppliedToCohort
} = applicationHooks;

export const {
  useCohortMilestones,
  useCurrentMilestones
} = milestoneHooks;

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
  ...milestoneHooks
};