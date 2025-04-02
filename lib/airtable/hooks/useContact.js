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
      
      try {
        // Try to find the user by email first
        console.log(`Looking up user by email: ${user.email}`);
        const userByEmail = await users.getUserByEmail(user.email);
        
        if (userByEmail) {
          console.log('Successfully found user by email');
          return userByEmail;
        }
        
        // If email lookup failed, try finding via linked records
        console.log('Email lookup failed, trying linked records');
        const userViaLinkedRecords = await users.findUserViaLinkedRecords(user.email);
        
        if (userViaLinkedRecords) {
          console.log('Successfully found user via linked records');
          return userViaLinkedRecords;
        }
        
        // As a last resort, try Auth0 ID lookup
        console.log('Linked records lookup failed, falling back to Auth0 ID');
        if (user.sub) {
          const userByAuth0Id = await users.getUserByAuth0Id(user.sub);
          if (userByAuth0Id) {
            console.log('Successfully found user by Auth0 ID');
            return userByAuth0Id;
          }
        }
        
        // If we get here, we couldn't find the user
        throw new Error('User not found by email, linked records, or Auth0 ID');
      } catch (error) {
        console.error('Error fetching user contact:', error);
        throw error;
      }
    },
    enabled: !!user && (!!user.email || !!user.sub),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry up to 2 times on failure
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