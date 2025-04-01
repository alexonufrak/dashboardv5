import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Custom hook for user participation data
 * @returns {Object} Query result with participation data
 */
export function useParticipation() {
  return useQuery({
    queryKey: ['participation'],
    queryFn: async () => {
      console.log('Fetching participation data from API');
      
      try {
        const response = await fetch('/api/user/participation', {
          // Use browser's cache for performance but validate with server
          cache: 'no-cache',
          credentials: 'include' // Include cookies for Auth0 session
        });
        
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch participation: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Loaded ${data.participation?.length || 0} participation records`);
        
        return data;
      } catch (error) {
        console.error('Participation data fetch error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('Rate limit')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
    retryDelay: 3000, // 3 second delay between retries
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });
}

/**
 * Custom hook for participation data for a specific program/initiative
 * @param {string} programId Program/initiative ID
 * @returns {Object} Query result with filtered participation data
 */
export function useProgramParticipation(programId) {
  const participationQuery = useParticipation();
  
  // Calculate derived data specific to this program
  const filteredData = useMemo(() => {
    const data = participationQuery.data;
    
    if (!data || !data.participation || !programId) {
      return {
        participation: [],
        hasParticipation: false
      };
    }
    
    // Filter participation records for this program
    const records = data.participation.filter(p => 
      p.initiative?.id === programId || 
      p.cohort?.initiativeId === programId
    );
    
    return {
      participation: records,
      hasParticipation: records.length > 0,
      _meta: data._meta
    };
  }, [participationQuery.data, programId]);
  
  return {
    ...participationQuery,
    data: filteredData
  };
}

/**
 * Custom hook for participation data for a specific cohort
 * @param {string} cohortId Cohort ID
 * @returns {Object} Query result with filtered participation data
 */
export function useCohortParticipation(cohortId) {
  const participationQuery = useParticipation();
  
  // Calculate derived data specific to this cohort
  const filteredData = useMemo(() => {
    const data = participationQuery.data;
    
    if (!data || !data.participation || !cohortId) {
      return {
        participation: [],
        hasParticipation: false
      };
    }
    
    // Filter participation records for this cohort
    const records = data.participation.filter(p => 
      p.cohort?.id === cohortId
    );
    
    return {
      participation: records,
      hasParticipation: records.length > 0,
      _meta: data._meta
    };
  }, [participationQuery.data, cohortId]);
  
  return {
    ...participationQuery,
    data: filteredData
  };
}

export default {
  useParticipation,
  useProgramParticipation,
  useCohortParticipation
};