/**
 * useEducation.js
 * React Query hooks for the Education domain
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import * as educationEntities from '../entities/education';

/**
 * Hook for fetching the current user's education record
 */
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

/**
 * Hook for updating the current user's education
 */
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
    }
  });
}

/**
 * Hook for fetching a specific education record by ID
 */
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

/**
 * Factory-based hook for education data
 */
export const useEducationData = createDataHook({
  queryKey: (educationId) => ['education', educationId],
  endpoint: (educationId) => `/api/education/${educationId}`,
  enabled: (educationId) => !!educationId,
  staleTime: 10 * 60 * 1000, // 10 minutes
  normalizeData: (data) => data.education
});

/**
 * Factory-based hook for updating education
 */
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
  }
});

export default {
  useMyEducation,
  useUpdateEducation,
  useEducation,
  useEducationData,
  useEducationUpdate
};