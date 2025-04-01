import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for user applications data
 * Uses the same API endpoint as the original useApplicationsData hook
 * but follows the DDD pattern
 * 
 * @returns {Object} Query result with user applications data
 */
export function useUserApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      console.log('Fetching applications data');
      
      try {
        const response = await fetch('/api/user/check-application', {
          cache: 'no-store',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Return applications array or empty array if not found
        return data && Array.isArray(data.applications) ? data.applications : [];
      } catch (error) {
        console.error('Applications data fetch error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

/**
 * Hook to check if a user has applied to a specific cohort
 * @param {string} cohortId - The cohort ID to check for applications
 * @returns {Object} Query result with application status
 */
export function useHasAppliedToCohort(cohortId) {
  const { data: applications, isLoading, error } = useUserApplications();
  
  // Create derived state to check if user has applied to this cohort
  const hasApplied = applications?.some(app => app.cohortId === cohortId) || false;
  const application = applications?.find(app => app.cohortId === cohortId) || null;
  
  return {
    hasApplied,
    application,
    applications,
    isLoading,
    error
  };
}

export default {
  useUserApplications,
  useHasAppliedToCohort
};