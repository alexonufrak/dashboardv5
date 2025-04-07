import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programs } from '../entities';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * App Router compatible hooks using the hook factory
 */

// Hook to fetch program details via App Router
export const useProgramDetailsViaApi = createDataHook({
  queryKey: (programId) => ['program', programId],
  endpoint: (programId) => `/api/programs/details-v2?programId=${programId}`,
  appRouter: true, // Use App Router endpoint
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load program details',
  normalizeData: (data) => data.program,
  enabled: (programId) => !!programId
});

// Hook to fetch program cohorts via App Router
export const useProgramCohortsViaApi = createDataHook({
  queryKey: (programId) => ['program', programId, 'cohorts'],
  endpoint: (programId) => `/api/programs/details-v2?programId=${programId}`,
  appRouter: true, // Use App Router endpoint
  staleTime: 5 * 60 * 1000, // 5 minutes 
  errorMessage: 'Failed to load program cohorts',
  normalizeData: (data) => data.cohorts || [],
  enabled: (programId) => !!programId
});

/**
 * Hook to fetch a single program by ID
 * @param {string} programId - The ID of the program to fetch
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useProgram(programId, options = {}) {
  // Always call all hooks to maintain hook rules
  const appRouterResult = useProgramDetailsViaApi(programId);
  const directQueryResult = useQuery({
    queryKey: ['program', programId, 'direct'],
    queryFn: () => programs.getProgramById(programId),
    enabled: !!programId && false, // Disable this query unless we need it
    ...options
  });
  
  // Return the App Router result if we have a programId, otherwise return the direct query
  if (programId) {
    return appRouterResult;
  }
  
  return directQueryResult;
}

/**
 * Hook to fetch programs by their institution ID
 * @param {string} institutionId - The ID of the institution
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of programs
 */
export function useProgramsByInstitution(institutionId, options = {}) {
  return useQuery({
    queryKey: ['programs', 'institution', institutionId],
    queryFn: async () => {
      try {
        // Use entity-based approach for now
        // No dedicated App Router endpoint yet for institution programs
        return await programs.getProgramsByInstitution(institutionId);
      } catch (error) {
        console.error(`Error fetching programs for institution ${institutionId}:`, error);
        throw error;
      }
    },
    enabled: !!institutionId,
    ...options
  });
}

/**
 * Hook to fetch all active programs 
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of active programs
 */
export function useActivePrograms(options = {}) {
  return useQuery({
    queryKey: ['programs', 'active'],
    queryFn: async () => {
      try {
        // Use entity-based approach for now
        // No dedicated App Router endpoint yet for active programs
        return await programs.getActiveInitiatives();
      } catch (error) {
        console.error('Error fetching active programs:', error);
        throw error;
      }
    },
    ...options
  });
}

/**
 * Hook to fetch programs that a user is participating in
 * @param {string} userId - The ID of the user
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of programs
 */
export function useUserPrograms(userId, options = {}) {
  return useQuery({
    queryKey: ['programs', 'user', userId],
    queryFn: async () => {
      try {
        // Implementation using participation records to determine programs
        // This could be a good candidate for a dedicated App Router endpoint in the future
        const { participation } = await import('../entities');
        const participationRecords = await participation.getParticipationRecords(userId);
        
        if (!participationRecords || participationRecords.length === 0) {
          return [];
        }
        
        // Get unique program IDs from participation records
        const programIds = [...new Set(
          participationRecords
            .filter(p => p.programId || p.initiativeId)
            .map(p => p.programId || p.initiativeId)
        )];
        
        // Fetch each program - using App Router endpoint where possible
        const results = await Promise.all(
          programIds.map(async (id) => {
            try {
              // Try API fetch first with fallback to direct entity
              const response = await fetch(`/api/programs/details-v2?programId=${id}`, {
                credentials: 'include',
                cache: 'no-store',
                next: { revalidate: 0 }
              });
              
              if (response.ok) {
                const data = await response.json();
                return data.program;
              }
              
              // Fallback to entity method
              return programs.getProgramById(id);
            } catch (error) {
              console.warn(`Error fetching program ${id}, falling back to entity:`, error);
              return programs.getProgramById(id);
            }
          })
        );
        
        // Filter out null results
        return results.filter(Boolean);
      } catch (error) {
        console.error(`Error fetching programs for user ${userId}:`, error);
        throw error;
      }
    },
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook to search programs by name or description
 * @param {string} searchQuery - The search term
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result containing an array of matching programs
 */
export function useSearchPrograms(searchQuery, options = {}) {
  return useQuery({
    queryKey: ['programs', 'search', searchQuery],
    queryFn: async () => {
      try {
        // Use entity-based approach for now
        // No dedicated App Router endpoint yet for program search
        return await programs.searchProgramsByName(searchQuery);
      } catch (error) {
        console.error(`Error searching programs with query "${searchQuery}":`, error);
        throw error;
      }
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
    ...options
  });
}

// Default export with all hooks
export default {
  // App Router compatible hooks
  useProgramDetailsViaApi,
  useProgramCohortsViaApi,
  
  // Legacy hooks (now using App Router endpoints where possible)
  useProgram,
  useProgramsByInstitution,
  useActivePrograms,
  useUserPrograms,
  useSearchPrograms
};