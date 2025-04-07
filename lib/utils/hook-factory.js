/**
 * Data Hook Factory
 * 
 * Creates standardized React Query hooks with consistent
 * error handling, loading states, and caching policies.
 * 
 * Added support for App Router endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Normalize API endpoint paths for compatibility with both Pages Router and App Router
 * 
 * @param {string} endpoint - Original endpoint path
 * @param {boolean} appRouter - Whether to force App Router format
 * @returns {string} Normalized endpoint path
 */
function normalizeEndpointPath(endpoint, appRouter = false) {
  // Skip if not a string or already has the right format
  if (typeof endpoint !== 'string') return endpoint;
  
  // If already in App Router format (no trailing slash needed)
  if (endpoint.includes('/api/') && !endpoint.endsWith('/')) {
    return endpoint;
  }
  
  // For dynamic paths with parameters
  if (typeof endpoint === 'function') {
    return (...args) => {
      const path = endpoint(...args);
      return normalizeEndpointPath(path, appRouter);
    };
  }
  
  // Convert Pages Router to App Router format if requested
  if (appRouter && endpoint.startsWith('/api/')) {
    // Remove trailing slash if present (App Router doesn't use it)
    return endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  }
  
  return endpoint;
}

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
    appRouter = false, // New option to enforce App Router endpoints
    retry,
    retryDelay,
    enabled
  } = options;
  
  // Normalize the endpoint path
  const normalizedEndpoint = normalizeEndpointPath(endpoint, appRouter);
  
  // Return the custom hook
  return function useData(params = {}) {
    const queryClient = useQueryClient();
    
    // Default fetch function using the endpoint
    const defaultFetchFn = async () => {
      // Handle function-based endpoints (for dynamic routes)
      let url = typeof normalizedEndpoint === 'function' 
        ? normalizedEndpoint(params)
        : normalizedEndpoint;
      
      // Handle query parameters
      if (Object.keys(params).length > 0 && !url.includes('?')) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'enabled') {
            queryParams.append(key, value);
          }
        });
        
        const queryString = queryParams.toString();
        if (queryString) {
          url = `${url}?${queryString}`;
        }
      }
      
      // Make the request with credential inclusion for auth
      const response = await fetch(url, {
        credentials: 'include', // Include auth cookies
        cache: 'no-store', // Prefer React Query's caching over Next.js
      });
      
      if (!response.ok) {
        // Handle and parse error responses
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || errorData.error || 'Failed to fetch data');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      
      const data = await response.json();
      return normalizeData(data);
    };
    
    // Default retry function with improved behavior
    const defaultRetry = (failureCount, error) => {
      // Don't retry authentication errors or bad requests
      if (error?.status === 401 || error?.status === 400) {
        return false;
      }
      // Retry network/timeout errors more aggressively
      if (!error?.status || error?.status >= 500) {
        return failureCount < 3;
      }
      // Default retry behavior
      return failureCount < 2;
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
      retry: retry || defaultRetry,
      retryDelay,
      enabled: enabled !== undefined ? (typeof enabled === 'function' ? enabled(params) : enabled) : true,
    });
    
    // Default update function
    const defaultUpdateFn = async (data) => {
      // Handle function-based endpoints (for dynamic routes)
      const url = typeof normalizedEndpoint === 'function' 
        ? normalizedEndpoint(data)
        : normalizedEndpoint;
        
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include auth cookies
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || errorData.error || 'Failed to update data');
        error.status = response.status;
        error.data = errorData;
        throw error;
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
      
      // Add additional React Query properties for advanced usage
      status: query.status,
      fetchStatus: query.fetchStatus,
      isFetching: query.isFetching,
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
    appRouter = false, // New option to enforce App Router endpoints
  } = options;
  
  // Normalize the endpoint path
  const normalizedEndpoint = normalizeEndpointPath(endpoint, appRouter);
  
  return function useAction() {
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
      mutationKey: [actionKey],
      
      mutationFn: async (data) => {
        // Handle function-based endpoints (for dynamic routes)
        const url = typeof normalizedEndpoint === 'function' 
          ? normalizedEndpoint(data)
          : normalizedEndpoint;
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include auth cookies
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          // Extract detailed error information
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.message || errorData.error || 'Action failed');
          error.status = response.status;
          error.data = errorData;
          throw error;
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
        
        // Add debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Action error:', error);
        }
        
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
      
      // Add status and related properties
      status: mutation.status,
      isSuccess: mutation.isSuccess,
      
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
    appRouter = false, // New option to enforce App Router endpoints
    ...restOptions
  } = options;
  
  // Normalize the endpoint path
  const normalizedEndpoint = normalizeEndpointPath(endpoint, appRouter);
  
  return function useHybridData(params = {}) {
    const queryClient = useQueryClient();
    
    // Create the query with dual fetching capability
    const query = useQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, params],
      
      queryFn: async () => {
        // Try API first if preferred
        if (preferApi) {
          try {
            // Handle function-based endpoints (for dynamic routes)
            let url = typeof normalizedEndpoint === 'function' 
              ? normalizedEndpoint(params)
              : normalizedEndpoint;
            
            // Add query parameters if provided
            if (Object.keys(params).length > 0 && !url.includes('?')) {
              const queryParams = new URLSearchParams();
              Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && key !== 'enabled') {
                  queryParams.append(key, value);
                }
              });
              
              const queryString = queryParams.toString();
              if (queryString) {
                url = `${url}?${queryString}`;
              }
            }
            
            const response = await fetch(url, {
              credentials: 'include', // Include auth cookies
              cache: 'no-store', // Prefer React Query's caching over Next.js
            });
            
            if (!response.ok) {
              // Extract detailed error information
              const errorData = await response.json().catch(() => ({}));
              const error = new Error(errorData.message || errorData.error || `API request failed: ${response.status}`);
              error.status = response.status;
              error.data = errorData;
              throw error;
            }
            
            const data = await response.json();
            return normalizeApiData(data);
          } catch (error) {
            // If API fails and fallback is enabled, try entity function
            if (fallbackToEntity && entityFn) {
              console.log('API fetch failed, falling back to entity', error);
              const data = await entityFn(...(Array.isArray(entityParams) ? entityParams : [entityParams]));
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
            
            const data = await entityFn(...(Array.isArray(entityParams) ? entityParams : [entityParams]));
            return normalizeEntityData(data);
          } catch (error) {
            // If entity fails and fallback is enabled, try API
            if (fallbackToEntity && normalizedEndpoint) {
              console.log('Entity fetch failed, falling back to API', error);
              
              // Handle function-based endpoints (for dynamic routes)
              let url = typeof normalizedEndpoint === 'function' 
                ? normalizedEndpoint(params)
                : normalizedEndpoint;
              
              // Add query parameters if provided
              if (Object.keys(params).length > 0 && !url.includes('?')) {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && key !== 'enabled') {
                    queryParams.append(key, value);
                  }
                });
                
                const queryString = queryParams.toString();
                if (queryString) {
                  url = `${url}?${queryString}`;
                }
              }
              
              const response = await fetch(url, {
                credentials: 'include', // Include auth cookies
                cache: 'no-store', // Prefer React Query's caching over Next.js
              });
              
              if (!response.ok) {
                // Extract detailed error information
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.message || errorData.error || `API request failed: ${response.status}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
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
      
      // Add additional React Query properties for advanced usage
      status: query.status,
      fetchStatus: query.fetchStatus,
      isFetching: query.isFetching,
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
      appRouter = false, // New option to enforce App Router endpoints
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
      refetch: refetchProfile,
      status: profileStatus,
      fetchStatus: profileFetchStatus
    } = useQuery({
      queryKey: ['profile', 'composed', contact?.contactId || contact?.id],
      queryFn: () => {
        // Don't compute if missing data
        if (!contact) return null;
        
        // Combine the data into a unified profile object
        return {
          // Core contact data
          ...contact,
          // Education data as sub-object
          education,
          
          // IMPORTANT: Include flat education fields for backward compatibility
          educationId: education?.id || education?.educationId,
          institutionName: education?.institutionName,
          institution: education?.institution,
          degreeType: education?.degreeType,
          graduationYear: education?.graduationYear,
          graduationSemester: education?.graduationSemester,
          major: education?.major,
          majorName: education?.majorName,
          
          // Computed fields
          hasCompletedProfile: Boolean(
            contact?.firstName && 
            contact?.lastName && 
            (education?.institutionName || education?.institution)
          ),
          
          // Metadata
          _composed: true,
          _updatedAt: new Date().toISOString(),
          _appRouter: appRouter
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
      // Core React Query properties
      data: profile,
      isLoading: contactLoading || educationLoading || profileLoading,
      isError: Boolean(contactError || educationError || profileError),
      error: contactError || educationError || profileErrorDetails,
      refetch: refetchAll,
      
      // Additional React Query status properties
      status: profileStatus,
      fetchStatus: profileFetchStatus,
      
      // Also expose the individual results for advanced use cases
      contactResult,
      educationResult,
      
      // Component data
      contact,
      education,
      
      // Loading states
      contactLoading,
      educationLoading,
      isComposing: profileLoading && !contactLoading && !educationLoading
    };
  };
}

export default {
  createDataHook,
  createActionHook,
  createHybridHook,
  createProfileHook
};