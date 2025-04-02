/**
 * Cohorts Hooks
 * Domain-specific hooks for accessing cohort data
 */
import { createDataHook } from './createDataHook';

/**
 * Hook for fetching public cohorts
 * @param {boolean} currentOnly - Whether to fetch only current cohorts
 */
export const usePublicCohorts = (currentOnly = false) => createDataHook({
  queryKey: ['publicCohorts', { currentOnly }],
  endpoint: '/api/cohorts/public',
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  errorMessage: 'Failed to load public cohorts',
  refetchOnFocus: false,
  normalizeData: (data) => data.cohorts || []
})();

/**
 * Hook for fetching current public cohorts
 */
export const useCurrentCohorts = () => createDataHook({
  queryKey: 'currentCohorts',
  endpoint: '/api/cohorts/public?current=true',
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  errorMessage: 'Failed to load current cohorts',
  refetchOnFocus: false,
  normalizeData: (data) => data.cohorts || []
})();

/**
 * Hook for fetching a specific cohort by ID
 * @param {string} cohortId - The ID of the cohort to fetch
 */
export const useCohort = (cohortId) => {
  if (!cohortId) {
    return {
      data: null,
      isLoading: false,
      isError: false,
      error: null
    };
  }
  
  return createDataHook({
    queryKey: ['cohort', cohortId],
    endpoint: `/api/cohorts/${cohortId}`,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    errorMessage: `Failed to load cohort details for ${cohortId}`,
    refetchOnFocus: false,
    normalizeData: (data) => data.cohort || null
  })();
};

export default {
  usePublicCohorts,
  useCurrentCohorts,
  useCohort
};