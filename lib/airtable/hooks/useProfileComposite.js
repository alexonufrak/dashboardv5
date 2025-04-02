/**
 * Enhanced Profile Hook
 *
 * This hook properly composes profile data from contact and education hooks,
 * leveraging TanStack Query's dependent query pattern for efficient data loading.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useMyContact } from './useContact';
import { useMyEducation } from './useEducation';
import { profileKeys } from '../core/queryKeys';

/**
 * Hook that composes profile data from contact and education data
 * 
 * Benefits:
 * - Uses existing specialized hooks
 * - Proper data dependencies
 * - Efficient caching
 * - Consistent data structure
 * 
 * @param {Object} options Additional options for the hooks
 * @returns {Object} Profile data and query state
 */
export function useCompositeProfile(options = {}) {
  const queryClient = useQueryClient();
  
  // 1. Fetch contact data first
  const {
    data: contact,
    isLoading: contactLoading,
    isError: contactError,
    error: contactErrorDetails,
    refetch: refetchContact
  } = useMyContact();
  
  // 2. Only fetch education if we have contact data
  const {
    data: education,
    isLoading: educationLoading,
    isError: educationError,
    error: educationErrorDetails,
    refetch: refetchEducation
  } = useMyEducation({
    // Only enable if we have a contactId
    enabled: Boolean(contact?.contactId) && !contactLoading,
    // Pass any additional options
    ...options.educationOptions
  });
  
  // 3. Compose the data into a unified profile
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorDetails,
    refetch: refetchProfile
  } = useQuery({
    queryKey: profileKeys.composed(contact?.contactId),
    queryFn: () => {
      // Don't compute if missing contact data
      if (!contact) return null;
      
      // Combine the data into a profile object
      return {
        // Core contact data
        ...contact,
        // Education data as sub-object and flattened top-level fields for convenience
        education,
        institutionName: education?.institutionName,
        institution: education?.institution,
        degreeType: education?.degreeType,
        graduationYear: education?.graduationYear,
        graduationSemester: education?.graduationSemester,
        major: education?.major,
        majorName: education?.majorName,
        
        // Computed fields
        hasCompletedProfile: Boolean(
          contact?.firstName && 
          contact?.lastName && 
          (education?.institutionName || education?.institution)
        ),
        
        // Metadata
        _composed: true,
        _composedAt: new Date().toISOString()
      };
    },
    // Only run this query when we have the required data
    enabled: !contactLoading && 
             !educationLoading && 
             Boolean(contact) &&
             (options.alwaysEnabled || Boolean(education)),
    // Use a shorter staleTime since we're composing already-cached data
    staleTime: 2 * 60 * 1000,
  });
  
  // Create a unified refetch function
  const refetchAll = useCallback(() => {
    refetchContact();
    refetchEducation();
    refetchProfile();
  }, [refetchContact, refetchEducation, refetchProfile]);
  
  // Return a standardized result object
  return {
    data: profile,
    isLoading: contactLoading || educationLoading || profileLoading,
    isError: contactError || educationError || profileError,
    error: contactErrorDetails || educationErrorDetails || profileErrorDetails,
    refetch: refetchAll,
    
    // Also expose the individual results for advanced use cases
    contact,
    contactLoading,
    education,
    educationLoading
  };
}

export default useCompositeProfile;