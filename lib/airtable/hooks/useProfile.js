/**
 * Profile Hooks
 * 
 * Hooks for accessing and manipulating user profile data.
 * 
 * - A "Profile" is a higher-level concept that combines contact and education data
 * - These hooks provide access to a more complete user profile through `/api/user/profile-v2`
 * - They handle the aggregation of data from multiple Airtable tables
 * 
 * Note: For direct access to the contact data only, consider using
 * the hooks in useContact.js which provide focused access to contact records.
 */
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
        // Call the v2 protected API endpoint - Auth0 handles authentication
        const response = await fetch('/api/user/profile-v2', {
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
        
        // Handle the wrapped response structure (v2 always returns data.profile)
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
 * Note: This hook returns a standard TanStack Query mutation object with methods
 * like `mutate`, `mutateAsync`, etc. To support components using both interface 
 * patterns, we also add `execute` and `isExecuting` aliases.
 * 
 * @returns {UseMutationResult} TanStack Query mutation result with additional aliases
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
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
        } else {
          // Handle the case where major or programId is not a valid Airtable record ID
          dataToSend.major = null;
        }
      }
      
      // Use absolute URL to ensure HTTPS is used consistently
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hub.xfoundry.org';
      const apiUrl = new URL('/api/user/profile-v2', baseUrl).toString();
      
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
    
    // Enhanced optimistic update - update UI before API call completes
    // and maintain consistency across related caches
    onMutate: async (updatedData) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['profile'] }),
        queryClient.cancelQueries({ queryKey: ['contact', 'current'] }),
        queryClient.cancelQueries({ queryKey: ['education', 'user'] })
      ]);
      
      // Snapshot the previous values for potential rollback
      const previousProfileData = queryClient.getQueryData(['profile']);
      const previousContactData = queryClient.getQueryData(['contact', 'current']);
      const previousEducationData = queryClient.getQueryData(
        ['education', 'user', updatedData.userId || 'current']
      );
      
      // Log the optimistic update for debugging
      console.log('Applying enhanced optimistic profile update:', {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        // Also updating related caches for consistency
        updatingContact: !!previousContactData,
        updatingEducation: !!(previousEducationData && 
          (updatedData.degreeType || updatedData.graduationYear || updatedData.major))
      });
      
      // 1. Update the profile cache
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
      
      // 2. Also update contact data if it's available in the cache
      if (previousContactData) {
        queryClient.setQueryData(['contact', 'current'], (oldData) => {
          return {
            ...(oldData || {}),
            firstName: updatedData.firstName || oldData?.firstName,
            lastName: updatedData.lastName || oldData?.lastName,
            // Mark as optimistic
            _optimistic: true,
            _updatedAt: new Date().toISOString()
          };
        });
      }
      
      // 3. Also update education data if it's available and relevant fields are being updated
      if (previousEducationData && (updatedData.degreeType || updatedData.graduationYear || updatedData.major)) {
        queryClient.setQueryData(
          ['education', 'user', updatedData.userId || 'current'], 
          (oldData) => {
            return {
              ...(oldData || {}),
              // Only include fields being updated
              ...(updatedData.degreeType ? { degreeType: updatedData.degreeType } : {}),
              ...(updatedData.graduationYear ? { graduationYear: updatedData.graduationYear } : {}),
              ...(updatedData.major ? { major: updatedData.major } : {}),
              // Mark as optimistic
              _optimistic: true,
              _updatedAt: new Date().toISOString()
            };
          }
        );
      }
      
      // Return context with all snapshots for potential rollback
      return { 
        previousProfileData,
        previousContactData,
        previousEducationData
      };
    },
    
    // Enhanced error handling - roll back all optimistic updates
    onError: (error, variables, context) => {
      console.error("Profile update error:", error);
      
      // Roll back all optimistic updates
      if (context) {
        console.log('Rolling back optimistic updates due to error');
        
        // 1. Roll back profile data
        if (context.previousProfileData) {
          queryClient.setQueryData(['profile'], context.previousProfileData);
        }
        
        // 2. Roll back contact data
        if (context.previousContactData) {
          queryClient.setQueryData(['contact', 'current'], context.previousContactData);
        }
        
        // 3. Roll back education data
        if (context.previousEducationData) {
          queryClient.setQueryData(
            ['education', 'user', variables.userId || 'current'], 
            context.previousEducationData
          );
        }
      }
      
      // Show error message to the user
      toast.error(error.message || "Failed to update profile");
    },
    
    // Enhanced success handling - update all related caches
    onSuccess: (data, variables) => {
      console.log('Profile update succeeded, finalizing all cache updates');
      
      // 1. Update the profile cache with actual server response
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
      
      // 2. Also update contact data if it's in the cache
      const contactData = queryClient.getQueryData(['contact', 'current']);
      if (contactData) {
        queryClient.setQueryData(['contact', 'current'], (oldData) => {
          return {
            ...(oldData || {}),
            firstName: data.firstName || oldData?.firstName,
            lastName: data.lastName || oldData?.lastName,
            // Remove optimistic flag
            _optimistic: false,
            // Add server update timestamp
            _serverUpdatedAt: new Date().toISOString()
          };
        });
      }
      
      // 3. Also update education data if relevant fields were changed
      const educationData = queryClient.getQueryData(['education', 'user', variables.userId || 'current']);
      if (educationData && (data.degreeType || data.graduationYear || data.major)) {
        queryClient.setQueryData(
          ['education', 'user', variables.userId || 'current'], 
          (oldData) => {
            return {
              ...(oldData || {}),
              // Only include fields from server response
              ...(data.degreeType ? { degreeType: data.degreeType } : {}),
              ...(data.graduationYear ? { graduationYear: data.graduationYear } : {}),
              ...(data.major ? { major: data.major } : {}),
              // Remove optimistic flag
              _optimistic: false,
              // Add server update timestamp
              _serverUpdatedAt: new Date().toISOString()
            };
          }
        );
      }
      
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
  
  // Add compatibility methods to support both interface patterns
  mutation.execute = mutation.mutate;
  mutation.executeAsync = mutation.mutateAsync;
  mutation.isExecuting = mutation.isPending;
  
  return mutation;
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
      
      const response = await fetch(`/api/user/check-email-v2?email=${encodeURIComponent(email)}`);
      
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