/**
 * Cohort Applications Hooks
 * Domain-specific hooks for managing cohort applications
 */
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import { useParticipation } from './useParticipation';
import { useMemo } from 'react';
import { useUserApplications } from './useApplications';

/**
 * Hook to check if a user already has an application or participation for a cohort
 * @param {string} cohortId - The cohort ID to check
 */
export function useCohortApplication(cohortId) {
  // Fetch user applications
  const { data: applications, isLoading: isLoadingApplications } = useUserApplications();
  
  // Fetch user participation
  const { data: participation, isLoading: isLoadingParticipation } = useParticipation();
  
  // Find specific application for this cohort
  const application = useMemo(() => {
    if (!applications || !cohortId) return null;
    return applications.find(app => app.cohortId === cohortId);
  }, [applications, cohortId]);
  
  // Check if user has participation in this cohort
  const hasParticipation = useMemo(() => {
    if (!participation || !cohortId) return false;
    return participation.some(record => record.cohortId === cohortId);
  }, [participation, cohortId]);
  
  return {
    application,
    hasApplication: !!application,
    applicationStatus: application?.status || null,
    hasParticipation,
    isLoading: isLoadingApplications || isLoadingParticipation
  };
}

/**
 * Hook for checking application restrictions (e.g., initiative conflicts)
 * @param {string} initiativeName - The initiative name to check for conflicts
 */
export function useCheckInitiativeConflicts(initiativeName) {
  return createDataHook({
    queryKey: ['initiativeConflicts', initiativeName],
    endpoint: `/api/user/check-initiative-conflicts`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    errorMessage: 'Failed to check for initiative conflicts',
    refetchOnFocus: false,
    normalizeData: (data) => ({
      hasConflict: data.hasConflict || false,
      conflictingInitiative: data.conflictingInitiative,
      teamId: data.teamId,
      teamName: data.teamName
    })
  })({ initiative: initiativeName });
}

export default {
  useCohortApplication,
  useCheckInitiativeConflicts
};