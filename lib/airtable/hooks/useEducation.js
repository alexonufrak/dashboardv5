/**
 * useEducation.js
 * API-first React Query hooks for the Education domain
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';
import { useEffect } from 'react';
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
  appRouter: true, // Use App Router endpoint
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
  appRouter: true, // Use App Router endpoint
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
  errorMessage: 'Failed to load education information',
  appRouter: true // Use App Router endpoint
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
export function useMyEducation(options = {}) {
  const { user } = useUser();
  const userId = user?.sub;
  const queryClient = useQueryClient();
  const { refresh = false } = options;
  
  // Allow forced refresh by invalidating the cache beforehand
  useEffect(() => {
    if (refresh) {
      console.log('Force refreshing education data');
      queryClient.invalidateQueries({ queryKey: ['education'] });
    }
  }, [refresh, queryClient]);
  
  return useQuery({
    queryKey: ['education', 'user', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User must be authenticated');
      }
      
      console.log('Fetching education data from API');
      
      // Use App Router endpoint format (no trailing slash)
      // Add refresh parameter to bypass server-side cache if needed
      const url = refresh 
        ? '/api/education/mine?refresh=true' 
        : '/api/education/mine';
      
      const response = await fetch(url, {
        cache: 'no-store', // Ensure we don't use cached responses
        credentials: 'include', // Include cookies for Auth0 session
        next: { revalidate: 0 } // No Next.js caching (use React Query's cache)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch education: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Education data fetched successfully:', data.education?.exists);
      return data.education;
    },
    enabled: !!userId,
    staleTime: refresh ? 0 : 5 * 60 * 1000, // No stale time when refreshing
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.status === 401 || error?.message?.includes('authenticated')) {
        return false;
      }
      
      // Retry other errors once
      return failureCount < 1;
    }
  });
}

// Legacy hook for updating education
export function useUpdateEducation() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.sub;
  
  return useMutation({
    mutationFn: async (data) => {
      // Use App Router endpoint format (no trailing slash)
      const response = await fetch('/api/education/mine', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for Auth0 session
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
      // Invalidate composite keys 
      queryClient.invalidateQueries({ queryKey: ['profile', 'composed'] });
    },
    onError: (error) => {
      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update education:', error);
      }
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
      
      // Use App Router endpoint format (no trailing slash)
      const response = await fetch(`/api/education/${educationId}`, {
        credentials: 'include', // Include cookies for Auth0 session
        cache: 'no-store', // Ensure we don't use Next.js cache
        next: { revalidate: 0 } // No Next.js caching (use React Query's cache)
      });
      
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
    // Use App Router endpoint format (no trailing slash)
    // This is a legacy endpoint and should be migrated to /api/education/mine eventually
    const response = await fetch('/api/education/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies for Auth0 session
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Failed to update education');
    }
    
    return response.json();
  },
  invalidateQueries: (data, queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['education', data.educationId] });
    if (data.userId) {
      queryClient.invalidateQueries({ queryKey: ['education', 'user', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', data.userId] });
    }
    
    // Invalidate all possible cache keys
    queryClient.invalidateQueries({ queryKey: ['education', 'current'] });
    queryClient.invalidateQueries({ queryKey: ['profile', 'current'] });
    queryClient.invalidateQueries({ queryKey: ['profile', 'composed'] });
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