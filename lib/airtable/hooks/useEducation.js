/**
 * useEducation.js
 * API-first React Query hooks for the Education domain
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * Primary API-based hooks using the hook factory
 */

// Hook for fetching the current user's education via API
export const useEducationViaApi = createDataHook({
  queryKey: ['education', 'current'],
  endpoint: '/api/education/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your education information',
  refetchOnFocus: true,
  retry: (failureCount, error) => {
    // Don't retry auth errors
    if (error?.status === 401) return false;
    
    // Retry network/timeout errors
    if (!error?.status || error.status >= 500) {
      return failureCount < 3;
    }
    
    // Default retry behavior
    return failureCount < 2;
  },
  normalizeData: (data) => data.education
});

// Hook for updating the current user's education via API
export const useUpdateEducationViaApi = createActionHook({
  actionKey: ['education', 'update'],
  endpoint: '/api/education/mine',
  method: 'PATCH',
  successMessage: 'Education information updated successfully',
  errorMessage: 'Failed to update education information',
  invalidateKeys: [
    ['education', 'current'],
    ['profile', 'current']
  ]
});

// Hook for fetching education by ID via API
export const useEducationByIdViaApi = createDataHook({
  queryKey: (educationId) => ['education', educationId],
  endpoint: (educationId) => `/api/education/${educationId}`,
  enabled: (educationId) => !!educationId,
  staleTime: 10 * 60 * 1000, // 10 minutes
  normalizeData: (data) => data.education,
  errorMessage: 'Failed to load education information'
});

/**
 * Utility hooks for cache management
 */
export function useInvalidateEducation() {
  const queryClient = useQueryClient();
  
  return {
    invalidateMyEducation: () => {
      queryClient.invalidateQueries({ queryKey: ['education', 'current'] });
    },
    invalidateEducationById: (educationId) => {
      queryClient.invalidateQueries({ queryKey: ['education', educationId] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] });
    }
  };
}

/**
 * Legacy hooks for backward compatibility
 */

// Legacy hook for the current user's education
export function useMyEducation() {
  const { user } = useUser();
  const userId = user?.sub;
  
  return useQuery({
    queryKey: ['education', 'user', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User must be authenticated');
      }
      
      const response = await fetch('/api/education/mine');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch education: ${response.status}`);
      }
      
      const data = await response.json();
      return data.education;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
}

// Legacy hook for updating education
export function useUpdateEducation() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.sub;
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/education/mine', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update education: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['education', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      // Also invalidate the new API-based cache keys
      queryClient.invalidateQueries({ queryKey: ['education', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'current'] });
    }
  });
}

// Legacy hook for fetching education by ID
export function useEducation(educationId, options = {}) {
  return useQuery({
    queryKey: ['education', educationId],
    queryFn: async () => {
      if (!educationId) {
        throw new Error('Education ID is required');
      }
      
      const response = await fetch(`/api/education/${educationId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch education: ${response.status}`);
      }
      
      const data = await response.json();
      return data.education;
    },
    enabled: !!educationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

// Legacy factory-based hooks (maintained for backward compatibility)
export const useEducationData = useEducationByIdViaApi;

// Legacy update hook with compatibility shim
export const useEducationUpdate = createActionHook({
  mutationFn: async (data) => {
    const response = await fetch('/api/education/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update education');
    }
    
    return response.json();
  },
  invalidateQueries: (data, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['education', data.educationId] });
    if (data.userId) {
      queryClient.invalidateQueries({ queryKey: ['education', 'user', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', data.userId] });
    }
    // Also invalidate the new API-based cache keys
    queryClient.invalidateQueries({ queryKey: ['education', 'current'] });
    queryClient.invalidateQueries({ queryKey: ['profile', 'current'] });
  }
});

// Composite export for both modern and legacy hooks
export default {
  // Modern API-first hooks
  useEducationViaApi,
  useUpdateEducationViaApi,
  useEducationByIdViaApi,
  useInvalidateEducation,
  
  // Legacy hooks for backward compatibility
  useMyEducation,
  useUpdateEducation,
  useEducation,
  useEducationData,
  useEducationUpdate
};