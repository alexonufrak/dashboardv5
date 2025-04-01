import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Custom hook for team data
 * @param {string} teamId Team ID
 * @returns {Object} Query result with team data
 */
export function useTeam(teamId) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      
      console.log(`Fetching team data for ID: ${teamId}`);
      
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          cache: 'no-cache',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch team: ${response.statusText}`);
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
}

/**
 * Custom hook for team members data
 * @param {string} teamId Team ID
 * @returns {Object} Query result with team members data
 */
export function useTeamMembers(teamId) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async () => {
      if (!teamId) return [];
      
      console.log(`Fetching team members for team ID: ${teamId}`);
      
      try {
        const response = await fetch(`/api/teams/${teamId}/members`, {
          cache: 'no-cache',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch team members: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.members || [];
      } catch (error) {
        console.error(`Team members fetch error for team ID ${teamId}:`, error);
        throw error;
      }
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

/**
 * Custom hook for creating a team
 * @returns {Object} Mutation result
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamData) => {
      console.log('Creating team:', teamData);
      
      try {
        const response = await fetch('/api/teams/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(teamData),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create team: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error('Team creation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      // If we have a cohort ID, invalidate that specific cohort's teams
      if (data.team?.cohorts && data.team.cohorts.length > 0) {
        queryClient.invalidateQueries({ 
          queryKey: ['teamsByCohort', data.team.cohorts[0]] 
        });
      }
      
      toast.success('Team created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create team');
    }
  });
}

/**
 * Custom hook for updating a team
 * @returns {Object} Mutation result
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, data }) => {
      console.log(`Updating team ${teamId}:`, data);
      
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update team: ${response.statusText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error(`Team update error for ID ${teamId}:`, error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      toast.success('Team updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update team');
    }
  });
}

/**
 * Custom hook for fetching teams by cohort
 * @param {string} cohortId Cohort ID
 * @returns {Object} Query result with teams data
 */
export function useTeamsByCohort(cohortId) {
  return useQuery({
    queryKey: ['teamsByCohort', cohortId],
    queryFn: async () => {
      if (!cohortId) return [];
      
      console.log(`Fetching teams for cohort ID: ${cohortId}`);
      
      try {
        const response = await fetch(`/api/cohorts/${cohortId}/teams`, {
          cache: 'no-cache',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cohort teams: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.teams || [];
      } catch (error) {
        console.error(`Cohort teams fetch error for cohort ID ${cohortId}:`, error);
        throw error;
      }
    },
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

export default {
  useTeam,
  useTeamMembers,
  useCreateTeam,
  useUpdateTeam,
  useTeamsByCohort
};