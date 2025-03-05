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
 * This implementation reliably fetches submissions related to milestones for the current team
 * using exact field names from AIRTABLE_SCHEMA.md
 */
export function useTeamSubmissions(teamId, milestoneId) {
  const queryClient = useQueryClient();
  
  console.log(`Setting up useTeamSubmissions hook for teamId=${teamId}, milestoneId=${milestoneId}`);

  // Return a pre-configured query that leverages cached data with a more reliable approach
  return useQuery({
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async () => {
      console.log(`📋 useTeamSubmissions queryFn execution: teamId=${teamId}, milestoneId=${milestoneId}`);
      
      // Detailed tracking for debugging
      const trace = {
        steps: [],
        addStep: function(name, result) {
          this.steps.push({ name, result, timestamp: new Date().toISOString() });
          console.log(`📋 [Step ${this.steps.length}] ${name}: ${result}`);
        }
      };
      
      // Skip if missing required IDs
      if (!teamId) {
        trace.addStep("Check teamId", "Missing teamId - returning empty submissions array");
        return { submissions: [], _trace: trace.steps };
      }
      
      // milestoneId is optional - we can fetch all submissions for a team if not provided
      
      // Get team data from cache first (this avoids unnecessary API calls)
      const teamData = queryClient.getQueryData(['teams'])?.find(team => team.id === teamId);
      
      if (!teamData) {
        trace.addStep("Check cache for team data", "Not found");
        
        // Since we don't have team data in cache, go directly to API
        try {
          trace.addStep("Fallback to API", "Making direct API call");
          const response = await fetch(`/api/teams/${teamId}/submissions${milestoneId ? `?milestoneId=${milestoneId}` : ''}`);
          
          if (response.ok) {
            const data = await response.json();
            trace.addStep("API response", `Received ${data.submissions?.length || 0} submissions`);
            // Include trace data for debugging
            return { ...data, _trace: trace.steps };
          } else {
            trace.addStep("API response", `Error: ${response.status}`);
          }
        } catch (error) {
          trace.addStep("API call error", error.message);
        }
        
        return { submissions: [], _trace: trace.steps };
      }
      
      trace.addStep("Team data in cache", `Found: ${teamData.name || 'Unnamed Team'}`);
      
      // ---- APPROACH 1: Direct access to team's Submissions field ----
      // According to AIRTABLE_SCHEMA.md, Teams has a direct link to Submissions
      
      // First check the updated team structure for submissions
      if (teamData.submissions && Array.isArray(teamData.submissions) && teamData.submissions.length > 0) {
        trace.addStep("Check team submissions array", 
                     `Found ${teamData.submissions.length} direct submission IDs in updated structure`);
        
        // Get team submissions directly from API with details
        try {
          // Make a direct API call to get all submissions for this team
          trace.addStep("API call preparation", `Calling /api/teams/${teamId}/submissions`);
          
          const response = await fetch(`/api/teams/${teamId}/submissions`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.submissions && data.submissions.length > 0) {
              trace.addStep("API call result", `Found ${data.submissions.length} team submissions`);
              // Include trace data for debugging
              return { ...data, _trace: trace.steps };
            } else {
              trace.addStep("API call result", "No submissions found for this team");
            }
          } else {
            trace.addStep("API call result", `Error: ${response.status}`);
          }
        } catch (error) {
          trace.addStep("API call error", error.message);
        }
        
        // Fallback: Format submissions to expected structure and return all of them
        trace.addStep("Fallback approach", "Formatting submission IDs from team.submissions");
        
        const submissions = teamData.submissions
          .filter(submissionId => submissionId)
          .map(submissionId => ({
            id: submissionId,
            teamId: teamId,
            createdTime: new Date().toISOString(),
          }));
        
        trace.addStep("Format team submissions", `Formatted ${submissions.length} submissions`);
        
        if (submissions.length > 0) {
          return { submissions, _trace: trace.steps };
        }
      } 
      // Legacy fallback - check original fields structure
      else if (teamData.fields?.Submissions && Array.isArray(teamData.fields.Submissions)) {
        trace.addStep("Check team fields.Submissions", 
                     `Found ${teamData.fields.Submissions.length} direct submission IDs in legacy structure`);
        
        // Get team submissions directly - not filtering by milestone as directed
        try {
          // Make a direct API call to get all submissions for this team
          trace.addStep("API call preparation", `Calling /api/teams/${teamId}/submissions`);
          
          const response = await fetch(`/api/teams/${teamId}/submissions`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.submissions && data.submissions.length > 0) {
              trace.addStep("API call result", `Found ${data.submissions.length} team submissions`);
              // Include trace data for debugging
              return { ...data, _trace: trace.steps };
            } else {
              trace.addStep("API call result", "No submissions found for this team");
            }
          } else {
            trace.addStep("API call result", `Error: ${response.status}`);
          }
        } catch (error) {
          trace.addStep("API call error", error.message);
          // Continue with fallback approach
        }
        
        // Fallback: Format submissions to expected structure and return all of them
        trace.addStep("Fallback approach", "Formatting submission IDs from fields.Submissions");
        
        const submissions = teamData.fields.Submissions
          .filter(submissionId => submissionId)
          .map(submissionId => ({
            id: submissionId,
            teamId: teamId,
            createdTime: new Date().toISOString(),
          }));
        
        trace.addStep("Format team submissions", `Formatted ${submissions.length} submissions`);
        
        if (submissions.length > 0) {
          return { submissions, _trace: trace.steps };
        }
      } else {
        trace.addStep("Check team Submissions field", "Not found in any team data structure");
      }
      
      // ---- APPROACH 2: Look through the members' submissions field ----
      // Per schema, check if team members have submissions we can use
      const memberSubmissions = [];
      
      if (teamData.members && Array.isArray(teamData.members)) {
        trace.addStep("Check team members", `Found ${teamData.members.length} team members`);
        
        for (const member of teamData.members) {
          if (member.submissions && Array.isArray(member.submissions)) {
            trace.addStep("Member submission check", 
                         `Member ${member.name || member.id} has ${member.submissions.length} submissions`);
            
            member.submissions.forEach(submissionId => {
              if (!memberSubmissions.includes(submissionId)) {
                memberSubmissions.push(submissionId);
              }
            });
          }
        }
        
        if (memberSubmissions.length > 0) {
          trace.addStep("Member submissions collected", 
                       `Found ${memberSubmissions.length} unique submission IDs`);
          
          // Format member submissions in the same way as team submissions
          const submissions = memberSubmissions.map(submissionId => ({
            id: submissionId,
            teamId: teamId,
            milestoneId: milestoneId || null, 
            createdTime: new Date().toISOString(),
          }));
          
          return { submissions, _trace: trace.steps };
        } else {
          trace.addStep("Member submissions check", "No submissions found from team members");
        }
      } else {
        trace.addStep("Team members check", "No members found in team data");
      }
      
      // ---- APPROACH 3: Direct API call as a final fallback ----
      trace.addStep("Fallback", "Making direct API call as final attempt");
      
      try {
        const response = await fetch(`/api/teams/${teamId}/submissions${milestoneId ? `?milestoneId=${milestoneId}` : ''}`);
        
        if (response.ok) {
          const data = await response.json();
          trace.addStep("Final API call", `Received ${data.submissions?.length || 0} submissions`);
          // Include trace data for debugging
          return { ...data, _trace: trace.steps };
        } else {
          trace.addStep("Final API call", `Error: ${response.status}`);
        }
      } catch (error) {
        trace.addStep("Final API call error", error.message);
      }
      
      // If all else fails, return empty array
      trace.addStep("Conclusion", "No submissions found through any method");
      return { submissions: [], _trace: trace.steps };
    },
    // Keep cache for longer periods since we're not making external API calls
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000,  // 30 minutes
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