import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractTeamData } from './utils'

/**
 * Helper function to get user-specific query key
 * This ensures each user has their own isolated cache
 */
const getUserQueryKey = (baseKey) => {
  const userId = typeof window !== 'undefined' ? window._userId : null;
  // If we have a user ID, include it in the query key for cache isolation
  return userId ? [baseKey, userId] : [baseKey];
};

/**
 * Custom hook for profile data fetching with caching
 * Uses the protected /api/user/profile endpoint
 */
export function useProfileData() {
  return useQuery({
    queryKey: getUserQueryKey('profile'),
    queryFn: async () => {
      console.log('Fetching profile data');
      
      try {
        // Call the protected API endpoint - Auth0 handles authentication
        const response = await fetch('/api/user/profile', {
          // No need for extra authentication headers - Auth0 handles it with cookies
          cache: 'no-store', // Ensure we don't use cached responses
          credentials: 'include' // Include cookies for Auth0 session 
        });
        
        // Handle error responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `Failed to fetch profile: ${response.status}`);
        }
        
        // Parse the response
        const data = await response.json();
        
        // Handle the wrapped response structure
        return data.profile || data;
      } catch (error) {
        console.error('Profile data fetch error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    // Indicate this query requires authentication
    meta: { requiresAuth: true }
  });
}

/**
 * Custom hook for teams data fetching with caching
 */
export function useTeamsData() {
  return useQuery({
    queryKey: getUserQueryKey('teams'),
    queryFn: async () => {
      console.log('Fetching teams data')
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams data')
      }
      const data = await response.json()
      return data.teams || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

/**
 * Custom hook for applications data fetching with caching
 */
export function useApplicationsData() {
  return useQuery({
    queryKey: getUserQueryKey('applications'),
    queryFn: async () => {
      console.log('Fetching applications data')
      const response = await fetch('/api/user/check-application')
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data && Array.isArray(data.applications) ? data.applications : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

/**
 * Custom hook for program participation data fetching with optimized caching
 */
export function useProgramData() {
  return useQuery({
    queryKey: getUserQueryKey('participation'),
    queryFn: async ({ signal }) => {
      console.log('Fetching participation data');
      
      try {
        // Use cache-first then network strategy for optimal performance
        // This leverages browser's HTTP cache while still ensuring freshness
        const response = await fetch('/api/user/participation', { 
          signal,
          cache: 'default' // Use browser's cache first, then network if stale
        });
        
        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 10;
          console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
          throw new Error('Rate limit exceeded');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch participation data: ${response.statusText}`);
        }
        
        // Parse response with error handling
        try {
          const data = await response.json();
          console.log(`Successfully loaded participation data with ${data.participation?.length || 0} records`);
          return data;
        } catch (e) {
          console.error('Failed to parse participation response as JSON:', e);
          throw new Error('Invalid response format from participation API');
        }
      } catch (error) {
        // Special handling for AbortError (request cancellation)
        if (error.name === 'AbortError') {
          console.log('Participation request was canceled');
          throw error;
        }
        
        console.error('Error in participation data fetch:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - increased to reduce API pressure
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection time
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('Rate limit')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
    retryDelay: 3000, // 3 second delay between retries
    refetchOnWindowFocus: false, // Disable refetching on window focus
    keepPreviousData: true, // Keep previous data while fetching new data
  });
}

/**
 * Custom hook for milestone data fetching with optimized caching
 */
export function useMilestoneData(cohortId) {
  // Get the user-specific base key
  const userBaseKey = getUserQueryKey('milestones')[0];
  const userId = typeof window !== 'undefined' ? window._userId : null;
  
  return useQuery({
    queryKey: userId ? ['milestones', userId, cohortId] : ['milestones', cohortId],
    queryFn: async ({ signal }) => {
      console.log(`Fetching milestones for cohort ${cohortId}`);
      
      if (!cohortId) {
        console.log('No cohortId provided for milestone fetch, skipping');
        return { milestones: [] };
      }
      
      try {
        // Use no cache breakers to leverage server caching
        console.log(`Making milestone API request to: /api/cohorts/${cohortId}/milestones`);
        const response = await fetch(`/api/cohorts/${cohortId}/milestones`, { signal });
        
        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 10;
          console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
          throw new Error('Rate limit exceeded');
        }
        
        if (!response.ok) {
          console.error(`Failed to fetch milestones: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch milestones: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Milestone API response: Found ${data.milestones?.length || 0} milestones`);
        
        // Check if the data includes cache information
        if (data._meta?.cached) {
          console.log(`Using cached milestone data from server (processing time: ${data._meta.totalProcessingTime || 'unknown'}ms)`);
        }
        
        return data;
      } catch (error) {
        // Special handling for AbortError (request cancellation)
        if (error.name === 'AbortError') {
          console.log('Milestones request was canceled');
          throw error;
        }
        
        console.error('Error in milestones data fetch:', error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - milestones rarely change
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
    enabled: !!cohortId,
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('Rate limit')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
    retryDelay: 3000, // 3 second delay between retries
    refetchOnWindowFocus: false, // Disable refetching on window focus
    keepPreviousData: true, // Keep previous data while fetching
  });
}

/**
 * Custom hook for team submissions data fetching
 * Simplified implementation with standardized response format and error handling
 */
export function useTeamSubmissions(teamId, milestoneId) {
  const queryClient = useQueryClient();
  
  return useQuery({
    // Use simplified query key structure
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async ({ signal }) => {
      // Skip if missing required teamId
      if (!teamId) {
        return { submissions: [] };
      }
      
      // Create URL with milestone filter if provided
      const url = `/api/teams/${teamId}/submissions${milestoneId ? `?milestoneId=${milestoneId}` : ''}`;
      
      console.log(`Fetching submissions for team ${teamId}${milestoneId ? ` and milestone ${milestoneId}` : ''}`);
      
      try {
        // Make API call with cache: 'default' to use browser's HTTP caching
        const response = await fetch(url, { 
          signal,
          cache: 'default' // Use browser's built-in HTTP cache
        });
        
        // Handle HTTP errors
        if (!response.ok) {
          console.error(`Error fetching submissions: ${response.status}`);
          throw new Error(`API returned ${response.status}`);
        }
        
        // Parse response data
        const data = await response.json();
        
        // Check for API-level errors
        if (data.meta?.error) {
          console.error(`API error: ${data.meta.errorCode || 'UNKNOWN'} - ${data.meta.errorMessage || 'Unknown error'}`);
          throw new Error(data.meta.errorMessage || 'API error');
        }
        
        // Pre-populate the cache for specific milestone queries when all submissions are fetched
        // This provides a performance optimization by avoiding extra API calls
        if (!milestoneId && data.submissions && data.submissions.length > 0) {
          // Group submissions by milestone
          const submissionsByMilestone = data.submissions.reduce((acc, submission) => {
            if (submission.milestoneId) {
              if (!acc[submission.milestoneId]) {
                acc[submission.milestoneId] = [];
              }
              acc[submission.milestoneId].push(submission);
            }
            return acc;
          }, {});
          
          // Update cache for each milestone's submissions
          Object.entries(submissionsByMilestone).forEach(([mId, submissions]) => {
            // Only update if not already in cache
            if (!queryClient.getQueryData(['submissions', teamId, mId])) {
              queryClient.setQueryData(['submissions', teamId, mId], {
                submissions,
                meta: {
                  ...data.meta,
                  count: submissions.length,
                  filters: {
                    teamId,
                    milestoneId: mId
                  },
                  fromPrePopulation: true
                }
              });
            }
          });
        }
        
        return data;
      } catch (error) {
        // Handle request cancellation
        if (error.name === 'AbortError') {
          console.log('Submissions request was canceled');
          throw error;
        }
        
        console.error('Error fetching submissions:', error);
        
        // Return empty array with error metadata
        return { 
          submissions: [],
          meta: {
            error: true,
            errorMessage: error.message || 'Error fetching submissions',
            timestamp: new Date().toISOString()
          }
        };
      }
    },
    // Optimize cache settings for client-side caching
    staleTime: 3 * 60 * 1000, // 3 minutes before background refresh
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!teamId, // Only run query if teamId is provided
    refetchOnMount: true, // Refresh data when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retryOnMount: true, // Retry failed queries when component mounts
    // Only retry if not a rate limit error
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error?.message?.includes('Rate limit') || 
          error?.message?.includes('429')) {
        return false;
      }
      // For other errors, retry up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
  });
}

/**
 * Custom hook for team cohorts data fetching with caching
 */
export function useTeamCohorts(teamId) {
  const userId = typeof window !== 'undefined' ? window._userId : null;
  
  return useQuery({
    queryKey: userId ? ['teamCohorts', userId, teamId] : ['teamCohorts', teamId],
    queryFn: async () => {
      console.log(`Fetching cohorts for team ${teamId}`)
      if (!teamId) return { cohorts: [] }
      
      const response = await fetch(`/api/teams/${teamId}/cohorts?_t=${new Date().getTime()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team cohorts: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Team cohorts API response:`, data)
      
      // Return the full response object for better debugging
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!teamId,
    retry: 2
  })
}

/**
 * Custom hook for majors data fetching with caching
 */
export function useMajors() {
  return useQuery({
    queryKey: getUserQueryKey('majors'),
    queryFn: async () => {
      console.log('Fetching majors data')
      const response = await fetch('/api/user/majors')
      
      if (!response.ok) {
        throw new Error('Failed to fetch majors')
      }
      
      const data = await response.json()
      return data.majors || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour - majors rarely change
    retry: 2
  })
}

/**
 * Update profile data and invalidate cache
 */
/**
 * Update user profile data with optimistic updates and error handling
 * @param {Object} updatedData - The profile data to update
 * @param {Object} queryClient - React Query client for cache management
 * @returns {Promise<Object>} The updated profile data
 */
/**
 * Updated profile mutation hook that follows TanStack Query best practices
 * Uses the useMutation hook with proper optimistic updates and callbacks
 */
/**
 * Profile update mutation hook following TanStack Query best practices
 * 
 * This hook provides:
 * 1. Optimistic UI updates for immediate feedback
 * 2. Robust error handling with automatic rollback
 * 3. Proper cache invalidation after mutations
 * 4. Support for the alternative auth approach for PATCH requests
 * 
 * @returns {UseMutationResult} TanStack Query mutation result
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedData) => {
      console.log('Starting profile update');
      
      // Clean and validate the data to be sent to the API
      const dataToSend = { 
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        degreeType: updatedData.degreeType,
        graduationYear: updatedData.graduationYear,
        contactId: updatedData.contactId,
        institutionId: updatedData.institutionId,
        educationId: updatedData.educationId,
        major: null // Default to null, will be updated below if needed
      };
      
      // Handle the major field (which needs special treatment)
      if (updatedData.major !== undefined) {
        if (typeof updatedData.major === 'string' && updatedData.major.startsWith('rec')) {
          dataToSend.major = updatedData.major;
        } else if (updatedData.major === null || 
                 (typeof updatedData.major === 'string' && updatedData.major.trim() === '')) {
          dataToSend.major = null; // Explicitly set null for clearing
        } else if (updatedData.programId && 
                 typeof updatedData.programId === 'string' && 
                 updatedData.programId.startsWith('rec')) {
          dataToSend.major = updatedData.programId;
        }
      }
      
      // Use absolute URL to ensure HTTPS is used consistently
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hub.xfoundry.org';
      const apiUrl = new URL('/api/user/profile', baseUrl).toString();
      
      console.log(`Making profile update request to: ${apiUrl}`);
      
      // Log debug info about cookies before PATCH request
      console.log('Current document.cookie length:', document.cookie?.length || 0);
      console.log('Cookie names (sanitized):', document.cookie.split(';').map(c => c.split('=')[0].trim()).join(', '));
      
      // For debugging: check if cookies are present in browser
      if (typeof document !== 'undefined') {
        console.log('Browser cookie state before fetch:', {
          hasCookies: !!document.cookie,
          cookieLength: document.cookie.length,
          hasSidebarState: document.cookie.includes('sidebar_state'),
          hasAppSession: document.cookie.includes('appSession')
        });
      }
      
      // Make the API request using fully configured fetch for Auth0 authentication
      // Try multiple token storage locations for maximum compatibility
      let authHeader = {};
      let authToken = null;
      
      if (typeof window !== 'undefined') {
        try {
          // Try sessionStorage first (primary storage)
          authToken = sessionStorage.getItem('auth0.id_token');
          
          if (!authToken) {
            // Fall back to localStorage if needed
            authToken = localStorage.getItem('auth0.id_token');
            if (authToken) console.log('Found id_token in localStorage');
          } else {
            console.log('Found id_token in sessionStorage');
          }
          
          // If still no token, try cookie storage
          if (!authToken) {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === 'auth0Token') {
                authToken = value;
                console.log('Found id_token in cookie');
                break;
              }
            }
          }
          
          // Final fallback: try to parse from session data
          if (!authToken) {
            try {
              const sessionData = JSON.parse(sessionStorage.getItem('auth0.session') || '{}');
              if (sessionData.id_token) {
                authToken = sessionData.id_token;
                console.log('Found id_token in auth0.session');
              }
            } catch (parseError) {
              console.warn('Could not parse session data:', parseError);
            }
          }
          
          // Set the Authorization header if we found a token
          if (authToken) {
            authHeader = {
              "Authorization": `Bearer ${authToken}`
            };
            // Also add user ID if available
            const userId = window._userId || localStorage.getItem('auth0.user_id');
            if (userId) {
              authHeader["X-User-ID"] = userId;
            }
          }
        } catch (e) {
          console.warn('Error retrieving auth token:', e);
        }
      }
      
      // For profile update, use POST with _method=PATCH as workaround for PATCH issues
      // Some browsers and environments have issues with PATCH method and cookie handling
      const method = "POST";
      const modifiedData = {
        ...dataToSend,
        _method: "PATCH" // Signal to server this should be treated as PATCH
      };
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
          "X-Debug-SameSite": "Using both cookies and Authorization header",
          "X-HTTP-Method-Override": "PATCH" // Standard header to indicate true method
        },
        credentials: 'include', // Essential for sending auth cookies
        cache: 'no-store', // Prevent caching of auth requests
        mode: 'cors', // Explicitly use CORS mode for cross-origin requests
        body: JSON.stringify(modifiedData)
      });
      
      // Handle error responses by throwing errors that will be caught by onError
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Profile update API error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      const data = await response.json();
      
      // Extract profile data (handle both wrapped and unwrapped responses)
      const profileData = data.profile || data;
      
      console.log('Profile update successful');
      
      return profileData;
    },
    
    // Step 2: Optimistic update - update the UI before the API call completes
    onMutate: async (updatedData) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      
      // Snapshot the previous value for rollback in case of error
      const previousProfileData = queryClient.getQueryData(['profile']);
      
      // Log the optimistic update for debugging
      console.log('Applying optimistic profile update:', {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName
      });
      
      // Optimistically update the cache with the new value
      queryClient.setQueryData(['profile'], (oldData) => {
        // Create a merged object with old data + updates
        const optimisticData = {
          ...(oldData || {}),
          ...updatedData,
          // If updating major, also update programId for UI consistency
          programId: updatedData.major || oldData?.programId,
          // Mark as optimistic for debugging
          _optimistic: true,
          _updatedAt: new Date().toISOString()
        };
        
        return optimisticData;
      });
      
      // Return context object for potential rollback
      return { previousProfileData };
    },
    
    // Step 3: Error handling - roll back if the API call fails
    onError: (error, variables, context) => {
      console.error("Profile update error:", error);
      
      // Roll back to the previous value if available
      if (context?.previousProfileData) {
        console.log('Rolling back optimistic update due to error');
        queryClient.setQueryData(['profile'], context.previousProfileData);
      }
      
      // Show error message to the user
      toast.error(error.message || "Failed to update profile");
    },
    
    // Step 4: Success handling - update cache and show confirmation
    onSuccess: (data, variables) => {
      console.log('Profile update succeeded, finalizing cache update');
      
      // Update the cache with the actual server response
      // This ensures the UI shows exactly what the server has
      queryClient.setQueryData(['profile'], (oldData) => {
        return {
          ...(oldData || {}),
          ...data,
          // Make sure programId is consistent with major
          programId: data.major || data.programId || oldData?.programId,
          // Remove optimistic flag
          _optimistic: false,
          // Add server update timestamp
          _serverUpdatedAt: new Date().toISOString()
        };
      });
      
      // Show success message
      toast.success("Profile updated successfully");
    },
    
    // Step 5: Cleanup - invalidate queries to ensure fresh data
    onSettled: (data, error, variables) => {
      console.log('Profile mutation completed, invalidating affected queries');
      
      // Invalidate all queries that might display profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Also invalidate any related queries that show profile data
      queryClient.invalidateQueries({ queryKey: ['participation'] });
      
      // Force a refetch to ensure all components have consistent data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['profile'] });
      }, 100);
    }
  });
}

/* 
// Legacy function for backward compatibility
// Keeping as reference while migrating to the new hook-based approach
export async function updateProfileData(updatedData, queryClient) {
  console.log("Using legacy updateProfileData function - consider migrating to useUpdateProfile hook");
  
  // Create a transaction ID to track this specific update
  const transactionId = `profile-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`Starting profile update transaction ${transactionId}`);
  
  // Store the previous profile data for rollback if needed
  let previousProfileData = null;
  try {
    previousProfileData = queryClient.getQueryData(['profile']);
  } catch (cacheError) {
    console.warn(`Unable to retrieve previous profile data for rollback: ${cacheError.message}`);
  }
  
  // ... [rest of the old implementation]
}
*/

// Legacy function for backward compatibility
export async function updateProfileData(updatedData, queryClient) {
  console.log("Using legacy updateProfileData function - consider migrating to useUpdateProfile hook");
  
  // Create a transaction ID to track this specific update
  const transactionId = `profile-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`Starting profile update transaction ${transactionId}`);
  
  // Store the previous profile data for rollback if needed
  let previousProfileData = null;
  try {
    previousProfileData = queryClient.getQueryData(['profile']);
  } catch (cacheError) {
    console.warn(`Unable to retrieve previous profile data for rollback: ${cacheError.message}`);
  }
  
  try {
    // Create a clean copy of the data that we can safely modify
    const dataToSend = { 
      firstName: updatedData.firstName,
      lastName: updatedData.lastName,
      degreeType: updatedData.degreeType,
      graduationYear: updatedData.graduationYear,
      contactId: updatedData.contactId,
      institutionId: updatedData.institutionId,
      educationId: updatedData.educationId
    };
    
    // Handle the major field carefully (it needs special treatment since it's a linked record)
    if (updatedData.major !== undefined) {
      // Ensure it's a valid Airtable record ID
      if (typeof updatedData.major === 'string' && updatedData.major.startsWith('rec')) {
        dataToSend.major = updatedData.major;
      } else if (typeof updatedData.major === 'string' && updatedData.major.trim() === '') {
        // Allow empty string or null for clearing the major
        dataToSend.major = null;
      } else if (updatedData.major === null) {
        // Allow explicit null value
        dataToSend.major = null;
      } else {
        console.warn(`Major field has invalid format: "${updatedData.major}"`);
        // Use programId if available as fallback
        if (updatedData.programId && typeof updatedData.programId === 'string' && updatedData.programId.startsWith('rec')) {
          console.log(`Using programId instead: ${updatedData.programId}`);
          dataToSend.major = updatedData.programId;
        } else {
          // Don't show warning toast in UI as it may be confusing to users
          // Just log the issue and skip this field
          console.log("Major field will not be updated");
        }
      }
    }
    
    // Log the cleaned data being sent
    console.log(`[${transactionId}] Sending profile update with valid data:`, {
      firstName: dataToSend.firstName,
      lastName: dataToSend.lastName,
      major: dataToSend.major || "(not included)",
      contactId: dataToSend.contactId
    });
    
    // Update the cache optimistically (before the API call completes)
    const optimisticUpdate = {
      ...previousProfileData,
      ...dataToSend,
      // Map fields to match the profile structure
      firstName: dataToSend.firstName,
      lastName: dataToSend.lastName,
      major: typeof dataToSend.major === 'string' ? dataToSend.major : previousProfileData?.major,
      degreeType: dataToSend.degreeType || previousProfileData?.degreeType,
      graduationYear: dataToSend.graduationYear || previousProfileData?.graduationYear,
      // Include a flag to track this as an optimistic update
      _optimistic: true,
      _transactionId: transactionId
    };
    
    // Apply the optimistic update to the cache
    queryClient.setQueryData(['profile'], optimisticUpdate);
    
    // Send the request with the cleaned data - using PATCH to only update specified fields
    console.log(`[${transactionId}] Initiating profile update API request...`);
    
    // Wrap the fetch in a retry mechanism for transient failures
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let response = null;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        // Make the API request with credentials explicitly included to send cookies
        // Add Auth0 session info to an HTTP header if available to ensure authentication remains
        const authHeaders = {
          "Content-Type": "application/json",
          "X-Transaction-ID": transactionId, // Add transaction ID for tracing
          "X-Auth-Verification": "true" // Signal this is an authenticated request
        };
        
        // Try to get any localStorage auth token (for debugging purposes)
        if (typeof window !== 'undefined') {
          try {
            // Check for common auth token location
            const authToken = localStorage.getItem('auth0_token');
            if (authToken) {
              console.log("Found localStorage auth token, including it in request header");
              authHeaders['Authorization'] = `Bearer ${authToken}`;
            }
          } catch (e) {
            console.warn("Could not access localStorage for auth token");
          }
        }
        // Log cookies before legacy fallback request
        console.log(`[${transactionId}] Legacy profile update - cookies length:`, document.cookie?.length || 0);
        
        // Use absolute URL to ensure consistent protocol (HTTPS)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hub.xfoundry.org';
        const apiUrl = new URL('/api/user/profile', baseUrl).toString();
        
        response = await fetch(apiUrl, {
          method: "PATCH",
          headers: authHeaders,
          credentials: 'include', // Explicitly include cookies with the request
          mode: 'cors', // Explicitly use CORS mode for cross-origin requests
          body: JSON.stringify(dataToSend),
          // Use AbortController with reasonable timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        // If successful, break the retry loop
        break;
      } catch (fetchError) {
        retryCount++;
        console.warn(`[${transactionId}] Fetch attempt ${retryCount} failed: ${fetchError.message}`);
        
        // If it's a timeout or network error and we have retries left, try again
        if (retryCount <= MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          continue;
        }
        
        // If we've used all retries, rollback the optimistic update and throw
        if (previousProfileData) {
          queryClient.setQueryData(['profile'], previousProfileData);
        }
        
        throw new Error(`Network error when updating profile: ${fetchError.message}`);
      }
    }
    
    // Check for response errors
    if (!response.ok) {
      // Rollback optimistic update on error
      if (previousProfileData) {
        queryClient.setQueryData(['profile'], previousProfileData);
      }
      
      // Handle different status codes appropriately
      if (response.status === 401) {
        console.error(`[${transactionId}] Authentication error when updating profile - status 401`);
        // Try to parse the error response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || "Session expired. Please log in again.");
        } catch (parseError) {
          // If we can't parse the response, provide a generic authentication error
          throw new Error("Session expired or invalid. Please refresh the page and try again.");
        }
      } else if (response.status === 405) {
        console.error(`[${transactionId}] Method not allowed error - status 405`);
        throw new Error("Method not allowed. This may be a bug in the application. Please try again later.");
      } else {
        // For other error types, try to parse the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Failed to update profile: ${response.status}`);
        } catch (parseError) {
          // If we can't parse the JSON, use the status text
          throw new Error(`Failed to update profile: ${response.statusText || response.status}`);
        }
      }
    }
    
    // Parse the successful response
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.warn(`[${transactionId}] Error parsing response JSON: ${jsonError.message}`);
      // Even if we can't parse the response, the update may have succeeded
      // We'll keep the optimistic update in place and return it
      console.log(`[${transactionId}] Returning optimistic update as fallback`);
      // Remove the optimistic update flags
      const { _optimistic, _transactionId, ...result } = optimisticUpdate;
      return result;
    }
    
    // Extract profile from response if it's wrapped, otherwise use the whole response
    const updatedProfile = data.profile || data;
    
    // Update cache with the real data from the server
    queryClient.setQueryData(['profile'], updatedProfile);
    
    // Show success message (not during silent refreshes)
    toast.success("Profile updated successfully");
    
    console.log(`[${transactionId}] Profile update completed successfully`);
    return updatedProfile;
  } catch (err) {
    console.error(`[${transactionId}] Error updating profile:`, err);
    
    // Roll back optimistic update on error, if we have previous data
    if (previousProfileData) {
      queryClient.setQueryData(['profile'], previousProfileData);
    }
    
    // Show error toast
    toast.error(err.message || "Failed to update profile");
    
    // Re-throw for the component to handle
    throw err;
  }
}

/**
 * Update team data and invalidate cache
 */
export async function updateTeamData(teamId, data, queryClient) {
  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH", // Using PATCH as defined in the TeamEditDialog.js
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // Explicitly include cookies for session authentication
      body: JSON.stringify(data),
    })
    
    // Get the text first to properly handle the response
    const responseText = await response.text()
    
    // Parse the JSON only if there's actually content
    let updatedTeam
    try {
      updatedTeam = responseText ? JSON.parse(responseText) : {}
    } catch (jsonError) {
      console.error("Error parsing response JSON:", jsonError)
      throw new Error("Invalid response from server")
    }
    
    if (!response.ok) {
      throw new Error(updatedTeam.error || `Failed to update team (${response.status})`)
    }
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    // Also invalidate any team cohorts cache that might exist for this team
    queryClient.invalidateQueries({ queryKey: ['teamCohorts', teamId] })
    
    toast.success("Team updated successfully")
    return updatedTeam
  } catch (err) {
    console.error("Error updating team:", err)
    toast.error(err.message || "Failed to update team")
    throw err
  }
}

/**
 * Invite team member and invalidate cache
 */
export async function inviteTeamMember(teamId, inviteData, queryClient) {
  try {
    const response = await fetch(`/api/teams/${teamId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include', // Explicitly include cookies for session authentication
      body: JSON.stringify(inviteData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to send invitation")
    }
    
    const result = await response.json()
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    toast.success(`Invitation sent to ${inviteData.firstName} ${inviteData.lastName}`)
    return result
  } catch (err) {
    console.error("Error inviting team member:", err)
    toast.error(err.message || "Failed to send invitation")
    throw err
  }
}

/**
 * Create a new team
 */
export async function createTeam(teamData, cohortId, queryClient) {
  try {
    // Construct the URL with cohortId if provided
    let url = '/api/teams/create'
    if (cohortId) {
      url = `${url}?cohortId=${encodeURIComponent(cohortId)}`
    }
    
    // Log the team data
    console.log("Creating team with data:", teamData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Explicitly include cookies for session authentication
      body: JSON.stringify(teamData)
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to create team')
    }
    
    const team = await response.json()
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    toast.success("Team created successfully")
    return team
  } catch (err) {
    console.error("Error creating team:", err)
    toast.error(err.message || "Failed to create team")
    throw err
  }
}

/**
 * useMutation hook for creating a team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ teamData, cohortId }) => createTeam(teamData, cohortId, queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })
}

/**
 * Custom hook for user metadata fetching with caching
 */
export function useUserMetadata() {
  return useQuery({
    queryKey: getUserQueryKey('userMetadata'),
    queryFn: async () => {
      console.log('Fetching user metadata')
      const response = await fetch('/api/user/metadata')
      if (!response.ok) {
        throw new Error('Failed to fetch user metadata')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - metadata changes infrequently
    retry: 2
  })
}

/**
 * Custom hook for updating user metadata with automatic cache invalidation
 */
export function useUpdateUserMetadata() {
  const queryClient = useQueryClient()
  const userId = typeof window !== 'undefined' ? window._userId : null;
  
  return useMutation({
    mutationFn: async (metadata) => {
      console.log('Updating user metadata', metadata)
      const response = await fetch('/api/user/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Explicitly include cookies for session authentication
        body: JSON.stringify(metadata),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update user metadata')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Update the cached data with user-specific key
      const cacheKey = userId ? ['userMetadata', userId] : ['userMetadata'];
      queryClient.setQueryData(cacheKey, data)
      toast.success('User preferences updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update preferences')
    }
  })
}

/**
 * Custom hook for updating onboarding status with automatic cache invalidation
 */
export function useUpdateOnboardingStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (status) => {
      console.log('Updating onboarding status', status)
      const response = await fetch('/api/user/onboarding-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Explicitly include cookies for session authentication
        body: JSON.stringify({ completed: status }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update onboarding status')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userMetadata'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Onboarding progress updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update onboarding progress')
    }
  })
}

/**
 * Custom hook for institution lookup with caching
 */
export function useInstitutionLookup(query) {
  return useQuery({
    queryKey: ['institutionLookup', query],
    queryFn: async () => {
      if (!query || query.length < 3) return { institutions: [] }
      
      console.log(`Looking up institutions for "${query}"`)
      const response = await fetch(`/api/institution-lookup?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Failed to lookup institutions')
      }
      
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // 1 hour - institution data rarely changes
    enabled: !!query && query.length >= 3,
    retry: 1
  })
}

/**
 * Custom hook for checking initiative conflicts
 */
export function useInitiativeConflicts(contactId, initiativeName) {
  const userId = typeof window !== 'undefined' ? window._userId : null;
  
  return useQuery({
    queryKey: userId 
      ? ['initiativeConflicts', userId, contactId, initiativeName] 
      : ['initiativeConflicts', contactId, initiativeName],
    queryFn: async () => {
      if (!contactId) return { conflicts: [] }
      
      console.log(`Checking initiative conflicts for contact ${contactId} and initiative ${initiativeName || 'all'}`)
      
      // Use cache during navigation - the global cache invalidation on page refresh
      // in _app.js will ensure we get fresh data after a reload
      const url = initiativeName 
        ? `/api/user/check-initiative-conflicts?contactId=${contactId}&initiative=${encodeURIComponent(initiativeName)}`
        : `/api/user/check-initiative-conflicts?contactId=${contactId}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to check initiative conflicts')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - same as API cache
    gcTime: 30 * 60 * 1000, // 30 minutes - persist during session (renamed from cacheTime)
    enabled: !!contactId,
    retry: 1
  })
}

/**
 * Custom hook for fetching point transactions with caching
 * @param {string} contactId - Optional contact ID to filter transactions
 * @param {string} teamId - Optional team ID to filter transactions
 */
export function usePointTransactions(contactId, teamId) {
  const userId = typeof window !== 'undefined' ? window._userId : null;

  return useQuery({
    queryKey: userId 
      ? ['pointTransactions', userId, contactId, teamId] 
      : ['pointTransactions', contactId, teamId],
    queryFn: async () => {
      console.log(`Fetching point transactions - contactId: ${contactId || 'all'}, teamId: ${teamId || 'all'}`)
      
      // Build query parameters based on filters
      const params = new URLSearchParams()
      if (contactId) params.append('contactId', contactId)
      if (teamId) params.append('teamId', teamId)
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`/api/points/transactions${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch point transactions: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.transactions || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable if at least one filter is provided
    enabled: !!(contactId || teamId),
    retry: 2
  })
}

/**
 * Custom hook for fetching achievements with caching
 */
export function useAchievements() {
  return useQuery({
    queryKey: getUserQueryKey('achievements'),
    queryFn: async () => {
      console.log('Fetching achievements')
      
      const response = await fetch('/api/points/achievements')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.achievements || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour - achievements don't change often
    retry: 2
  })
}

/**
 * Custom hook for fetching available rewards with caching
 */
export function useAvailableRewards() {
  return useQuery({
    queryKey: getUserQueryKey('rewards'),
    queryFn: async () => {
      console.log('Fetching available rewards')
      
      const response = await fetch('/api/rewards')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.rewards || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - rewards availability can change
    retry: 2
  })
}

/**
 * Custom hook for fetching claimed rewards with caching
 * @param {string} contactId - Optional contact ID to filter claimed rewards
 * @param {string} teamId - Optional team ID to filter claimed rewards
 */
export function useClaimedRewards(contactId, teamId) {
  const userId = typeof window !== 'undefined' ? window._userId : null;

  return useQuery({
    queryKey: userId 
      ? ['claimedRewards', userId, contactId, teamId] 
      : ['claimedRewards', contactId, teamId],
    queryFn: async () => {
      console.log(`Fetching claimed rewards - contactId: ${contactId || 'all'}, teamId: ${teamId || 'all'}`)
      
      // Build query parameters based on filters
      const params = new URLSearchParams()
      if (contactId) params.append('contactId', contactId)
      if (teamId) params.append('teamId', teamId)
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`/api/rewards/claimed${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch claimed rewards: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.claimedRewards || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable if at least one filter is provided
    enabled: !!(contactId || teamId),
    retry: 2
  })
}

/**
 * Custom hook for claiming a reward with automatic cache invalidation
 */
export function useClaimReward() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ rewardId, teamId, contactId, notes }) => {
      console.log(`Claiming reward: ${rewardId}`)
      
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Explicitly include cookies for session authentication
        body: JSON.stringify({
          rewardId,
          teamId,
          contactId,
          notes
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to claim reward')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['claimedRewards'] })
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] }) // Points may be affected
      
      toast.success('Reward claimed successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to claim reward')
    }
  })
}

/**
 * Custom hook for creating milestone submissions with proper cache invalidation
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, milestoneId, fileUrls, link, comments }) => {
      console.log(`Creating submission for teamId=${teamId}, milestoneId=${milestoneId}`);
      
      // Validate required fields
      if (!teamId || !milestoneId) {
        throw new Error("Team ID and milestone ID are required");
      }
      
      // Either file URLs or link is required
      if ((!fileUrls || fileUrls.length === 0) && !link) {
        throw new Error("Please provide either files or a link for your submission");
      }
      
      // Create the submission
      const response = await fetch('/api/teams/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Explicitly include cookies for session authentication
        body: JSON.stringify({
          teamId,
          milestoneId,
          fileUrls: fileUrls || [],
          link: link || '',
          comments: comments || ''
        })
      });
      
      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create submission');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Extract the teamId and milestoneId from the variables
      const { teamId, milestoneId } = variables;
      
      // Invalidate all submissions for this team
      queryClient.invalidateQueries({ 
        queryKey: ['submissions', teamId]
      });
      
      // Invalidate the specific milestone submission
      if (milestoneId) {
        queryClient.invalidateQueries({
          queryKey: ['submissions', teamId, milestoneId]
        });
      }
      
      // Trigger event for components to update
      const submissionEvent = new CustomEvent('milestoneSubmissionUpdated', {
        detail: {
          milestoneId,
          teamId,
          success: true
        }
      });
      
      window.dispatchEvent(submissionEvent);
      
      // Show success message
      toast.success('Submission created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create submission');
    }
  });
}

/**
 * Function to invalidate all cached data
 */
export function invalidateAllData(queryClient) {
  // Get the current user ID
  const userId = typeof window !== 'undefined' ? window._userId : null;
  console.log(`Invalidating all data for user: ${userId ? userId.substring(0, 8) + '...' : 'unknown'}`);
  
  // If we have a user ID, invalidate user-specific queries
  if (userId) {
    // Invalidate all user-specific queries
    [
      'profile',
      'teams',
      'applications',
      'participation',
      'milestones',
      'submissions',
      'teamCohorts',
      'majors',
      'userMetadata',
      'pointTransactions',
      'achievements',
      'rewards',
      'claimedRewards'
    ].forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key, userId] });
    });
    
    // Also invalidate any submissions queries that use a more complex key structure
    queryClient.invalidateQueries({ 
      queryKey: ['submissions', userId],
      exact: false // This will match any query that starts with ['submissions', userId]
    });
    
    // Also invalidate any milestones queries that use a more complex key structure
    queryClient.invalidateQueries({ 
      queryKey: ['milestones', userId],
      exact: false // This will match any query that starts with ['milestones', userId]
    });
  } else {
    // Fallback to invalidating without user ID if no user is available
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    queryClient.invalidateQueries({ queryKey: ['applications'] })
    queryClient.invalidateQueries({ queryKey: ['participation'] })
    queryClient.invalidateQueries({ queryKey: ['milestones'] })
    queryClient.invalidateQueries({ queryKey: ['submissions'] })
    queryClient.invalidateQueries({ queryKey: ['teamCohorts'] })
    queryClient.invalidateQueries({ queryKey: ['majors'] })
    queryClient.invalidateQueries({ queryKey: ['userMetadata'] })
    queryClient.invalidateQueries({ queryKey: ['pointTransactions'] })
    queryClient.invalidateQueries({ queryKey: ['achievements'] })
    queryClient.invalidateQueries({ queryKey: ['rewards'] })
    queryClient.invalidateQueries({ queryKey: ['claimedRewards'] })
  }
}
