import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for cohort milestone data
 * Uses the same API endpoint as the original useMilestoneData hook
 * but follows the DDD pattern
 * 
 * @param {string} cohortId - The cohort ID to fetch milestones for
 * @returns {Object} Query result with milestone data
 */
export function useCohortMilestones(cohortId) {
  return useQuery({
    queryKey: ['milestones', cohortId],
    queryFn: async () => {
      console.log(`Fetching milestones for cohort ${cohortId}`);
      
      if (!cohortId) {
        console.log('No cohortId provided for milestone fetch, skipping');
        return { milestones: [] };
      }
      
      try {
        const response = await fetch(`/api/cohorts/${cohortId}/milestones`, {
          cache: 'no-store',
          credentials: 'include'
        });
        
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch milestones: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Milestone API response: Found ${data.milestones?.length || 0} milestones`);
        
        return data;
      } catch (error) {
        console.error('Milestone data fetch error:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!cohortId,
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('Rate limit')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    }
  });
}

/**
 * Custom hook for user's current milestones
 * This combines participation data with milestone data to get currently relevant milestones
 * 
 * @param {Object} participationData - The user's participation data
 * @returns {Object} Query result with active milestones
 */
export function useCurrentMilestones(participationData) {
  // Extract cohort ID from participation data if available
  const cohortId = participationData?.participation?.[0]?.cohort?.id;
  
  // Use the base hook but only enable if we have a cohort ID
  return useCohortMilestones(cohortId);
}

export default {
  useCohortMilestones,
  useCurrentMilestones
};