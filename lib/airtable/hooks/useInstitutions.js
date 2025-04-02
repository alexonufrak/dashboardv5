import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * Custom hook for fetching institution data
 * @param {string} institutionId Institution ID
 * @returns {Object} Query result with institution data
 */
export function useInstitution(institutionId) {
  return useQuery({
    queryKey: ['institution', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        throw new Error('Institution ID is required');
      }
      
      console.log(`Fetching institution data for ID: ${institutionId}`);
      
      const response = await fetch(`/api/institutions/${institutionId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch institution: ${response.status}`);
      }
      
      const data = await response.json();
      return data.institution || null;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - institution data rarely changes
    enabled: !!institutionId
  });
}

/**
 * Custom hook for searching institutions by name
 * @param {string} query Search query
 * @param {Object} options Query options
 * @returns {Object} Query result with institution search results
 */
export function useInstitutionSearch(query, options = {}) {
  const { limit = 10, enabled = true } = options;
  
  return useQuery({
    queryKey: ['institutions', 'search', query, limit],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { institutions: [], count: 0 };
      }
      
      console.log(`Searching institutions for: "${query}"`);
      
      const response = await fetch(`/api/institutions?q=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to search institutions: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        institutions: data.institutions || [],
        count: data.count || 0
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: enabled && !!query && query.length >= 2
  });
}

/**
 * Factory-based hook for institution partnerships
 */
export const useInstitutionPartnerships = createDataHook({
  queryKey: (institutionId) => ['partnerships', 'institution', institutionId],
  endpoint: (institutionId) => `/api/institutions/${institutionId}/partnerships`,
  enabled: (institutionId) => !!institutionId,
  staleTime: 10 * 60 * 1000, // 10 minutes
  normalizeData: (data) => data.partnerships || []
});

export default {
  useInstitution,
  useInstitutionSearch,
  useInstitutionPartnerships
};