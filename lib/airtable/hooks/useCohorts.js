/**
 * Cohort Hooks
 * 
 * Domain-specific hooks for accessing cohort data.
 * Updated to support App Router API endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cohorts } from '../entities';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * App Router compatible hook for fetching a cohort by ID
 */
export const useCohortViaApi = createDataHook({
  queryKey: (cohortId) => ['cohort', cohortId],
  endpoint: (cohortId) => `/api/cohorts/${cohortId}`,
  staleTime: 10 * 60 * 1000, // 10 minutes (cohorts don't change often)
  errorMessage: 'Failed to load cohort information',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.cohort,
  enabled: (cohortId) => !!cohortId
});

/**
 * App Router compatible hook for fetching current cohorts
 */
export const useActiveCohortsViaApi = createDataHook({
  queryKey: ['cohorts', 'active'],
  endpoint: '/api/cohorts/public?current=true',
  staleTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load active cohorts',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.cohorts || []
});

/**
 * App Router compatible hook for fetching cohorts by program
 */
export const useCohortsByProgramViaApi = createDataHook({
  queryKey: (programId) => ['cohorts', 'program', programId],
  endpoint: (programId) => `/api/programs/${programId}/cohorts`,
  staleTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load program cohorts',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.cohorts || [],
  enabled: (programId) => !!programId
});

/**
 * Hook to fetch a single cohort by ID
 * @param {string} cohortId - The ID of the cohort to fetch
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useCohort(cohortId, options = {}) {
  // Use the App Router compatible hook 
  return useCohortViaApi(cohortId, options);

  /* Original implementation preserved for reference:
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: () => cohorts.getCohortById(cohortId),
    enabled: !!cohortId,
    ...options
  });
  */
}

/**
 * Hook to fetch cohorts by their institution ID
 * @param {string} institutionId - The ID of the institution
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of cohorts
 */
export function useCohortsByInstitution(institutionId, options = {}) {
  return useQuery({
    queryKey: ['cohorts', 'institution', institutionId],
    queryFn: async () => {
      // We should create an API endpoint for this in the future
      // For now, fallback to direct entity access
      return cohorts.getCohortsByInstitution(institutionId);
    },
    enabled: !!institutionId,
    ...options
  });
}

/**
 * Hook to fetch cohorts by their initiative/program ID
 * @param {string} programId - The ID of the program/initiative
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of cohorts
 */
export function useCohortsByProgram(programId, options = {}) {
  // Use the App Router compatible hook
  return useCohortsByProgramViaApi(programId, options);

  /* Original implementation preserved for reference:
  return useQuery({
    queryKey: ['cohorts', 'program', programId],
    queryFn: async () => {
      // Implementation that uses base cohort functions
      const allCohorts = await cohorts.getCurrentCohorts();
      return allCohorts.filter(cohort => 
        cohort.programId === programId || 
        (cohort.initiativeIds && cohort.initiativeIds.includes(programId))
      );
    },
    enabled: !!programId,
    ...options
  });
  */
}

/**
 * Hook to fetch active cohorts (that are currently accepting applications)
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of active cohorts
 */
export function useActiveCohorts(options = {}) {
  // Use the App Router compatible hook
  return useActiveCohortsViaApi(options);

  /* Original implementation preserved for reference:
  return useQuery({
    queryKey: ['cohorts', 'active'],
    queryFn: () => cohorts.getCurrentCohorts(),
    ...options
  });
  */
}

/**
 * Hook to fetch cohorts that a user is participating in
 * @param {string} userId - The ID of the user
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of cohorts
 */
export function useUserCohorts(userId, options = {}) {
  return useQuery({
    queryKey: ['cohorts', 'user', userId],
    queryFn: async () => {
      // We should create an API endpoint for this in the future
      // For now, fallback to direct entity access
      
      // This implementation fetches participation records and gets associated cohorts
      const { participation } = await import('../entities');
      const participationRecords = await participation.getParticipationRecords(userId);
      
      if (!participationRecords || participationRecords.length === 0) {
        return [];
      }
      
      // Get unique cohort IDs from participation records
      const cohortIds = [...new Set(
        participationRecords
          .filter(p => p.cohortId)
          .map(p => p.cohortId)
      )];
      
      // Fetch each cohort
      const cohortPromises = cohortIds.map(id => cohorts.getCohortById(id));
      const results = await Promise.all(cohortPromises);
      
      // Filter out null results (cohorts that might have been deleted)
      return results.filter(Boolean);
    },
    enabled: !!userId,
    ...options
  });
}

// Composite export for both modern and legacy hooks
export default {
  // Modern API-first hooks
  useCohortViaApi,
  useActiveCohortsViaApi,
  useCohortsByProgramViaApi,
  
  // Legacy hooks (now using App Router endpoints internally when available)
  useCohort,
  useCohortsByInstitution,
  useCohortsByProgram,
  useActiveCohorts,
  useUserCohorts
};