import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resources } from '../entities';

/**
 * Hook to fetch resources by program/initiative ID
 * @param {string} programId - The ID of the program/initiative
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useProgramResources(programId, options = {}) {
  return useQuery({
    queryKey: ['resources', 'program', programId],
    queryFn: () => resources.getResourcesByProgram(programId),
    enabled: !!programId,
    ...options
  });
}

/**
 * Hook to fetch resources by cohort ID
 * @param {string} cohortId - The ID of the cohort
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useCohortResources(cohortId, options = {}) {
  return useQuery({
    queryKey: ['resources', 'cohort', cohortId],
    queryFn: () => resources.getResourcesByCohort(cohortId),
    enabled: !!cohortId,
    ...options
  });
}

/**
 * Hook to fetch global resources
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useGlobalResources(options = {}) {
  return useQuery({
    queryKey: ['resources', 'global'],
    queryFn: () => resources.getGlobalResources(),
    ...options
  });
}

/**
 * Hook to fetch a resource by ID
 * @param {string} resourceId - The ID of the resource
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useResource(resourceId, options = {}) {
  return useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => resources.getResourceById(resourceId),
    enabled: !!resourceId,
    ...options
  });
}

/**
 * Hook that combines all available resources for a user
 * @param {string} programId - The program ID (optional)
 * @param {string} cohortId - The cohort ID (optional)
 * @param {Object} options - Additional React Query options
 * @returns {Object} The combined query result
 */
export function useAllAvailableResources(programId, cohortId, options = {}) {
  const globalResourcesQuery = useGlobalResources(options);
  
  const programResourcesQuery = useProgramResources(programId, {
    ...options,
    enabled: !!programId && (options.enabled !== false)
  });
  
  const cohortResourcesQuery = useCohortResources(cohortId, {
    ...options,
    enabled: !!cohortId && (options.enabled !== false)
  });

  // Combine the results
  const data = [
    ...(globalResourcesQuery.data || []),
    ...(programResourcesQuery.data || []),
    ...(cohortResourcesQuery.data || [])
  ];

  // Deduplicate by ID
  const uniqueResources = data.reduce((acc, resource) => {
    if (!acc[resource.id]) {
      acc[resource.id] = resource;
    }
    return acc;
  }, {});

  return {
    data: Object.values(uniqueResources),
    isLoading: globalResourcesQuery.isLoading || 
               (programId && programResourcesQuery.isLoading) || 
               (cohortId && cohortResourcesQuery.isLoading),
    error: globalResourcesQuery.error || 
           programResourcesQuery.error || 
           cohortResourcesQuery.error,
    queries: {
      global: globalResourcesQuery,
      program: programResourcesQuery,
      cohort: cohortResourcesQuery
    }
  };
}

/**
 * Hook to create a new resource
 * @returns {Object} The mutation result
 */
export function useCreateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resourceData) => resources.createResource(resourceData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['resources', 'global']);
      
      if (variables.programId) {
        queryClient.invalidateQueries(['resources', 'program', variables.programId]);
      }
      
      if (variables.cohortId) {
        queryClient.invalidateQueries(['resources', 'cohort', variables.cohortId]);
      }
      
      // Add the new resource to the cache
      if (data && data.id) {
        queryClient.setQueryData(['resource', data.id], data);
      }
    }
  });
}

/**
 * Hook to update an existing resource
 * @returns {Object} The mutation result
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ resourceId, updateData }) => 
      resources.updateResource(resourceId, updateData),
    onSuccess: (data) => {
      if (data) {
        // Update the resource in the cache
        queryClient.setQueryData(['resource', data.id], data);
        
        // Invalidate related queries
        queryClient.invalidateQueries(['resources', 'global']);
        
        if (data.programId) {
          queryClient.invalidateQueries(['resources', 'program', data.programId]);
        }
        
        if (data.cohortId) {
          queryClient.invalidateQueries(['resources', 'cohort', data.cohortId]);
        }
      }
    }
  });
}

/**
 * Hook to delete a resource
 * @returns {Object} The mutation result
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resourceId) => resources.deleteResource(resourceId),
    onSuccess: (data) => {
      if (data) {
        // Remove the resource from the cache
        queryClient.removeQueries(['resource', data.id]);
        
        // Invalidate related queries
        queryClient.invalidateQueries(['resources', 'global']);
        
        if (data.programId) {
          queryClient.invalidateQueries(['resources', 'program', data.programId]);
        }
        
        if (data.cohortId) {
          queryClient.invalidateQueries(['resources', 'cohort', data.cohortId]);
        }
      }
    }
  });
}