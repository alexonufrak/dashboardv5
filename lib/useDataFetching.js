import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractTeamData } from './utils'

/**
 * Custom hook for profile data fetching with caching
 */
export function useProfileData() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('Fetching profile data')
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      // Handle the new wrapped response structure
      return data.profile || data // Extract profile from wrapper if it exists, otherwise return whole response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

/**
 * Custom hook for teams data fetching with caching
 */
export function useTeamsData() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      console.log('Fetching teams data')
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams data')
      }
      const data = await response.json()
      return data.teams || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

/**
 * Custom hook for applications data fetching with caching
 */
export function useApplicationsData() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      console.log('Fetching applications data')
      const response = await fetch('/api/user/check-application')
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data && Array.isArray(data.applications) ? data.applications : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

/**
 * Custom hook for program participation data fetching with caching
 */
export function useProgramData() {
  return useQuery({
    queryKey: ['participation'],
    queryFn: async () => {
      console.log('Fetching participation data')
      const timestamp = new Date().getTime()
      const participationResponse = await fetch(`/api/user/participation?_t=${timestamp}`)
      
      if (!participationResponse.ok) {
        throw new Error(`Failed to fetch participation data: ${participationResponse.statusText}`)
      }

      const responseText = await participationResponse.text()
      let participationData
      
      try {
        participationData = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse participation response as JSON:', e)
        throw new Error('Invalid response format from participation API')
      }
      
      return participationData
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

/**
 * Custom hook for milestone data fetching with caching
 */
export function useMilestoneData(cohortId) {
  return useQuery({
    queryKey: ['milestones', cohortId],
    queryFn: async () => {
      console.log(`Fetching milestones for cohort ${cohortId}`)
      if (!cohortId) {
        console.log('No cohortId provided for milestone fetch, skipping')
        return { milestones: [] }
      }
      
      const timestamp = new Date().getTime()
      console.log(`Making milestone API request to: /api/cohorts/${cohortId}/milestones?_t=${timestamp}`)
      const response = await fetch(`/api/cohorts/${cohortId}/milestones?_t=${timestamp}`)
      
      if (!response.ok) {
        console.error(`Failed to fetch milestones: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch milestones: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Milestone API response: Found ${data.milestones?.length || 0} milestones`)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!cohortId,
    retry: 2
  })
}

/**
 * Custom hook for team submissions data fetching with efficient milestone filtering
 * Simplified implementation that fetches submissions for a specific team and milestone
 */
export function useTeamSubmissions(teamId, milestoneId) {
  // Return a clean, simple query that focuses on getting the right data
  return useQuery({
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async () => {
      // Skip if missing required teamId
      if (!teamId) {
        return { submissions: [] };
      }
      
      // Create URL with milestone filter if provided
      const url = `/api/teams/${teamId}/submissions${milestoneId ? `?milestoneId=${milestoneId}` : ''}`;
      
      // Make direct API call to get filtered submissions
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Error fetching submissions: ${response.status}`);
        return { submissions: [] };
      }
      
      const data = await response.json();
      return data;
    },
    // Cache settings
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to reduce fetch frequency
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!teamId,
  });
}

/**
 * Custom hook for team cohorts data fetching with caching
 */
export function useTeamCohorts(teamId) {
  return useQuery({
    queryKey: ['teamCohorts', teamId],
    queryFn: async () => {
      console.log(`Fetching cohorts for team ${teamId}`)
      if (!teamId) return { cohorts: [] }
      
      const response = await fetch(`/api/teams/${teamId}/cohorts?_t=${new Date().getTime()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team cohorts: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`Team cohorts API response:`, data)
      
      // Return the full response object for better debugging
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!teamId,
    retry: 2
  })
}

/**
 * Custom hook for majors data fetching with caching
 */
export function useMajors() {
  return useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      console.log('Fetching majors data')
      const response = await fetch('/api/user/majors')
      
      if (!response.ok) {
        throw new Error('Failed to fetch majors')
      }
      
      const data = await response.json()
      return data.majors || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour - majors rarely change
    retry: 2
  })
}

/**
 * Update profile data and invalidate cache
 */
export async function updateProfileData(updatedData, queryClient) {
  try {
    // Create a clean copy of the data that we can safely modify
    const dataToSend = { 
      firstName: updatedData.firstName,
      lastName: updatedData.lastName,
      degreeType: updatedData.degreeType,
      graduationYear: updatedData.graduationYear,
      contactId: updatedData.contactId,
      institutionId: updatedData.institutionId,
      educationId: updatedData.educationId
    };
    
    // Handle the major field carefully
    if (updatedData.major) {
      // Ensure it's a valid Airtable record ID
      if (typeof updatedData.major === 'string' && updatedData.major.startsWith('rec')) {
        dataToSend.major = updatedData.major;
      } else if (typeof updatedData.major === 'string' && updatedData.major.trim() === '') {
        // Allow empty string or null for clearing the major
        dataToSend.major = null;
      } else if (updatedData.major === null) {
        // Allow explicit null value
        dataToSend.major = null;
      } else {
        console.warn(`Major field has invalid format: "${updatedData.major}"`);
        // Use programId if available as fallback
        if (updatedData.programId && typeof updatedData.programId === 'string' && updatedData.programId.startsWith('rec')) {
          console.log(`Using programId instead: ${updatedData.programId}`);
          dataToSend.major = updatedData.programId;
        } else {
          // Don't show warning toast in UI as it may be confusing to users
          // Just log the issue and skip this field
          console.log("Major field will not be updated");
        }
      }
    }
    
    // Log the cleaned data being sent
    console.log("Sending profile update with valid data:", {
      firstName: dataToSend.firstName,
      lastName: dataToSend.lastName,
      major: dataToSend.major || "(not included)",
      contactId: dataToSend.contactId
    });
    
    // Send the request with the cleaned data
    console.log("Initiating profile update API request...");
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update profile")
    }
    
    const data = await response.json()
    
    // Extract profile from response if it's wrapped, otherwise use the whole response
    const updatedProfile = data.profile || data
    
    // Update cache with new data
    queryClient.setQueryData(['profile'], updatedProfile)
    
    toast.success("Profile updated successfully")
    return updatedProfile
  } catch (err) {
    console.error("Error updating profile:", err)
    toast.error(err.message || "Failed to update profile")
    throw err
  }
}

/**
 * Update team data and invalidate cache
 */
export async function updateTeamData(teamId, data, queryClient) {
  try {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH", // Using PATCH as defined in the TeamEditDialog.js
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    
    // Get the text first to properly handle the response
    const responseText = await response.text()
    
    // Parse the JSON only if there's actually content
    let updatedTeam
    try {
      updatedTeam = responseText ? JSON.parse(responseText) : {}
    } catch (jsonError) {
      console.error("Error parsing response JSON:", jsonError)
      throw new Error("Invalid response from server")
    }
    
    if (!response.ok) {
      throw new Error(updatedTeam.error || `Failed to update team (${response.status})`)
    }
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    // Also invalidate any team cohorts cache that might exist for this team
    queryClient.invalidateQueries({ queryKey: ['teamCohorts', teamId] })
    
    toast.success("Team updated successfully")
    return updatedTeam
  } catch (err) {
    console.error("Error updating team:", err)
    toast.error(err.message || "Failed to update team")
    throw err
  }
}

/**
 * Invite team member and invalidate cache
 */
export async function inviteTeamMember(teamId, inviteData, queryClient) {
  try {
    const response = await fetch(`/api/teams/${teamId}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inviteData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to send invitation")
    }
    
    const result = await response.json()
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    toast.success(`Invitation sent to ${inviteData.firstName} ${inviteData.lastName}`)
    return result
  } catch (err) {
    console.error("Error inviting team member:", err)
    toast.error(err.message || "Failed to send invitation")
    throw err
  }
}

/**
 * Create a new team
 */
export async function createTeam(teamData, cohortId, queryClient) {
  try {
    // Construct the URL with cohortId if provided
    let url = '/api/teams/create'
    if (cohortId) {
      url = `${url}?cohortId=${encodeURIComponent(cohortId)}`
    }
    
    // Log the team data
    console.log("Creating team with data:", teamData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(teamData)
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to create team')
    }
    
    const team = await response.json()
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    toast.success("Team created successfully")
    return team
  } catch (err) {
    console.error("Error creating team:", err)
    toast.error(err.message || "Failed to create team")
    throw err
  }
}

/**
 * useMutation hook for creating a team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ teamData, cohortId }) => createTeam(teamData, cohortId, queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })
}

/**
 * Custom hook for user metadata fetching with caching
 */
export function useUserMetadata() {
  return useQuery({
    queryKey: ['userMetadata'],
    queryFn: async () => {
      console.log('Fetching user metadata')
      const response = await fetch('/api/user/metadata')
      if (!response.ok) {
        throw new Error('Failed to fetch user metadata')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - metadata changes infrequently
    retry: 2
  })
}

/**
 * Custom hook for updating user metadata with automatic cache invalidation
 */
export function useUpdateUserMetadata() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (metadata) => {
      console.log('Updating user metadata', metadata)
      const response = await fetch('/api/user/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update user metadata')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Update the cached data
      queryClient.setQueryData(['userMetadata'], data)
      toast.success('User preferences updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update preferences')
    }
  })
}

/**
 * Custom hook for updating onboarding status with automatic cache invalidation
 */
export function useUpdateOnboardingStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (status) => {
      console.log('Updating onboarding status', status)
      const response = await fetch('/api/user/onboarding-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: status }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update onboarding status')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userMetadata'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Onboarding progress updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update onboarding progress')
    }
  })
}

/**
 * Custom hook for institution lookup with caching
 */
export function useInstitutionLookup(query) {
  return useQuery({
    queryKey: ['institutionLookup', query],
    queryFn: async () => {
      if (!query || query.length < 3) return { institutions: [] }
      
      console.log(`Looking up institutions for "${query}"`)
      const response = await fetch(`/api/institution-lookup?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Failed to lookup institutions')
      }
      
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // 1 hour - institution data rarely changes
    enabled: !!query && query.length >= 3,
    retry: 1
  })
}

/**
 * Custom hook for checking initiative conflicts
 */
export function useInitiativeConflicts(contactId) {
  return useQuery({
    queryKey: ['initiativeConflicts', contactId],
    queryFn: async () => {
      if (!contactId) return { conflicts: [] }
      
      console.log(`Checking initiative conflicts for contact ${contactId}`)
      const response = await fetch(`/api/user/check-initiative-conflicts?contactId=${contactId}`)
      
      if (!response.ok) {
        throw new Error('Failed to check initiative conflicts')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!contactId,
    retry: 2
  })
}

/**
 * Custom hook for fetching point transactions with caching
 * @param {string} contactId - Optional contact ID to filter transactions
 * @param {string} teamId - Optional team ID to filter transactions
 */
export function usePointTransactions(contactId, teamId) {
  return useQuery({
    queryKey: ['pointTransactions', contactId, teamId],
    queryFn: async () => {
      console.log(`Fetching point transactions - contactId: ${contactId || 'all'}, teamId: ${teamId || 'all'}`)
      
      // Build query parameters based on filters
      const params = new URLSearchParams()
      if (contactId) params.append('contactId', contactId)
      if (teamId) params.append('teamId', teamId)
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`/api/points/transactions${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch point transactions: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.transactions || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable if at least one filter is provided
    enabled: !!(contactId || teamId),
    retry: 2
  })
}

/**
 * Custom hook for fetching achievements with caching
 */
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      console.log('Fetching achievements')
      
      const response = await fetch('/api/points/achievements')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.achievements || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour - achievements don't change often
    retry: 2
  })
}

/**
 * Custom hook for fetching available rewards with caching
 */
export function useAvailableRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      console.log('Fetching available rewards')
      
      const response = await fetch('/api/rewards')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.rewards || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - rewards availability can change
    retry: 2
  })
}

/**
 * Custom hook for fetching claimed rewards with caching
 * @param {string} contactId - Optional contact ID to filter claimed rewards
 * @param {string} teamId - Optional team ID to filter claimed rewards
 */
export function useClaimedRewards(contactId, teamId) {
  return useQuery({
    queryKey: ['claimedRewards', contactId, teamId],
    queryFn: async () => {
      console.log(`Fetching claimed rewards - contactId: ${contactId || 'all'}, teamId: ${teamId || 'all'}`)
      
      // Build query parameters based on filters
      const params = new URLSearchParams()
      if (contactId) params.append('contactId', contactId)
      if (teamId) params.append('teamId', teamId)
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`/api/rewards/claimed${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch claimed rewards: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.claimedRewards || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only enable if at least one filter is provided
    enabled: !!(contactId || teamId),
    retry: 2
  })
}

/**
 * Custom hook for claiming a reward with automatic cache invalidation
 */
export function useClaimReward() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ rewardId, teamId, contactId, notes }) => {
      console.log(`Claiming reward: ${rewardId}`)
      
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          teamId,
          contactId,
          notes
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to claim reward')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['claimedRewards'] })
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] }) // Points may be affected
      
      toast.success('Reward claimed successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to claim reward')
    }
  })
}

/**
 * Function to invalidate all cached data
 */
export function invalidateAllData(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['profile'] })
  queryClient.invalidateQueries({ queryKey: ['teams'] })
  queryClient.invalidateQueries({ queryKey: ['applications'] })
  queryClient.invalidateQueries({ queryKey: ['participation'] })
  queryClient.invalidateQueries({ queryKey: ['milestones'] })
  queryClient.invalidateQueries({ queryKey: ['submissions'] })
  queryClient.invalidateQueries({ queryKey: ['teamCohorts'] })
  queryClient.invalidateQueries({ queryKey: ['majors'] })
  queryClient.invalidateQueries({ queryKey: ['userMetadata'] })
  queryClient.invalidateQueries({ queryKey: ['pointTransactions'] })
  queryClient.invalidateQueries({ queryKey: ['achievements'] })
  queryClient.invalidateQueries({ queryKey: ['rewards'] })
  queryClient.invalidateQueries({ queryKey: ['claimedRewards'] })
}