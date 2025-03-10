import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { addToast } from "@heroui/react";

// Types
import type { 
  Profile, 
  Team, 
  TeamMember,
  Application, 
  ParticipationData, 
  MilestoneData,
  SubmissionData,
  UserMetadata,
  TeamCohortsData,
  Institution,
  InitiativeConflictsData,
  Reward,
  ClaimedReward
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
      
      try {
        return await response.json() as Profile;
      } catch (error) {
        console.error('Error parsing profile response:', error);
        throw new Error('Invalid profile data received');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
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
      
      try {
        const data = await response.json();
        return data.teams || [] as Team[];
      } catch (error) {
        console.error('Error parsing teams response:', error);
        throw new Error('Invalid teams data received');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
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
      
      try {
        const data = await response.json();
        return data && Array.isArray(data.applications) ? data.applications : [] as Application[];
      } catch (error) {
        console.error('Error parsing applications response:', error);
        return [] as Application[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

/**
 * Custom hook for fetching program participation data
 */
export function useProgramData() {
  return useQuery({
    queryKey: ['participation'],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/user/participation?_t=${timestamp}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in');
        }
        if (response.status === 404) {
          return { participation: [] } as ParticipationData;
        }
        throw new Error('Failed to fetch program data');
      }
      
      try {
        const responseText = await response.text();
        let participationData;
        
        try {
          participationData = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse participation response as JSON:', e);
          throw new Error('Invalid response format from participation API');
        }
        
        return participationData as ParticipationData;
      } catch (error) {
        console.error('Error processing participation data:', error);
        return { participation: [] } as ParticipationData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
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
        return { milestones: [] } as MilestoneData;
      }
      
      const timestamp = new Date().getTime();
      const url = `/api/cohorts/${cohortId}/milestones?_t=${timestamp}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch milestones: ${response.status} ${response.statusText}`);
        // Return empty milestones on error to prevent crashing
        return { milestones: [] } as MilestoneData;
      }
      
      try {
        const data = await response.json();
        return data as MilestoneData;
      } catch (error) {
        console.error('Error parsing milestones response:', error);
        return { milestones: [] } as MilestoneData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!cohortId, // Only fetch if cohortId is available
    retry: 2
  });
}

/**
 * Custom hook for team submissions data fetching with efficient milestone filtering
 */
export function useTeamSubmissions(teamId?: string, milestoneId?: string) {
  return useQuery({
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async () => {
      // Skip if missing required teamId
      if (!teamId) {
        return { submissions: [] } as SubmissionData;
      }
      
      // Create URL with milestone filter if provided
      const url = `/api/teams/${teamId}/submissions${milestoneId ? `?milestoneId=${milestoneId}` : ''}`;
      
      // Make direct API call to get filtered submissions
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Error fetching submissions: ${response.status}`);
        return { submissions: [] } as SubmissionData;
      }
      
      try {
        const data = await response.json();
        return data as SubmissionData;
      } catch (error) {
        console.error('Error parsing submissions response:', error);
        return { submissions: [] } as SubmissionData;
      }
    },
    // Cache settings
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!teamId,
    retry: 2
  });
}

/**
 * Custom hook for team cohorts data fetching with caching
 */
export function useTeamCohorts(teamId?: string) {
  return useQuery({
    queryKey: ['teamCohorts', teamId],
    queryFn: async () => {
      if (!teamId) return { cohorts: [] } as TeamCohortsData;
      
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/teams/${teamId}/cohorts?_t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team cohorts: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data as TeamCohortsData;
      } catch (error) {
        console.error('Error parsing team cohorts response:', error);
        return { cohorts: [] } as TeamCohortsData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!teamId,
    retry: 2
  });
}

/**
 * Custom hook for user metadata fetching with caching
 */
export function useUserMetadata() {
  return useQuery({
    queryKey: ['userMetadata'],
    queryFn: async () => {
      const response = await fetch('/api/user/metadata');
      if (!response.ok) {
        throw new Error('Failed to fetch user metadata');
      }
      
      try {
        return await response.json() as UserMetadata;
      } catch (error) {
        console.error('Error parsing user metadata response:', error);
        return {} as UserMetadata;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - metadata changes infrequently
    retry: 2
  });
}

/**
 * Custom hook for updating user metadata with automatic cache invalidation
 */
export function useUpdateUserMetadata() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (metadata: Partial<UserMetadata>) => {
      const response = await fetch('/api/user/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user metadata');
      }
      
      return await response.json() as UserMetadata;
    },
    onSuccess: (data) => {
      // Update the cached data
      queryClient.setQueryData(['userMetadata'], data);
      addToast({
        title: "Success",
        description: "User preferences updated",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for updating onboarding status with automatic cache invalidation
 */
export function useUpdateOnboardingStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (status: boolean) => {
      const response = await fetch('/api/user/onboarding-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update onboarding status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userMetadata'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      addToast({
        title: "Success",
        description: "Onboarding progress updated",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update onboarding progress',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for institution lookup with caching
 */
export function useInstitutionLookup(query?: string) {
  return useQuery({
    queryKey: ['institutionLookup', query],
    queryFn: async () => {
      if (!query || query.length < 3) return { institutions: [] as Institution[] };
      
      const response = await fetch(`/api/institution-lookup?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to lookup institutions');
      }
      
      try {
        return await response.json() as { institutions: Institution[] };
      } catch (error) {
        console.error('Error parsing institution lookup response:', error);
        return { institutions: [] as Institution[] };
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour - institution data rarely changes
    enabled: !!query && query.length >= 3,
    retry: 1
  });
}

/**
 * Custom hook for checking initiative conflicts
 */
export function useInitiativeConflicts(contactId?: string) {
  return useQuery({
    queryKey: ['initiativeConflicts', contactId],
    queryFn: async () => {
      if (!contactId) return { conflicts: [] } as InitiativeConflictsData;
      
      const response = await fetch(`/api/user/check-initiative-conflicts?contactId=${contactId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check initiative conflicts');
      }
      
      try {
        return await response.json() as InitiativeConflictsData;
      } catch (error) {
        console.error('Error parsing initiative conflicts response:', error);
        return { conflicts: [] } as InitiativeConflictsData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!contactId,
    retry: 2
  });
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
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (teamId) params.append('teamId', teamId);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/points/transactions${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch point transactions: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data.transactions || [];
      } catch (error) {
        console.error('Error parsing point transactions response:', error);
        return [];
      }
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
      const response = await fetch('/api/points/achievements');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data.achievements || [];
      } catch (error) {
        console.error('Error parsing achievements response:', error);
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour - achievements don't change often
    retry: 2
  });
}

/**
 * Custom hook for fetching available rewards with caching
 */
export function useAvailableRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data.rewards || [] as Reward[];
      } catch (error) {
        console.error('Error parsing rewards response:', error);
        return [] as Reward[];
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - rewards availability can change
    retry: 2
  });
}

/**
 * Custom hook for fetching claimed rewards with caching
 * @param contactId - Optional contact ID to filter claimed rewards
 * @param teamId - Optional team ID to filter claimed rewards
 */
export function useClaimedRewards(contactId?: string, teamId?: string) {
  return useQuery({
    queryKey: ['claimedRewards', contactId, teamId],
    queryFn: async () => {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (contactId) params.append('contactId', contactId);
      if (teamId) params.append('teamId', teamId);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/rewards/claimed${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch claimed rewards: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data.claimedRewards || [] as ClaimedReward[];
      } catch (error) {
        console.error('Error parsing claimed rewards response:', error);
        return [] as ClaimedReward[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable if at least one filter is provided
    enabled: !!(contactId || teamId),
    retry: 2
  });
}

/**
 * Custom hook for claiming a reward with automatic cache invalidation
 */
export function useClaimReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      rewardId, 
      teamId, 
      contactId, 
      notes 
    }: { 
      rewardId: string; 
      teamId?: string; 
      contactId?: string; 
      notes?: string 
    }) => {
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          teamId,
          contactId,
          notes
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to claim reward');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['claimedRewards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] }); // Points may be affected
      
      addToast({
        title: "Success",
        description: "Reward claimed successfully",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to claim reward',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for fetching majors data with caching
 */
export function useMajors() {
  return useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await fetch('/api/majors');
      if (!response.ok) {
        throw new Error('Failed to fetch majors data');
      }
      
      try {
        const data = await response.json();
        return data.majors || [];
      } catch (error) {
        console.error('Error parsing majors response:', error);
        return [];
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours since this rarely changes
    retry: 2
  });
}

/**
 * Update a user profile
 */
export async function updateProfileData(profileData: Partial<Profile>, queryClient: QueryClient): Promise<Profile> {
  try {
    // Create a clean copy of the data that we can safely modify
    const dataToSend: any = { 
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      degreeType: profileData.degreeType,
      graduationYear: profileData.graduationYear,
      contactId: profileData.contactId || profileData.id,  // Use contactId first, fall back to id
      institutionId: profileData.institution?.id,
      educationId: profileData.educationId
    };
    
    // Check if we have a contactId (required for Airtable updates)
    if (!dataToSend.contactId) {
      console.error('Missing contactId for profile update - cannot update Airtable record');
      
      // Show warning to user
      addToast({
        title: "Warning",
        description: "Your Airtable profile record is not linked. Some features may be limited.",
        color: "warning"
      });
    }
    
    // Handle the major field carefully
    if ('major' in profileData) {
      // Ensure it's a valid Airtable record ID or null
      if (typeof profileData.major === 'string' && 
          (profileData.major.startsWith('rec') || profileData.major.trim() === '')) {
        dataToSend.major = profileData.major || null;
      } else if (profileData.major === null) {
        // Allow explicit null value
        dataToSend.major = null;
      }
    }
    
    console.log("Sending profile update with data:", JSON.stringify(dataToSend, null, 2));
    
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update profile';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If the response isn't valid JSON, use the status text
        errorMessage = `Error (${response.status}): ${response.statusText || errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Check if there was an Airtable error but Auth0 was updated
    if (data.airtableError) {
      console.warn('Auth0 profile updated but Airtable update failed');
      
      addToast({
        title: "Partial Success",
        description: "Your profile was updated in Auth0, but Airtable update failed. Some features may be affected.",
        color: "warning"
      });
    } else {
      addToast({
        title: "Success",
        description: "Profile updated successfully",
        color: "success"
      });
    }
    
    // Invalidate profile query to refetch updated data
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    
    return data as Profile;
  } catch (err) {
    console.error('Error updating profile:', err);
    addToast({
      title: "Error",
      description: err instanceof Error ? err.message : 'Failed to update profile',
      color: "danger"
    });
    throw err;
  }
}

/**
 * Update a team
 */
export async function updateTeamData(teamId: string, teamData: Partial<Team>, queryClient: QueryClient): Promise<Team> {
  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: 'PATCH', // Using PATCH is more appropriate for partial updates
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });
    
    // Get the text first to properly handle the response
    const responseText = await response.text();
    
    // Parse the JSON only if there's actually content
    let updatedTeam;
    try {
      updatedTeam = responseText ? JSON.parse(responseText) : {};
    } catch (jsonError) {
      console.error('Error parsing response JSON:', jsonError);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      throw new Error(updatedTeam.error || `Failed to update team (${response.status})`);
    }
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    
    // Also invalidate any team cohorts cache that might exist for this team
    queryClient.invalidateQueries({ queryKey: ['teamCohorts', teamId] });
    
    addToast({
      title: "Success",
      description: "Team updated successfully",
      color: "success"
    });
    return updatedTeam as Team;
  } catch (err) {
    console.error('Error updating team:', err);
    addToast({
      title: "Error",
      description: err instanceof Error ? err.message : 'Failed to update team',
      color: "danger"
    });
    throw err;
  }
}

/**
 * Invite a user to a team
 */
export async function inviteTeamMember(
  teamId: string, 
  inviteData: { 
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string; 
  }, 
  queryClient: QueryClient
): Promise<TeamMember> {
  try {
    const response = await fetch(`/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inviteData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to invite team member');
    }
    
    const result = await response.json();
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    
    addToast({
      title: "Invitation Sent",
      description: `Invitation sent to ${inviteData.email}`,
      color: "success"
    });
    return result as TeamMember;
  } catch (err) {
    console.error('Error inviting team member:', err);
    addToast({
      title: "Error",
      description: err instanceof Error ? err.message : 'Failed to send invitation',
      color: "danger"
    });
    throw err;
  }
}

/**
 * Create a new team
 */
export async function createTeam(
  teamData: Partial<Team>, 
  cohortId?: string, 
  queryClient?: QueryClient
): Promise<Team> {
  try {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to create team');
    }
    
    const team = await response.json();
    
    // Invalidate teams query to refetch updated data if queryClient is provided
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
    
    addToast({
      title: "Success",
      description: "Team created successfully",
      color: "success"
    });
    return team as Team;
  } catch (err) {
    console.error('Error creating team:', err);
    addToast({
      title: "Error",
      description: err instanceof Error ? err.message : 'Failed to create team',
      color: "danger"
    });
    throw err;
  }
}

/**
 * useMutation hook for creating a team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      teamData, 
      cohortId 
    }: { 
      teamData: Partial<Team>; 
      cohortId?: string 
    }) => {
      return createTeam(teamData, cohortId, queryClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
  });
}

/**
 * Extracts team data from an API response, handling both wrapped and unwrapped formats
 * @param response - The API response
 * @returns The team data
 */
export function extractTeamData<T>(response: { team?: T } | T): T {
  // Handle both formats (wrapped with .team or unwrapped)
  if (response && typeof response === 'object' && 'team' in response && response.team !== undefined) {
    return response.team;
  }
  return response as T;
}

/**
 * Standardizes an API response by wrapping the data in a named object if needed
 * @param data - The data to standardize
 * @param resourceName - The name of the resource (e.g., 'team', 'submission')
 * @returns The standardized response
 */
export function standardizeApiResponse<T>(data: T | Record<string, T>, resourceName: string): Record<string, T> {
  // If data is already in the format { resourceName: ... }, return it as is
  if (data && typeof data === 'object' && resourceName in (data as object)) {
    return data as Record<string, T>;
  }
  
  // Otherwise, wrap it
  return { [resourceName]: data as T };
}

/**
 * Custom hook for a team member to leave a team
 */
export function useLeaveTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to leave team');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      addToast({
        title: "Success",
        description: "You have left the team",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to leave team',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for removing a team member (as team admin)
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to remove team member');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', variables.teamId] });
      
      addToast({
        title: "Success",
        description: "Team member has been removed",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove team member',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for fetching team members with extended details and caching
 */
export function useTeamMembers(teamId?: string) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async () => {
      if (!teamId) return { members: [] };
      
      const response = await fetch(`/api/teams/${teamId}/members`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error parsing team members response:', error);
        return { members: [] };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!teamId,
    retry: 2
  });
}

/**
 * Custom hook for updating team member roles with automatic cache invalidation
 */
export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      memberId, 
      role 
    }: { 
      teamId: string; 
      memberId: string; 
      role: string 
    }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update member role');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', variables.teamId] });
      
      addToast({
        title: "Success",
        description: "Team member role updated",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update member role',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for submitting milestone work
 */
export function useSubmitMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      milestoneId, 
      data 
    }: { 
      teamId: string; 
      milestoneId: string; 
      data: any 
    }) => {
      const response = await fetch(`/api/teams/${teamId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneId,
          ...data
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to submit milestone work');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['submissions', variables.teamId, variables.milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      addToast({
        title: "Success",
        description: "Milestone work submitted successfully",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit milestone work',
        color: "danger"
      });
    }
  });
}

/**
 * Custom hook for fetching program bounties (tasks/challenges) with caching
 */
export function useProgramBounties(programId?: string) {
  return useQuery({
    queryKey: ['bounties', programId],
    queryFn: async () => {
      if (!programId) return { bounties: [] };
      
      const response = await fetch(`/api/bounties?programId=${programId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch program bounties: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        return data.bounties || [];
      } catch (error) {
        console.error('Error parsing bounties response:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!programId,
    retry: 2
  });
}

/**
 * Custom hook for submitting application for a program
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to submit application');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      addToast({
        title: "Success",
        description: "Application submitted successfully",
        color: "success"
      });
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit application',
        color: "danger"
      });
    }
  });
}

/**
 * Hook for direct file uploads with progress tracking
 */
export function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const uploadFile = async (file: File): Promise<{ url: string; filename: string; contentType: string; size: number }> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Step 1: Get pre-signed URL from our API
      const getUrlResponse = await fetch('/api/upload');
      
      if (!getUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, fileUrl } = await getUrlResponse.json();
      
      // Step 2: Upload file directly to storage provider
      const xhr = new XMLHttpRequest();
      
      // Create a promise to track the upload
      const uploadPromise = new Promise<{ url: string; filename: string; contentType: string; size: number }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              url: fileUrl,
              filename: file.name,
              contentType: file.type,
              size: file.size
            });
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed due to network error'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'));
        });
      });
      
      // Start the upload
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
      
      // Wait for upload to complete
      const result = await uploadPromise;
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown upload error');
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { uploadFile, progress, isUploading, error };
}

export function invalidateAllData(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  queryClient.invalidateQueries({ queryKey: ['teams'] });
  queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
  queryClient.invalidateQueries({ queryKey: ['applications'] });
  queryClient.invalidateQueries({ queryKey: ['participation'] });
  queryClient.invalidateQueries({ queryKey: ['milestones'] });
  queryClient.invalidateQueries({ queryKey: ['submissions'] });
  queryClient.invalidateQueries({ queryKey: ['teamCohorts'] });
  queryClient.invalidateQueries({ queryKey: ['majors'] });
  queryClient.invalidateQueries({ queryKey: ['userMetadata'] });
  queryClient.invalidateQueries({ queryKey: ['pointTransactions'] });
  queryClient.invalidateQueries({ queryKey: ['achievements'] });
  queryClient.invalidateQueries({ queryKey: ['rewards'] });
  queryClient.invalidateQueries({ queryKey: ['claimedRewards'] });
  queryClient.invalidateQueries({ queryKey: ['institutionLookup'] });
  queryClient.invalidateQueries({ queryKey: ['initiativeConflicts'] });
  queryClient.invalidateQueries({ queryKey: ['bounties'] });
}