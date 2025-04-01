import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cohorts } from '../entities';

/**
 * Hook to fetch a single cohort by ID
 * @param {string} cohortId - The ID of the cohort to fetch
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useCohort(cohortId, options = {}) {
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: () => cohorts.getCohortById(cohortId),
    enabled: !!cohortId,
    ...options
  });
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
    queryFn: () => cohorts.getCohortsByInstitution(institutionId),
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
}

/**
 * Hook to fetch active cohorts (that are currently accepting applications)
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of active cohorts
 */
export function useActiveCohorts(options = {}) {
  return useQuery({
    queryKey: ['cohorts', 'active'],
    queryFn: () => cohorts.getCurrentCohorts(),
    ...options
  });
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