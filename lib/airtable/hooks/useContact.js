/**
 * Contact Hooks
 * 
 * Domain-specific hooks for accessing contact data from the Airtable Contacts table.
 * 
 * - A "Contact" represents the core user record in Airtable
 * - These hooks now provide access to the Contacts table data through the API layer
 * - Some hooks use the term "Profile" for backward compatibility with older components
 * 
 * Note: For a complete user profile that includes education data, consider using
 * the hooks in useProfile.js which merge contact and education data.
 */
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';

/**
 * Primary hook for fetching the current user's contact record via API
 * Uses email-first lookup strategy with reliable identification
 * 
 * @returns {Object} React Query result with contact data
 */
export const useContactViaApi = createDataHook({
  queryKey: ['profile', 'current'],
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your contact information',
  refetchOnFocus: true,
  appRouter: true, // Use App Router endpoint
  retry: (failureCount, error) => {
    // Don't retry auth errors
    if (error?.status === 401) return false;
    
    // Retry network/timeout errors
    if (!error?.status || error.status >= 500) {
      return failureCount < 3;
    }
    
    // Default retry behavior
    return failureCount < 2;
  },
  retryDelay: attemptIndex => {
    const delay = Math.min(1000 * (2 ** attemptIndex), 8000);
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }
});

/**
 * Legacy hook maintained for backward compatibility
 * Now uses the API endpoint with email-first lookup
 * 
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export function useMyContact(options = {}) {
  console.warn('useMyContact is deprecated. Use useContactViaApi for better email-first lookup.');
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['contact', 'current', 'email'],
    queryFn: async () => {
      if (!user?.email) {
        throw new Error('User email is required');
      }
      
      const response = await fetch('/api/contacts/me', {
        credentials: 'include', // Include auth cookies
        cache: 'no-store', // Ensure we don't use Next.js cache
        next: { revalidate: 0 } // No Next.js caching (use React Query's cache)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch contact');
      }
      return response.json();
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

/**
 * Legacy hook maintained for backward compatibility
 * Now uses the email-first lookup strategy via API
 * 
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result
 */
export const useMyContactByEmail = createDataHook({
  queryKey: ['contact', 'current', 'email'],
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your contact information',
  refetchOnFocus: true,
  appRouter: true, // Use App Router endpoint
  retry: (failureCount, error) => {
    // Don't retry auth errors
    if (error?.status === 401) return false;
    
    // Retry network/timeout errors
    if (!error?.status || error.status >= 500) {
      return failureCount < 3;
    }
    
    // Default retry behavior
    return failureCount < 2;
  },
  retryDelay: attemptIndex => {
    const delay = Math.min(1000 * (2 ** attemptIndex), 8000);
    const jitter = Math.random() * 1000;
    return delay + jitter;
  }
});

/**
 * Hook for updating contact information via API
 * 
 * @returns {Object} Mutation object with execute/mutate methods
 */
export const useUpdateContactViaApi = createActionHook({
  actionKey: 'updateContact',
  endpoint: '/api/contacts/me',
  method: 'PATCH',
  successMessage: 'Contact information updated successfully',
  errorMessage: 'Failed to update contact information',
  appRouter: true, // Use App Router endpoint
  invalidateKeys: [['profile', 'current'], 'contact', ['profile', 'composed']]
});

/**
 * Hook to check if a contact record exists by email
 * 
 * @param {string} email - Email to check
 * @param {Object} options - Additional React Query options
 * @returns {Object} Query result with exists property
 */
export function useCheckContact(email, options = {}) {
  return useQuery({
    queryKey: ['contact', 'check', email],
    queryFn: async () => {
      if (!email) throw new Error('Email is required');
      const response = await fetch(`/api/contacts/check?email=${encodeURIComponent(email)}`, {
        credentials: 'include', // Include auth cookies
        cache: 'no-store', // Ensure we don't use Next.js cache
        next: { revalidate: 0 } // No Next.js caching (use React Query's cache)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to check contact');
      }
      return response.json();
    },
    enabled: !!email && email.includes('@'),
    staleTime: 60 * 1000, // 1 minute
    ...options
  });
}

/**
 * Specialized hook for when you need to invalidate the contact cache
 * (e.g., after a user completes onboarding)
 * 
 * @returns {Function} Function to invalidate contact cache
 */
export function useInvalidateContact() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['profile', 'current'] });
    queryClient.invalidateQueries({ queryKey: ['contact'] });
  };
}

// Legacy aliases for backward compatibility
export const useProfile = useContactViaApi;
export const useUpdateProfile = useUpdateContactViaApi;

const contactHooks = {
  // Legacy hooks for backward compatibility
  useMyContact,
  useMyContactByEmail,
  
  // Primary hooks
  useContactViaApi,
  useUpdateContactViaApi,
  useCheckContact,
  useInvalidateContact,
  
  // Legacy aliases
  useProfile,
  useUpdateProfile
};

export default contactHooks;