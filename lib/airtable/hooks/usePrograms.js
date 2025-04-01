import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programs } from '../entities';

/**
 * Hook to fetch a single program by ID
 * @param {string} programId - The ID of the program to fetch
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useProgram(programId, options = {}) {
  return useQuery({
    queryKey: ['program', programId],
    queryFn: () => programs.getProgramById(programId),
    enabled: !!programId,
    ...options
  });
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
    queryFn: () => programs.getProgramsByInstitution(institutionId),
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
    queryFn: () => programs.getActiveInitiatives(),
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
      // Implementation using participation records to determine programs
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
      
      // Fetch each program
      const programPromises = programIds.map(id => programs.getProgramById(id));
      const results = await Promise.all(programPromises);
      
      // Filter out null results
      return results.filter(Boolean);
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
    queryFn: () => programs.searchProgramsByName(searchQuery),
    enabled: !!searchQuery && searchQuery.length >= 2,
    ...options
  });
}