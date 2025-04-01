import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook for updating a user's onboarding status
 * 
 * This hook provides:
 * 1. Optimistic UI updates for immediate feedback
 * 2. Robust error handling with automatic rollback
 * 3. Proper cache invalidation after mutations
 * 
 * @returns {UseMutationResult} TanStack Query mutation result
 */
export function useUpdateOnboardingStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contactId, status = 'Applied', showToast = false }) => {
      console.log(`Starting onboarding status update to "${status}"`);
      
      if (!contactId) {
        // Try to get contactId from cached profile data if not provided
        const profileData = queryClient.getQueryData(['profile']);
        if (profileData?.contactId) {
          contactId = profileData.contactId;
        } else {
          throw new Error('Contact ID is required to update onboarding status');
        }
      }
      
      // Use absolute URL to ensure HTTPS is used consistently
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hub.xfoundry.org';
      const apiUrl = new URL('/api/user/onboarding-completed-v2', baseUrl).toString();
      
      console.log(`Making onboarding status update request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Essential for sending auth cookies
        cache: 'no-store', // Prevent caching of auth requests
        body: JSON.stringify({
          contactId,
          status
        })
      });
      
      // Handle error responses
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Onboarding status update error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      const data = await response.json();
      console.log('Onboarding status update successful');
      
      return { ...data, showToast };
    },
    
    // Optimistic update - mark onboarding as complete immediately
    onMutate: async ({ status }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      
      // Snapshot the previous value for rollback in case of error
      const previousProfileData = queryClient.getQueryData(['profile']);
      
      // Optimistically update the cache with the new onboarding status
      queryClient.setQueryData(['profile'], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          onboardingStatus: status || 'Applied',
          isOnboardingComplete: true,
          _optimistic: true,
          _updatedAt: new Date().toISOString()
        };
      });
      
      // Return context object for potential rollback
      return { previousProfileData };
    },
    
    // Error handling - roll back if the API call fails
    onError: (error, variables, context) => {
      console.error("Onboarding status update error:", error);
      
      // Roll back to the previous value if available
      if (context?.previousProfileData) {
        console.log('Rolling back optimistic update due to error');
        queryClient.setQueryData(['profile'], context.previousProfileData);
      }
      
      // Show error message - only if showToast is true
      if (variables.showToast) {
        toast.error(error.message || "Failed to update onboarding status");
      }
    },
    
    // Success handling - update profile cache with new onboarding status
    onSuccess: (data, variables) => {
      console.log('Onboarding status update succeeded');
      
      // Update the profile cache with the new onboarding status
      queryClient.setQueryData(['profile'], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          onboardingStatus: data.onboardingStatus || variables.status || 'Applied',
          isOnboardingComplete: true,
          _optimistic: false,
          _serverUpdatedAt: new Date().toISOString()
        };
      });
      
      // Show success message (optional)
      if (data.showToast || variables.showToast) {
        toast.success("Onboarding status updated");
      }
    },
    
    // Cleanup - invalidate profile and participation queries
    onSettled: () => {
      console.log('Onboarding status update completed, invalidating affected queries');
      
      // Invalidate profile data to ensure it's refreshed
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Also invalidate participation data since it might be affected
      queryClient.invalidateQueries({ queryKey: ['participation'] });
    }
  });
}

/**
 * Check if a user's onboarding is completed
 * This is a helper function to determine onboarding status from profile data
 * 
 * @param {Object} profile User profile object
 * @returns {boolean} Whether onboarding is completed
 */
export function isOnboardingCompleted(profile) {
  if (!profile) return false;
  
  const onboardingStatus = profile.onboardingStatus;
  const hasParticipation = profile.hasParticipation === true;
  const hasApplications = profile.applications && profile.applications.length > 0;
  
  return onboardingStatus === "Applied" || hasParticipation || hasApplications;
}

export default {
  useUpdateOnboardingStatus,
  isOnboardingCompleted
};