/**
 * Cohort Applications Hooks
 * Domain-specific hooks for managing cohort applications
 */
import { createDataHook, createActionHook } from './createDataHook';
import { useMyParticipation } from './useParticipation';
import { useMemo } from 'react';

/**
 * Hook to check if a user already has an application or participation for a cohort
 * @param {string} cohortId - The cohort ID to check
 */
export function useCohortApplication(cohortId) {
  // Fetch user applications
  const { data: applications, isLoading: isLoadingApplications } = useApplications();
  
  // Fetch user participation
  const { data: participation, isLoading: isLoadingParticipation } = useMyParticipation();
  
  // Find specific application for this cohort
  const application = useMemo(() => {
    if (!applications?.applications || !cohortId) return null;
    return applications.applications.find(app => app.cohortId === cohortId);
  }, [applications, cohortId]);
  
  // Check if user has participation in this cohort
  const hasParticipation = useMemo(() => {
    if (!participation?.records || !cohortId) return false;
    return participation.records.some(record => record.cohort?.id === cohortId);
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
 * Hook for fetching user's applications
 */
export const useApplications = createDataHook({
  queryKey: 'myApplications',
  endpoint: '/api/applications/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your applications',
  refetchOnFocus: true,
  normalizeData: (data) => ({
    applications: data.applications || [],
    hasApplications: (data.applications?.length || 0) > 0
  })
});

/**
 * Hook for creating a new application
 */
export const useCreateApplication = createActionHook({
  actionKey: 'createApplication',
  endpoint: '/api/applications/create',
  method: 'POST',
  successMessage: 'Application submitted successfully',
  errorMessage: 'Failed to submit application',
  invalidateKeys: ['myApplications', 'myParticipation']
});

/**
 * Hook for checking application restrictions (e.g., initiative conflicts)
 * @param {string} initiativeName - The initiative name to check for conflicts
 */
export function useCheckInitiativeConflicts(initiativeName) {
  return createDataHook({
    queryKey: ['initiativeConflicts', initiativeName],
    endpoint: `/api/user/check-initiative-conflicts?initiative=${encodeURIComponent(initiativeName || '')}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    errorMessage: 'Failed to check for initiative conflicts',
    refetchOnFocus: false,
    normalizeData: (data) => ({
      hasConflict: data.hasConflict || false,
      conflictingInitiative: data.conflictingInitiative,
      teamId: data.teamId,
      teamName: data.teamName
    })
  })();
}

export default {
  useCohortApplication,
  useApplications,
  useCreateApplication,
  useCheckInitiativeConflicts
};