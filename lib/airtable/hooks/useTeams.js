import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teams as teamsEntity } from '../entities';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * App Router compatible hooks using the hook factory
 */

// Hook for fetching a team by ID via App Router
export const useTeamViaApi = createDataHook({
  queryKey: (teamId) => ['team', teamId],
  endpoint: (teamId) => `/api/teams/${teamId}`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load team information',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.team || data,
  enabled: (teamId) => !!teamId
});

// Hook for updating a team via App Router
export const useUpdateTeamViaApi = createActionHook({
  actionKey: 'updateTeam',
  endpoint: (data) => `/api/teams/${data.teamId}`,
  method: 'PATCH',
  successMessage: 'Team updated successfully',
  errorMessage: 'Failed to update team information',
  appRouter: true, // Use App Router endpoint
  invalidateKeys: [
    (_, variables) => ['team', variables.teamId],
    'teams',
    'user-teams'
  ]
});

// Hook for fetching team members via App Router
export const useTeamMembersViaApi = createDataHook({
  queryKey: (teamId) => ['teamMembers', teamId],
  endpoint: (teamId) => `/api/teams/${teamId}/members`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load team members',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.members || [],
  enabled: (teamId) => !!teamId
});

// Hook for creating a team via App Router
export const useCreateTeamViaApi = createActionHook({
  actionKey: 'createTeam',
  endpoint: '/api/teams/create',
  method: 'POST',
  successMessage: 'Team created successfully',
  errorMessage: 'Failed to create team',
  appRouter: true, // Use App Router endpoint
  invalidateKeys: [
    'teams',
    'user-teams',
    (_, variables) => variables.cohortId ? ['teamsByCohort', variables.cohortId] : null
  ].filter(Boolean)
});

// Hook for fetching teams by cohort via App Router
export const useTeamsByCohortViaApi = createDataHook({
  queryKey: (cohortId) => ['teamsByCohort', cohortId],
  endpoint: (cohortId) => `/api/cohorts/${cohortId}/teams`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load cohort teams',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.teams || [],
  enabled: (cohortId) => !!cohortId
});

// Hook for fetching user teams via App Router
export const useUserTeamsViaApi = createDataHook({
  queryKey: ['user-teams'],
  endpoint: '/api/teams',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load your teams',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.teams || []
});

/**
 * Custom hook for team data
 * @param {string} teamId Team ID
 * @returns {Object} Query result with team data
 */
export function useTeam(teamId) {
  // Use the App Router compatible hook 
  return useTeamViaApi(teamId);
  
  /* Original implementation preserved for reference:
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      
      console.log(`Fetching team data for ID: ${teamId}`);
      
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          cache: 'no-store', // App Router compatible
          credentials: 'include',
          next: { revalidate: 0 } // No Next.js caching (use React Query's cache)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch team: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.team || data;
      } catch (error) {
        console.error(`Team data fetch error for ID ${teamId}:`, error);
        throw error;
      }
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
  */
}

/**
 * Custom hook for team members data
 * @param {string} teamId Team ID
 * @returns {Object} Query result with team members data
 */
export function useTeamMembers(teamId) {
  // Use the App Router compatible hook
  return useTeamMembersViaApi(teamId);
}

/**
 * Custom hook for creating a team
 * @returns {Object} Mutation result
 */
export function useCreateTeam() {
  // Use the App Router compatible hook
  return useCreateTeamViaApi();
}

/**
 * Custom hook for updating a team
 * @returns {Object} Mutation result
 */
export function useUpdateTeam() {
  // Use the App Router compatible hook
  return useUpdateTeamViaApi();
}

/**
 * Custom hook for fetching teams by cohort
 * @param {string} cohortId Cohort ID
 * @returns {Object} Query result with teams data
 */
export function useTeamsByCohort(cohortId) {
  // Use the App Router compatible hook
  return useTeamsByCohortViaApi(cohortId);
}

/**
 * Custom hook for fetching all teams associated with the current user
 * Replacement for the original useTeamsData hook
 * 
 * @returns {Object} Query result with all user teams
 */
export function useUserTeams() {
  // Use the App Router compatible hook
  return useUserTeamsViaApi();
}

export default {
  // App Router compatible hooks
  useTeamViaApi,
  useTeamMembersViaApi,
  useCreateTeamViaApi,
  useUpdateTeamViaApi,
  useTeamsByCohortViaApi,
  useUserTeamsViaApi,
  
  // Legacy hooks (now using App Router endpoints internally)
  useTeam,
  useTeamMembers,
  useCreateTeam,
  useUpdateTeam,
  useTeamsByCohort,
  useUserTeams
};