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
 * Hook for fetching the current authenticated user's contact record directly from Airtable
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useMyContact(options = {}) {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['contact', 'current'],
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
  // New semantic names
  useContactViaApi,
  useUpdateContactViaApi,
  // Legacy aliases
  useProfile,
  useUpdateProfile
};