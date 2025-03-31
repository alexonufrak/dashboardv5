import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Custom hook for user profile data
 * @returns {Object} Query result with user profile data
 */
export function useProfileData() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('Fetching profile data from API');
      
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
    
    // Optimistic update - update the UI before the API call completes
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
    
    // Error handling - roll back if the API call fails
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
    
    // Success handling - update cache and show confirmation
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
    
    // Cleanup - invalidate queries to ensure fresh data
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

/**
 * Hook for checking if a user exists by email
 * @param {string} email Email to check
 * @returns {Object} Query result
 */
export function useCheckUserExists(email) {
  return useQuery({
    queryKey: ['userExists', email],
    queryFn: async () => {
      if (!email || email.length < 3) {
        return { exists: false };
      }
      
      const response = await fetch(`/api/user/check-email?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to check email');
      }
      
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!email && email.length >= 3
  });
}

export default {
  useProfileData,
  useUpdateProfile,
  useCheckUserExists
};