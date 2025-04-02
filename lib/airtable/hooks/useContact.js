/**
 * Contact Hooks
 * 
 * Domain-specific hooks for accessing contact data from the Airtable Contacts table.
 * 
 * - A "Contact" represents the core user record in Airtable
 * - These hooks provide direct access to the Contacts table data
 * - Some hooks use the term "Profile" for backward compatibility with older components
 * 
 * Note: For a complete user profile that includes education data, consider using
 * the hooks in useProfile.js which merge contact and education data.
 */
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import { useQuery } from '@tanstack/react-query';
import { users } from '../entities';
import { useUser } from '@auth0/nextjs-auth0';

/**
 * Hook for fetching a user's contact record directly from Airtable
 * @param {string} userId - User ID (Auth0 sub)
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useContactByAuth0Id(userId, options = {}) {
  return useQuery({
    queryKey: ['contact', 'auth0', userId],
    queryFn: () => users.getUserByAuth0Id(userId),
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook for fetching the current authenticated user's contact record directly from Airtable by Auth0 ID
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useMyContact(options = {}) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['contact', 'current', 'auth0'],
    queryFn: () => {
      if (!user?.sub) {
        throw new Error('User not authenticated');
      }
      return users.getUserByAuth0Id(user.sub);
    },
    enabled: !!user?.sub,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

/**
 * Hook for fetching the current authenticated user's contact record with email-first lookup
 * This hook prioritizes looking up users by email first, then falls back to Auth0 ID
 * 
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useMyContactByEmail(options = {}) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['contact', 'current', 'email'],
    queryFn: async () => {
      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Check if we have the user's email
      if (!user.email) {
        console.warn('No email available for user lookup, will try Auth0 ID lookup');
        if (!user.sub) {
          throw new Error('User missing both email and Auth0 ID');
        }
        return users.getUserByAuth0Id(user.sub);
      }
      
      // Track lookup attempts and errors for debugging
      const attempts = [];
      let userProfile = null;
      
      try {
        // Try to find the user by email first (most reliable method)
        try {
          console.log(`Looking up user by email: ${user.email}`);
          attempts.push({ method: 'email', timestamp: new Date().toISOString() });
          
          userProfile = await users.getUserByEmail(user.email);
          
          if (userProfile) {
            console.log('Successfully found user by email');
            return userProfile;
          }
        } catch (emailError) {
          attempts.push({ 
            method: 'email', 
            error: emailError.message || 'Unknown error',
            timestamp: new Date().toISOString()
          });
          console.error('Email lookup error:', emailError);
        }
        
        // If email lookup failed, try finding via linked records
        try {
          console.log('Email lookup failed, trying linked records');
          attempts.push({ method: 'linkedRecords', timestamp: new Date().toISOString() });
          
          userProfile = await users.findUserViaLinkedRecords(user.email);
          
          if (userProfile) {
            console.log('Successfully found user via linked records');
            return userProfile;
          }
        } catch (linkedError) {
          attempts.push({ 
            method: 'linkedRecords', 
            error: linkedError.message || 'Unknown error',
            timestamp: new Date().toISOString()
          });
          console.error('Linked records lookup error:', linkedError);
        }
        
        // As a last resort, try Auth0 ID lookup
        if (user.sub) {
          try {
            console.log('Linked records lookup failed, falling back to Auth0 ID');
            attempts.push({ method: 'auth0Id', timestamp: new Date().toISOString() });
            
            userProfile = await users.getUserByAuth0Id(user.sub);
            
            if (userProfile) {
              console.log('Successfully found user by Auth0 ID');
              return userProfile;
            }
          } catch (auth0Error) {
            attempts.push({ 
              method: 'auth0Id', 
              error: auth0Error.message || 'Unknown error',
              timestamp: new Date().toISOString()
            });
            console.error('Auth0 ID lookup error:', auth0Error);
          }
        }
        
        // If all methods fail, create a detailed error with all attempt information
        const lookupError = new Error('User not found by any lookup method');
        lookupError.attempts = attempts;
        lookupError.userIdentifiers = {
          email: user.email,
          auth0Id: user.sub
        };
        
        console.error('All user lookup methods failed:', lookupError);
        
        // Check if attempt errors suggest an Airtable connection issue
        const isConnectionIssue = attempts.some(attempt => 
          attempt.error && (
            attempt.error.includes('rate limit') || 
            attempt.error.includes('timeout') ||
            attempt.error.includes('network') ||
            attempt.error.includes('ETIMEDOUT') ||
            attempt.error.includes('ECONNREFUSED')
          )
        );
        
        if (isConnectionIssue) {
          lookupError.message = 'Unable to connect to database. Please try again later.';
        }
        
        throw lookupError;
      } catch (error) {
        if (!error.attempts) {
          // This is an error from one of the lookup methods, not our detailed error
          console.error('Uncaught error in user lookup:', error);
        }
        throw error;
      }
    },
    enabled: !!user && (!!user.email || !!user.sub),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Implement a more intelligent retry strategy
    retry: (failureCount, error) => {
      // Don't retry too many times
      if (failureCount >= 3) return false;
      
      // Retry on network errors or timeouts
      if (error.message && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.message.includes('rate limit')
      )) {
        console.log(`Retrying due to likely temporary error (${failureCount + 1}/3)`);
        return true;
      }
      
      // Don't retry on user not found errors
      if (error.message && error.message.includes('not found')) {
        return false;
      }
      
      // Default retry behavior
      return failureCount < 2;
    },
    // Exponential backoff with jitter
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * (2 ** attemptIndex), 8000);
      const jitter = Math.random() * 1000;
      return delay + jitter;
    },
    ...options
  });
}

/**
 * Hook for fetching the current user's contact record via API
 * 
 * This hook provides an alternative way to access contact data through
 * the API layer instead of directly via Airtable entities.
 * 
 * @returns {Object} React Query result with contact data
 */
export const useContactViaApi = createDataHook({
  queryKey: 'profile',
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your contact information',
  successMessage: 'Contact information updated successfully',
  refetchOnFocus: true
});

/**
 * Hook for updating contact information via API
 * 
 * This hook updates user contact information through the API layer.
 * 
 * @returns {Object} Mutation object with execute/mutate methods
 */
export const useUpdateContactViaApi = createActionHook({
  actionKey: 'updateContact',
  endpoint: '/api/contacts/me',
  method: 'PATCH',
  successMessage: 'Contact information updated successfully',
  errorMessage: 'Failed to update contact information',
  invalidateKeys: ['profile', 'contact']
});

// Legacy aliases for backward compatibility
export const useProfile = useContactViaApi;
export const useUpdateProfile = useUpdateContactViaApi;

export default {
  useContactByAuth0Id,
  useMyContact,
  useMyContactByEmail,
  // New semantic names
  useContactViaApi,
  useUpdateContactViaApi,
  // Legacy aliases
  useProfile,
  useUpdateProfile
};