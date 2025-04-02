/**
 * Contact Hooks
 * Domain-specific hooks for accessing contact data
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
 */
export const useProfile = createDataHook({
  queryKey: 'profile',
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your profile',
  successMessage: 'Profile updated successfully',
  refetchOnFocus: true
});

/**
 * Hook for updating contact information via API
 */
export const useUpdateProfile = createActionHook({
  actionKey: 'updateProfile',
  endpoint: '/api/contacts/me',
  method: 'PATCH',
  successMessage: 'Profile updated successfully',
  errorMessage: 'Failed to update profile',
  invalidateKeys: ['profile', 'contact']
});

export default {
  useContactByAuth0Id,
  useMyContact,
  useProfile,
  useUpdateProfile
};