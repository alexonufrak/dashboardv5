/**
 * Education Hooks
 * Domain-specific hooks for accessing education data
 */
import { createDataHook } from './createDataHook';

/**
 * Hook for fetching the current user's education record
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
 * Hook for updating education information
 */
export const useUpdateEducation = createDataHook({
  queryKey: 'myEducation',
  endpoint: '/api/education/mine',
  updateFn: async (data) => {
    const response = await fetch('/api/education/mine', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update education information');
    }
    
    return response.json();
  },
  successMessage: 'Education information updated successfully',
  errorMessage: 'Failed to update education information'
});

/**
 * Hook for fetching a specific education record
 */
export const useEducation = createDataHook({
  queryKey: 'education',
  endpoint: '/api/education',
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 60 * 60 * 1000, // 60 minutes
  errorMessage: 'Failed to load education information',
  normalizeData: (data) => data
});

export default {
  useMyEducation,
  useUpdateEducation,
  useEducation
};