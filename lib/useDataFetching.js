import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
 * Custom hook for team submissions data fetching with enhanced caching
 */
export function useTeamSubmissions(teamId, milestoneId) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async () => {
      console.log(`Fetching submissions for team ${teamId} and milestone ${milestoneId}`)
      
      // Validate required parameters
      if (!teamId) {
        console.error('No team ID provided for submission fetch');
        return { submissions: [] };
      }
      
      if (!milestoneId) {
        console.error('No milestone ID provided for submission fetch');
        return { submissions: [] };
      }
      
      // Construct API URL with proper encoding
      let url = `/api/teams/${teamId}/submissions?milestoneId=${encodeURIComponent(milestoneId)}`;
      
      // Add timestamp to bust cache for fresh data
      url += `&_t=${new Date().getTime()}`;
      
      try {
        // For now, skip directly using team data submissions property since 
        // we need to ensure proper API integration with Airtable
        /*
        const teamData = queryClient.getQueryData(['teams'])?.find(team => team.id === teamId);
        
        if (teamData?.submissions?.length > 0) {
          // Filter the submissions to only include ones for this milestone
          const relevantSubmissions = teamData.submissions.filter(submission => {
            return (
              submission.milestoneId === milestoneId || 
              (Array.isArray(submission.rawMilestone) && submission.rawMilestone.includes(milestoneId)) ||
              submission.requestedMilestoneId === milestoneId
            );
          });
          
          if (relevantSubmissions.length > 0) {
            console.log(`Using ${relevantSubmissions.length} submissions from team data directly`);
            return {
              submissions: relevantSubmissions,
              fetchTime: new Date().toISOString(),
              source: 'team_data'
            };
          }
        }
        */
        
        // Attempt to fetch from cache first
        const cachedData = queryClient.getQueryData(['submissions', teamId, milestoneId]);
        
        if (cachedData) {
          console.log(`Using cached submission data for team ${teamId} and milestone ${milestoneId}`);
          console.log(`Cached submission count: ${cachedData.submissions?.length || 0}`);
          
          // If the cache is less than 2 minutes old, return it immediately without making a new request
          const cacheTime = new Date(cachedData.fetchTime || new Date().toISOString());
          const now = new Date();
          const cacheAge = (now - cacheTime) / 1000; // in seconds
          
          if (cacheAge < 120 && cachedData.submissions?.length > 0) {
            console.log(`Cache is only ${cacheAge.toFixed(1)} seconds old, using without refresh`);
            return cachedData;
          }
        }
        
        // Make a network request for fresh data
        console.log(`Making network request for submissions: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          // Try to extract error details, but minimize logging
          let errorDetails = '';
          try {
            const errorText = await response.text();
            errorDetails = errorText;
          } catch (textError) {
            // Silent fail for text extraction
          }
          
          throw new Error(`Failed to fetch submissions (${response.status}): ${errorDetails}`);
        }
        
        // Parse response data with validation
        let data;
        try {
          const responseText = await response.text();
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing submission response:', parseError);
          throw new Error('Invalid response format from submission API');
        }
        
        // Ensure submissions array exists
        const submissions = data.submissions || [];
        
        // Minimal logging for successful responses
        if (submissions.length > 0) {
          console.log(`Received ${submissions.length} submissions for milestone ${milestoneId}`);
        }
        
        // Update the cache with fresh data
        return { 
          submissions,
          fetchTime: new Date().toISOString(),
          source: 'api'
        };
      } catch (err) {
        console.error(`Error fetching submissions for team ${teamId} and milestone ${milestoneId}:`, err);
        
        // Try to use cached data as fallback if network request fails
        const cachedData = queryClient.getQueryData(['submissions', teamId, milestoneId]);
        if (cachedData) {
          console.log(`Using cached data as fallback due to fetch error`);
          return {
            ...cachedData,
            error: err.message,
            fromErrorFallback: true
          };
        }
        
        // Commented out for now to focus on direct API integration
        /*
        const teamData = queryClient.getQueryData(['teams'])?.find(team => team.id === teamId);
        if (teamData?.submissions?.length > 0) {
          const relevantSubmissions = teamData.submissions.filter(submission => {
            return (
              submission.milestoneId === milestoneId || 
              (Array.isArray(submission.rawMilestone) && submission.rawMilestone.includes(milestoneId)) ||
              submission.requestedMilestoneId === milestoneId
            );
          });
          
          if (relevantSubmissions.length > 0) {
            console.log(`Using ${relevantSubmissions.length} submissions from team data as error fallback`);
            return {
              submissions: relevantSubmissions,
              fetchTime: new Date().toISOString(),
              error: err.message,
              fromErrorFallback: true,
              source: 'team_data_fallback'
            };
          }
        }
        */
        
        // Return empty submissions array since we can't get data
        return {
          submissions: [],
          fetchTime: new Date().toISOString(),
          error: err.message,
          fromErrorFallback: true,
          source: 'empty_fallback'
        };
      }
    },
    staleTime: 120 * 1000, // 2 minutes - balance between freshness and performance
    cacheTime: 15 * 60 * 1000, // Keep cached data for 15 minutes even after unmounting
    enabled: !!teamId && !!milestoneId, // Only run query if both IDs are available
    retry: 2, // Reduce retry attempts to improve performance
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Shorter exponential backoff
    onError: (error) => {
      console.error('Submission query error:', error.message);
    }
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
      return data.cohorts || []
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
}