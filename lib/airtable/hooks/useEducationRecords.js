/**
 * Education Hooks
 * Domain-specific hooks for accessing education records
 */
import { createDataHook } from '@/lib/utils/hook-factory';
import { useQuery } from '@tanstack/react-query';
import { education } from '../entities';

/**
 * Hook for fetching a user's education records directly from Airtable
 * @param {string} userId - User ID (Auth0 sub)
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useEducationByUser(userId, options = {}) {
  return useQuery({
    queryKey: ['education', 'user', userId],
    queryFn: () => education.getEducationHistoryByUser(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (education data changes infrequently)
    ...options
  });
}

/**
 * Hook for fetching the current user's education record via API
 */
export const useMyEducation = createDataHook({
  queryKey: 'myEducation',
  endpoint: '/api/education/mine',
  staleTime: 10 * 60 * 1000, // 10 minutes (education data changes infrequently)
  cacheTime: 60 * 60 * 1000, // 60 minutes
  errorMessage: 'Failed to load your education information',
  successMessage: 'Education information updated successfully',
  refetchOnFocus: false,
  normalizeData: (data) => data
});

/**
 * Hook for fetching a specific education record
 * @param {string} recordId - Education record ID
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useEducationRecord(recordId, options = {}) {
  return useQuery({
    queryKey: ['education', 'record', recordId],
    queryFn: () => education.getEducationRecordById(recordId),
    enabled: !!recordId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

/**
 * Hook for fetching all available majors
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result with array of majors
 */
export function useAllMajors(options = {}) {
  return useQuery({
    queryKey: ['education', 'majors'],
    queryFn: async () => {
      const response = await fetch('/api/user/majors');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch majors: ${response.status}`);
      }
      
      const data = await response.json();
      return data.majors || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (majors change very infrequently)
    ...options
  });
}

export default {
  useEducationByUser,
  useMyEducation,
  useEducationRecord,
  useAllMajors
};