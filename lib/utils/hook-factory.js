/**
 * Data Hook Factory
 * 
 * Creates standardized React Query hooks with consistent
 * error handling, loading states, and caching policies.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Creates a standardized data fetching hook with consistent patterns
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Custom hook with data fetching capabilities
 */
export function createDataHook(options) {
  const {
    queryKey,
    endpoint,
    fetchFn,
    updateFn,
    refetchOnFocus = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    errorMessage = 'An error occurred',
    successMessage = 'Successfully updated',
    normalizeData = data => data,
    transformError = error => error?.message || errorMessage,
  } = options;
  
  // Return the custom hook
  return function useData(params = {}) {
    const queryClient = useQueryClient();
    
    // Default fetch function using the endpoint
    const defaultFetchFn = async () => {
      let url = endpoint;
      
      // Add query parameters if provided
      if (Object.keys(params).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        });
        url = `${endpoint}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch data');
      }
      
      const data = await response.json();
      return normalizeData(data);
    };
    
    // Use the provided fetch function or the default one
    const queryFn = fetchFn || defaultFetchFn;
    
    // Create the query with consistent configuration
    const query = useQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, params],
      queryFn,
      staleTime,
      gcTime: cacheTime,
      refetchOnWindowFocus: refetchOnFocus,
      retry: (failureCount, error) => {
        // Don't retry authentication errors or bad requests
        if (error?.status === 401 || error?.status === 400) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      }
    });
    
    // Default update function
    const defaultUpdateFn = async (data) => {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update data');
      }
      
      return normalizeData(await response.json());
    };
    
    // Create mutation (always create it, but conditionally use it)
    const mutation = useMutation({
      mutationFn: updateFn || defaultUpdateFn || (async () => ({})),
      onSuccess: (data) => {
        // Only run if we have an update function
        if (updateFn || defaultUpdateFn) {
          // Invalidate the query cache
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
          
          // Show success message
          if (successMessage) {
            toast.success(successMessage);
          }
        }
        
        return data;
      },
      onError: (error) => {
        // Only show error if we have an update function
        if (updateFn || defaultUpdateFn) {
          // Show error message
          toast.error(transformError(error));
        }
        
        return error;
      }
    });
    
    // Return a consistent interface
    return {
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      update: updateFn || defaultUpdateFn ? mutation.mutate : undefined,
      isUpdating: updateFn || defaultUpdateFn ? mutation.isPending : false,
      updateAsync: updateFn || defaultUpdateFn ? mutation.mutateAsync : undefined,
    };
  };
}

/**
 * Creates a hook for executing specific actions beyond simple CRUD
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Custom hook that returns an execute function
 */
export function createActionHook(options) {
  const {
    actionKey,
    endpoint,
    method = 'POST',
    successMessage = 'Action completed successfully',
    errorMessage = 'Failed to complete action',
    invalidateKeys = [],
    transformError = error => error?.message || errorMessage,
  } = options;
  
  return function useAction() {
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
      mutationKey: [actionKey],
      
      mutationFn: async (data) => {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Action failed');
        }
        
        return response.json();
      },
      
      onSuccess: (result, variables) => {
        // Display success message
        if (successMessage) {
          const message = typeof successMessage === 'function' 
            ? successMessage(result, variables)
            : successMessage;
            
          toast.success(message);
        }
        
        // Invalidate related queries
        invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
        
        return result;
      },
      
      onError: (error, variables) => {
        // Display error message
        const message = typeof errorMessage === 'function'
          ? errorMessage(error, variables)
          : transformError(error);
          
        toast.error(message);
        
        return error;
      }
    });
    
    return {
      execute: mutation.mutate,
      executeAsync: mutation.mutateAsync,
      isExecuting: mutation.isPending,
      error: mutation.error,
      reset: mutation.reset,
      result: mutation.data
    };
  };
}

/**
 * Creates a hook that combines entity-based and API-based data fetching
 * Useful for transitioning from direct Airtable access to API endpoints
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Custom hook with dual data fetching capabilities
 */
export function createHybridHook(options) {
  const {
    queryKey,
    endpoint,
    entityFn,
    entityParams = [],
    preferApi = true,
    fallbackToEntity = true,
    normalizeApiData = data => data,
    normalizeEntityData = data => data,
    ...restOptions
  } = options;
  
  return function useHybridData(params = {}) {
    const queryClient = useQueryClient();
    
    // Create the query with dual fetching capability
    const query = useQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, params],
      
      queryFn: async () => {
        // Try API first if preferred
        if (preferApi) {
          try {
            let url = endpoint;
            
            // Add query parameters if provided
            if (Object.keys(params).length > 0) {
              const queryParams = new URLSearchParams();
              Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  queryParams.append(key, value);
                }
              });
              url = `${endpoint}?${queryParams.toString()}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return normalizeApiData(data);
          } catch (error) {
            // If API fails and fallback is enabled, try entity function
            if (fallbackToEntity && entityFn) {
              console.log('API fetch failed, falling back to entity', error);
              const data = await entityFn(...entityParams);
              return normalizeEntityData(data);
            }
            throw error;
          }
        } 
        // Try entity function first
        else {
          try {
            if (!entityFn) {
              throw new Error('No entity function provided');
            }
            
            const data = await entityFn(...entityParams);
            return normalizeEntityData(data);
          } catch (error) {
            // If entity fails and fallback is enabled, try API
            if (fallbackToEntity && endpoint) {
              console.log('Entity fetch failed, falling back to API', error);
              
              let url = endpoint;
              
              // Add query parameters if provided
              if (Object.keys(params).length > 0) {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                  if (value !== undefined && value !== null) {
                    queryParams.append(key, value);
                  }
                });
                url = `${endpoint}?${queryParams.toString()}`;
              }
              
              const response = await fetch(url);
              
              if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
              }
              
              const data = await response.json();
              return normalizeApiData(data);
            }
            throw error;
          }
        }
      },
      
      ...restOptions
    });
    
    // Return a consistent interface
    return {
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    };
  };
}

export default {
  createDataHook,
  createActionHook,
  createHybridHook
};