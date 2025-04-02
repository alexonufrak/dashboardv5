import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@auth0/nextjs-auth0';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import {
  getApplicationsByUserId,
  checkUserApplicationForCohort,
  createApplication
} from '../entities/applications';

/**
 * Custom hook for fetching user applications
 * @param {Object} options - Query options
 * @returns {Object} Query result with user applications data
 */
export function useUserApplications(options = {}) {
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
}

/**
 * Alternative implementation using the createDataHook factory
 * API-based version of the useUserApplications hook
 */
export const useMyApplications = createDataHook({
  queryKey: 'myApplications',
  endpoint: '/api/applications/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to fetch your applications',
  normalizeData: (data) => data.applications || []
});

/**
 * Hook to check if a user has applied to a specific cohort
 * @param {string} cohortId - The cohort ID to check for applications
 * @param {Object} options - Query options
 * @returns {Object} Query result with application status
 */
export function useHasAppliedToCohort(cohortId, options = {}) {
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
 * Alternative implementation using the createActionHook factory
 * API-based version of the useCreateApplication hook
 */
export const useSubmitApplication = createActionHook({
  actionKey: 'createApplication',
  endpoint: '/api/applications/create',
  method: 'POST',
  successMessage: 'Application submitted successfully',
  errorMessage: 'Failed to submit application',
  invalidateKeys: [
    'myApplications', 
    'applications', 
    ['participation']
  ]
});

/**
 * Hook for creating an individual application
 * Wrapper around useCreateApplication with specific logic for individual applications
 * @returns {Object} Mutation result with specialized createIndividualApplication function
 */
export function useCreateIndividualApplication() {
  const createApplicationMutation = useCreateApplication();
  
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
    
    return createApplicationMutation.mutateAsync(applicationData);
  };
  
  return {
    ...createApplicationMutation,
    createIndividualApplication
  };
}

/**
 * Hook for creating a team application
 * Wrapper around useCreateApplication with specific logic for team applications
 * @returns {Object} Mutation result with specialized createTeamApplication function
 */
export function useCreateTeamApplication() {
  const createApplicationMutation = useCreateApplication();
  
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
      applicationType: 'team',
      status: 'Submitted'
    };
    
    return createApplicationMutation.mutateAsync(applicationData);
  };
  
  return {
    ...createApplicationMutation,
    createTeamApplication
  };
}

/**
 * Implementation using the createActionHook factory
 * API-based version of the useCreateTeamApplication hook
 */
export const useSubmitTeamApplication = createActionHook({
  actionKey: 'createTeamApplication',
  endpoint: '/api/applications/create',
  method: 'POST',
  successMessage: 'Team application submitted successfully',
  errorMessage: 'Failed to submit team application',
  invalidateKeys: ['myApplications', 'applications', ['participation'], ['teams']]
});

/**
 * Hook for creating a team join request
 * Wrapper around useCreateApplication with specific logic for team join requests
 * @returns {Object} Mutation result with specialized createTeamJoinRequest function
 */
export function useCreateTeamJoinRequest() {
  const createApplicationMutation = useCreateApplication();
  
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
    
    return createApplicationMutation.mutateAsync(applicationData);
  };
  
  return {
    ...createApplicationMutation,
    createTeamJoinRequest
  };
}

/**
 * Hook for creating an Xtrapreneurs application
 * Wrapper around useCreateApplication with specific logic for Xtrapreneurs applications
 * @returns {Object} Mutation result with specialized createXtrapreneursApplication function
 */
export function useCreateXtrapreneursApplication() {
  const createApplicationMutation = useCreateApplication();
  
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
    
    return createApplicationMutation.mutateAsync(applicationData);
  };
  
  return {
    ...createApplicationMutation,
    createXtrapreneursApplication
  };
}

// Export all hooks
export default {
  // Entity-based implementations
  useUserApplications,
  useHasAppliedToCohort,
  useCreateApplication,
  useCreateIndividualApplication,
  useCreateTeamApplication,
  useCreateTeamJoinRequest,
  useCreateXtrapreneursApplication,
  
  // API-based implementations using factory pattern
  useMyApplications,
  useSubmitApplication,
  useSubmitTeamApplication
};