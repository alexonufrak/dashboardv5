/**
 * Contact Hooks
 * Domain-specific hooks for accessing contact data
 */
import { createDataHook, createActionHook } from './createDataHook';

/**
 * Hook for fetching the current user's contact record
 */
export const useMyContact = createDataHook({
  queryKey: 'myContact',
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your contact information',
  successMessage: 'Contact information updated successfully',
  refetchOnFocus: true,
  normalizeData: (data) => data
});

/**
 * Hook for updating contact information
 */
export const useUpdateContact = createDataHook({
  queryKey: 'myContact',
  endpoint: '/api/contacts/me',
  updateFn: async (data) => {
    const response = await fetch('/api/contacts/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update contact information');
    }
    
    return response.json();
  },
  successMessage: 'Contact information updated successfully',
  errorMessage: 'Failed to update contact information'
});

/**
 * Hook for updating onboarding status
 */
export const useUpdateOnboardingStatus = createActionHook({
  actionKey: 'updateOnboarding',
  endpoint: '/api/contacts/me',
  method: 'POST',
  successMessage: (result) => `Onboarding status updated to ${result.onboardingStatus || result.status}`,
  errorMessage: 'Failed to update onboarding status',
  invalidateKeys: ['myContact']
});

/**
 * Hook for checking if a contact exists by email
 */
export const useCheckContactExists = createDataHook({
  queryKey: 'contactExists',
  endpoint: '/api/contacts/check',
  staleTime: 60 * 1000, // 1 minute
  errorMessage: 'Error checking contact existence',
  normalizeData: (data) => ({ exists: data.exists || false })
});

export default {
  useMyContact,
  useUpdateContact,
  useUpdateOnboardingStatus,
  useCheckContactExists
};