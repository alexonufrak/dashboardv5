/**
 * Data Hook Factory
 * 
 * Creates standardized React Query hooks with consistent
 * error handling, loading states, and caching policies.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
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
    
    // Return a unified interface supporting both naming conventions
    return {
      // Original interface
      execute: mutation.mutate,
      executeAsync: mutation.mutateAsync,
      isExecuting: mutation.isPending,
      error: mutation.error,
      reset: mutation.reset,
      result: mutation.data,
      
      // Standard TanStack Query interface
      mutate: mutation.mutate,
      mutateAsync: mutation.mutateAsync,
      isPending: mutation.isPending,
      
      // Provide the complete mutation for advanced use cases
      mutation
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

/**
 * Creates a composite profile hook that properly composes contact and education data
 * using TanStack Query dependent queries pattern
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Composite profile hook
 */
export function createProfileHook(options = {}) {
  return function useCompositeProfile() {
    const { 
      contactHook = null, 
      educationHook = null,
      queryClient,
      ...queryOptions 
    } = options;
    
    // Ensure we have the required hooks
    if (!contactHook || !educationHook) {
      throw new Error('contactHook and educationHook are required for createProfileHook');
    }
    
    // Use the provided hooks to fetch the underlying data
    const contactResult = contactHook();
    const { data: contact, isLoading: contactLoading, error: contactError } = contactResult;
    
    // Only fetch education if we have a contact with ID
    const educationResult = educationHook({
      // Only enable if we have a contactId
      enabled: Boolean(contact?.contactId || contact?.id) && !contactLoading,
      // Pass any additional options
      ...queryOptions.educationOptions
    });
    
    const { 
      data: education, 
      isLoading: educationLoading, 
      error: educationError 
    } = educationResult;
    
    // Compose the data into a unified profile
    const { 
      data: profile,
      isLoading: profileLoading,
      isError: profileError,
      error: profileErrorDetails,
      refetch: refetchProfile
    } = useQuery({
      queryKey: ['profile', 'composed', contact?.contactId || contact?.id],
      queryFn: () => {
        // Don't compute if missing data
        if (!contact) return null;
        
        // Combine the data
        return {
          // Contact data
          ...contact,
          // Education data
          education,
          // Additional computed fields
          hasCompletedProfile: Boolean(
            contact?.firstName && 
            contact?.lastName && 
            (education?.institutionName || education?.institution)
          ),
          // Metadata
          _composed: true,
          _updatedAt: new Date().toISOString()
        };
      },
      // Only run this query when we have the required data
      enabled: !contactLoading && 
               !educationLoading && 
               Boolean(contact) &&
               (queryOptions.alwaysEnabled || Boolean(education)),
      // Use a shorter staleTime since we're composing already-cached data
      staleTime: Math.min(
        contactResult.staleTime || 5 * 60 * 1000, 
        educationResult.staleTime || 5 * 60 * 1000,
        queryOptions.staleTime || 2 * 60 * 1000
      ),
    });
    
    // Provide a unified refetch function
    const refetchAll = useCallback(() => {
      contactResult.refetch();
      educationResult.refetch();
      refetchProfile();
    }, [contactResult.refetch, educationResult.refetch, refetchProfile]);
    
    // Return a standardized result object
    return {
      data: profile,
      isLoading: contactLoading || educationLoading || profileLoading,
      isError: Boolean(contactError || educationError || profileError),
      error: contactError || educationError || profileErrorDetails,
      refetch: refetchAll,
      // Also expose the individual results for advanced use cases
      contactResult,
      educationResult
    };
  };
}

export default {
  createDataHook,
  createActionHook,
  createHybridHook,
  createProfileHook
};