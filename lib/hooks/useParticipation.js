/**
 * Participation Hooks
 * Domain-specific hooks for accessing participation data
 */
import { createDataHook, createActionHook } from './createDataHook';

/**
 * Hook for fetching the current user's participation records
 */
export const useMyParticipation = createDataHook({
  queryKey: 'myParticipation',
  endpoint: '/api/participation/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your participation information',
  refetchOnFocus: true,
  normalizeData: (data) => ({
    records: data.participation || [],
    hasParticipation: data.hasParticipation || false,
    contactId: data.contactId
  })
});

/**
 * Hook for creating a new participation record
 */
export const useCreateParticipation = createActionHook({
  actionKey: 'createParticipation',
  endpoint: '/api/participation/mine',
  method: 'POST',
  successMessage: 'Successfully joined program',
  errorMessage: 'Failed to join program',
  invalidateKeys: ['myParticipation']
});

/**
 * Hook for getting participation in a specific cohort
 * @param {string} cohortId - The cohort ID to check participation for
 */
export function useParticipationInCohort(cohortId) {
  const { data, isLoading, isError, error } = useMyParticipation();
  
  // Find participation record for this cohort
  const participationInCohort = data?.records?.find(record => 
    record.cohort?.id === cohortId
  );
  
  return {
    data: participationInCohort || null,
    isParticipating: !!participationInCohort,
    isLoading,
    isError,
    error
  };
}

/**
 * Hook for getting participation in a specific initiative/program
 * @param {string} initiativeId - The initiative/program ID to check participation for
 */
export function useParticipationInInitiative(initiativeId) {
  const { data, isLoading, isError, error } = useMyParticipation();
  
  // Find participation record for this initiative
  const participationInInitiative = data?.records?.find(record => 
    record.initiative?.id === initiativeId || 
    record.cohort?.initiativeId === initiativeId
  );
  
  return {
    data: participationInInitiative || null,
    isParticipating: !!participationInInitiative,
    isLoading,
    isError,
    error
  };
}

/**
 * Hook for getting the user's active team in a program
 * @param {string} initiativeId - The initiative/program ID to get the team for
 */
export function useTeamInProgram(initiativeId) {
  const { data, isLoading, isError, error } = useParticipationInInitiative(initiativeId);
  
  return {
    team: data?.team || null,
    hasTeam: !!data?.team,
    isTeamParticipation: data?.isTeamParticipation || false,
    isLoading,
    isError,
    error
  };
}

export default {
  useMyParticipation,
  useCreateParticipation,
  useParticipationInCohort,
  useParticipationInInitiative,
  useTeamInProgram
};