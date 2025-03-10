import { useQuery, QueryClient } from '@tanstack/react-query';

// Types
import type { 
  Profile, 
  Team, 
  Application, 
  ParticipationData, 
  MilestoneData
} from '@/types/dashboard';

/**
 * Custom hook for fetching user profile data
 */
export function useProfileData() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in');
        }
        throw new Error('Failed to fetch profile data');
      }
      return await response.json() as Profile;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Custom hook for fetching user's teams data
 */
export function useTeamsData() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in');
        }
        throw new Error('Failed to fetch teams data');
      }
      return await response.json() as Team[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Custom hook for fetching user's applications data
 */
export function useApplicationsData() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await fetch('/api/user/check-application');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in');
        }
        return { applications: [] }; // Return empty array on error to prevent crashing
      }
      return await response.json() as { applications: Application[] };
    },
    staleTime: 60 * 1000, // 1 minute
    select: (data) => data.applications || [],
  });
}

/**
 * Custom hook for fetching program participation data
 */
export function useProgramData() {
  return useQuery({
    queryKey: ['participation'],
    queryFn: async () => {
      const response = await fetch('/api/user/participation');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in');
        }
        if (response.status === 404) {
          return { participation: [] };
        }
        throw new Error('Failed to fetch program data');
      }
      return await response.json() as ParticipationData;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Custom hook for fetching milestone data
 */
export function useMilestoneData(cohortId?: string) {
  return useQuery({
    queryKey: ['milestones', cohortId],
    queryFn: async () => {
      if (!cohortId) {
        return { milestones: [] };
      }
      
      const response = await fetch(`/api/cohorts/${cohortId}/milestones`);
      if (!response.ok) {
        // Return empty milestones on error to prevent crashing
        return { milestones: [] };
      }
      return await response.json() as MilestoneData;
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!cohortId, // Only fetch if cohortId is available
  });
}

/**
 * Update a user profile
 */
export async function updateProfileData(profileData: Partial<Profile>, queryClient: QueryClient): Promise<Profile> {
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  
  const data = await response.json();
  
  // Invalidate profile query to refetch updated data
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  
  return data;
}

/**
 * Update a team
 */
export async function updateTeamData(teamId: string, teamData: Partial<Team>, queryClient: QueryClient): Promise<Team> {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teamData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update team');
  }
  
  const data = await response.json();
  
  // Invalidate teams query to refetch updated data
  queryClient.invalidateQueries({ queryKey: ['teams'] });
  
  return data;
}

/**
 * Invite a user to a team
 */
export async function inviteTeamMember(teamId: string, email: string, queryClient: QueryClient): Promise<any> {
  const response = await fetch(`/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to invite team member');
  }
  
  return await response.json();
}

/**
 * Create a new team
 */
export async function createTeam(teamData: Partial<Team>, cohortId?: string, queryClient?: QueryClient): Promise<Team> {
  // Construct the URL with cohortId if provided
  let url = '/api/teams/create';
  if (cohortId) {
    url = `${url}?cohortId=${encodeURIComponent(cohortId)}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(teamData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create team');
  }
  
  const data = await response.json();
  
  // Invalidate teams query to refetch updated data if queryClient is provided
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  }
  
  return data;
}

/**
 * Custom hook for fetching point transactions with caching
 * @param contactId - Optional contact ID to filter transactions
 * @param teamId - Optional team ID to filter transactions
 */
export function usePointTransactions(contactId?: string, teamId?: string) {
  return useQuery({
    queryKey: ['pointTransactions', contactId, teamId],
    queryFn: async () => {
      console.log(`Fetching point transactions - contactId: ${contactId || 'all'}, teamId: ${teamId || 'all'}`);
      
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (teamId) params.append('teamId', teamId);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/points/transactions${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch point transactions: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.transactions || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable if at least one filter is provided
    enabled: !!(contactId || teamId),
    retry: 2
  });
}

/**
 * Custom hook for fetching achievements with caching
 */
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      console.log('Fetching achievements');
      
      const response = await fetch('/api/points/achievements');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.achievements || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - achievements don't change often
    retry: 2
  });
}

/**
 * Invalidate all dashboard data
 */
export function invalidateAllData(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  queryClient.invalidateQueries({ queryKey: ['teams'] });
  queryClient.invalidateQueries({ queryKey: ['applications'] });
  queryClient.invalidateQueries({ queryKey: ['participation'] });
  queryClient.invalidateQueries({ queryKey: ['milestones'] });
  queryClient.invalidateQueries({ queryKey: ['pointTransactions'] });
  queryClient.invalidateQueries({ queryKey: ['achievements'] });
}