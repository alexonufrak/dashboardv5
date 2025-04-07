/**
 * Application Hooks
 * 
 * Domain-specific hooks for accessing and submitting application data.
 * Updated to support App Router API endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import {
  getApplicationsByUserId,
  checkUserApplicationForCohort,
  createApplication
} from '../entities/applications';

/**
 * App Router compatible hook for fetching user applications
 */
export const useMyApplicationsViaApi = createDataHook({
  queryKey: 'myApplications',
  endpoint: '/api/applications/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to fetch your applications',
  normalizeData: (data) => data.applications || [],
  appRouter: true  // Use App Router endpoint
});

/**
 * App Router compatible hook for checking cohort application
 */
export const useCheckCohortApplicationViaApi = createDataHook({
  queryKey: (cohortId) => ['applications', 'cohort', cohortId],
  endpoint: (cohortId) => `/api/applications/check?cohortId=${cohortId}`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to check application status',
  normalizeData: (data) => ({
    hasApplied: data.hasAppliedToCohort,
    application: data.cohortApplication,
    ...data
  }),
  enabled: (cohortId) => !!cohortId,
  appRouter: true  // Use App Router endpoint
});

/**
 * App Router compatible hook for submitting an application
 */
export const useSubmitApplicationViaApi = createActionHook({
  actionKey: 'createApplication',
  endpoint: '/api/applications/create',
  method: 'POST',
  successMessage: 'Application submitted successfully',
  errorMessage: 'Failed to submit application',
  invalidateKeys: [
    'myApplications', 
    'applications', 
    ['participation']
  ],
  appRouter: true  // Use App Router endpoint
});

/**
 * App Router compatible hook for submitting a team application
 */
export const useSubmitTeamApplicationViaApi = createActionHook({
  actionKey: 'createTeamApplication',
  endpoint: '/api/applications/create',
  method: 'POST',
  successMessage: 'Team application submitted successfully',
  errorMessage: 'Failed to submit team application',
  invalidateKeys: ['myApplications', 'applications', ['participation'], ['teams']],
  appRouter: true  // Use App Router endpoint
});

/**
 * Custom hook for fetching user applications
 * @param {Object} options - Query options
 * @returns {Object} Query result with user applications data
 */
export function useUserApplications(options = {}) {
  // Use the App Router compatible hook
  return useMyApplicationsViaApi(options);
  
  /* Original implementation preserved for reference:
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }
      
      try {
        return await getApplicationsByUserId(user.sub);
      } catch (error) {
        console.error('Error fetching user applications:', error);
        throw error;
      }
    },
    enabled: !!user?.sub,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    ...options
  });
  */
}

/**
 * Legacy API-based version of the useUserApplications hook
 * Maintained for backward compatibility
 */
export const useMyApplications = useMyApplicationsViaApi;

/**
 * Hook to check if a user has applied to a specific cohort
 * @param {string} cohortId - The cohort ID to check for applications
 * @param {Object} options - Query options
 * @returns {Object} Query result with application status
 */
export function useHasAppliedToCohort(cohortId, options = {}) {
  // Use the App Router compatible hook
  return useCheckCohortApplicationViaApi(cohortId, options);
  
  /* Original implementation preserved for reference:
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['applications', 'cohort', cohortId],
    queryFn: async () => {
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }
      
      if (!cohortId) {
        throw new Error('Cohort ID is required');
      }
      
      try {
        const result = await checkUserApplicationForCohort(user.sub, cohortId);
        return result;
      } catch (error) {
        console.error('Error checking cohort application status:', error);
        throw error;
      }
    },
    enabled: !!user?.sub && !!cohortId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
  */
}

/**
 * Hook for creating a new application
 * @returns {Object} Mutation result
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  return useMutation({
    mutationFn: async (applicationData) => {
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }
      
      // Will throw an error if contactId is not provided
      return createApplication(applicationData);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      // Optionally invalidate specific cohort queries if needed
      if (variables?.cohortId) {
        queryClient.invalidateQueries({ 
          queryKey: ['applications', 'cohort', variables.cohortId] 
        });
      }
    }
  });
}

/**
 * API-based version of the useCreateApplication hook
 * Updated to use the App Router compatible hook
 */
export const useSubmitApplication = useSubmitApplicationViaApi;

/**
 * Hook for creating an individual application
 * Wrapper around useCreateApplication with specific logic for individual applications
 * @returns {Object} Mutation result with specialized createIndividualApplication function
 */
export function useCreateIndividualApplication() {
  // Use the App Router compatible hook for submission
  const submitMutation = useSubmitApplicationViaApi();
  
  const createIndividualApplication = async (data) => {
    const { contactId, cohortId, filloutFormId } = data;
    
    // Validate required fields
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    if (!cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    // Prepare application data
    const applicationData = {
      contactId,
      cohortId,
      applicationType: 'individual',
      status: 'Submitted'
    };
    
    return submitMutation.mutateAsync(applicationData);
  };
  
  return {
    ...submitMutation,
    createIndividualApplication
  };
}

/**
 * Hook for creating a team application
 * Wrapper around useCreateApplication with specific logic for team applications
 * @returns {Object} Mutation result with specialized createTeamApplication function
 */
export function useCreateTeamApplication() {
  // Use the App Router compatible hook for submission
  const submitMutation = useSubmitTeamApplicationViaApi();
  
  const createTeamApplication = async (data) => {
    const { contactId, cohortId, teamId } = data;
    
    // Validate required fields
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    if (!cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    if (!teamId) {
      throw new Error('Team ID is required for team applications');
    }
    
    // Prepare application data
    const applicationData = {
      contactId,
      cohortId,
      teamId,
      participationType: 'Team',
      applicationType: 'team',
      status: 'Submitted'
    };
    
    return submitMutation.mutateAsync(applicationData);
  };
  
  return {
    ...submitMutation,
    createTeamApplication
  };
}

/**
 * API-based version of the useCreateTeamApplication hook
 * Updated to use the App Router compatible hook
 */
export const useSubmitTeamApplication = useSubmitTeamApplicationViaApi;

/**
 * Hook for creating a team join request
 * Wrapper around useCreateApplication with specific logic for team join requests
 * @returns {Object} Mutation result with specialized createTeamJoinRequest function
 */
export function useCreateTeamJoinRequest() {
  // Use the App Router compatible hook for submission
  const submitMutation = useSubmitApplicationViaApi();
  
  const createTeamJoinRequest = async (data) => {
    const { contactId, cohortId, teamToJoin, joinTeamMessage } = data;
    
    // Validate required fields
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    if (!cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    if (!teamToJoin) {
      throw new Error('Team to join is required');
    }
    
    if (!joinTeamMessage) {
      throw new Error('Join team message is required');
    }
    
    // Prepare application data
    const applicationData = {
      contactId,
      cohortId,
      teamToJoin,
      joinTeamMessage,
      applicationType: 'joinTeam',
      status: 'Submitted' // Team join requests are always submitted for review
    };
    
    return submitMutation.mutateAsync(applicationData);
  };
  
  return {
    ...submitMutation,
    createTeamJoinRequest
  };
}

/**
 * Hook for creating an Xtrapreneurs application
 * Wrapper around useCreateApplication with specific logic for Xtrapreneurs applications
 * @returns {Object} Mutation result with specialized createXtrapreneursApplication function
 */
export function useCreateXtrapreneursApplication() {
  // Use the App Router compatible hook for submission
  const submitMutation = useSubmitApplicationViaApi();
  
  const createXtrapreneursApplication = async (data) => {
    const { contactId, cohortId, reason, commitment } = data;
    
    // Validate required fields
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    if (!cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    if (!reason) {
      throw new Error('Reason is required for Xtrapreneurs applications');
    }
    
    if (!commitment) {
      throw new Error('Commitment level is required for Xtrapreneurs applications');
    }
    
    // Prepare application data
    const applicationData = {
      contactId,
      cohortId,
      reason,
      commitment,
      applicationType: 'xtrapreneurs',
      status: 'Accepted' // Xtrapreneurs applications are auto-accepted
    };
    
    return submitMutation.mutateAsync(applicationData);
  };
  
  return {
    ...submitMutation,
    createXtrapreneursApplication
  };
}

// Export all hooks
export default {
  // Modern API-first hooks
  useMyApplicationsViaApi,
  useCheckCohortApplicationViaApi,
  useSubmitApplicationViaApi,
  useSubmitTeamApplicationViaApi,
  
  // Legacy hooks (now using App Router endpoints internally)
  useUserApplications,
  useHasAppliedToCohort,
  useCreateApplication,
  useCreateIndividualApplication,
  useCreateTeamApplication,
  useCreateTeamJoinRequest,
  useCreateXtrapreneursApplication,
  
  // Legacy API-based implementations 
  useMyApplications,
  useSubmitApplication,
  useSubmitTeamApplication
};