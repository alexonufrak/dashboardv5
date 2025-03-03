import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
      return response.json()
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
      if (!cohortId) return { milestones: [] }
      
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/cohorts/${cohortId}/milestones?_t=${timestamp}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch milestones: ${response.statusText}`)
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!cohortId,
    retry: 2
  })
}

/**
 * Update profile data and invalidate cache
 */
export async function updateProfileData(updatedData, queryClient) {
  try {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update profile")
    }
    
    const updatedProfile = await response.json()
    
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
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update team")
    }
    
    const updatedTeam = await response.json()
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
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
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send invitation")
    }
    
    const result = await response.json()
    
    // Invalidate teams cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    
    toast.success("Invitation sent successfully")
    return result
  } catch (err) {
    console.error("Error inviting team member:", err)
    toast.error(err.message || "Failed to send invitation")
    throw err
  }
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
}