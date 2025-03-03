"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { toast } from "sonner"

// Create context
const DashboardContext = createContext(null)

// Context provider component
export function DashboardProvider({ children }) {
  const { user, isLoading: isUserLoading } = useUser()
  
  // Shared state
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamLoading, setIsTeamLoading] = useState(true)
  const [teamsData, setTeamsData] = useState([])
  const [applications, setApplications] = useState([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [error, setError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Program dashboard state
  const [cohort, setCohort] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [initiativeName, setInitiativeName] = useState("Program")
  const [participationType, setParticipationType] = useState(null)
  const [programLoading, setProgramLoading] = useState(true)
  const [programError, setProgramError] = useState(null)

  // Fetch all dashboard data
  useEffect(() => {
    async function fetchAllDashboardData() {
      if (!user || isUserLoading) return
      
      try {
        // Load all data in parallel
        await Promise.all([
          fetchApplications(),
          fetchProfile(),
          fetchTeamData(),
          fetchProgramData()
        ])
        
        console.log("All dashboard data loaded successfully")
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load all dashboard data")
      }
    }
    
    fetchAllDashboardData()
  }, [user, isUserLoading])

  // Fetch user profile
  async function fetchProfile() {
    try {
      const response = await fetch("/api/user/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err.message)
      toast.error("Failed to load your profile")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch team data
  async function fetchTeamData() {
    try {
      // Fetch multiple teams
      const teamsResponse = await fetch("/api/teams")
      if (!teamsResponse.ok) {
        throw new Error("Failed to fetch teams data")
      }
      
      const teamsData = await teamsResponse.json()
      
      // For backward compatibility, also set the first team to teamData
      if (teamsData.teams && teamsData.teams.length > 0) {
        setTeamData(teamsData.teams[0])
        setTeamsData(teamsData.teams)
      } else {
        setTeamData(null)
        setTeamsData([])
      }
      
      console.log("Teams data loaded:", teamsData)
    } catch (err) {
      console.error("Error fetching team data:", err)
      toast.error("Failed to load team information")
    } finally {
      setIsTeamLoading(false)
    }
  }

  // Fetch applications
  async function fetchApplications() {
    try {
      console.log('Fetching user applications...');
      setIsLoadingApplications(true);
      
      const response = await fetch('/api/user/check-application');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Applications data from API:', data);
      
      if (data && Array.isArray(data.applications)) {
        const apps = data.applications;
        console.log(`Found ${apps.length} applications for user`);
        setApplications(apps);
      } else {
        console.warn('No applications array in response');
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  }

  // Fetch program dashboard data
  async function fetchProgramData() {
    setProgramLoading(true)
    try {
      // First check if the user has any participation records
      console.log('Fetching participation data from API...')
      const participationResponse = await fetch('/api/user/participation')
      
      if (!participationResponse.ok) {
        console.error(`API returned error status: ${participationResponse.status}`)
        throw new Error('Failed to fetch participation data')
      }
      
      console.log('Received successful response from participation API')
      const responseText = await participationResponse.text()
      
      let participationData
      try {
        // Safely parse the JSON
        participationData = JSON.parse(responseText)
        console.log('Parsed participation data:', participationData)
      } catch (e) {
        console.error('Failed to parse participation response as JSON:', e)
        console.error('Raw response:', responseText)
        throw new Error('Invalid response format from participation API')
      }
      
      if (!participationData.participation) {
        console.error('Missing participation field in response:', participationData)
        throw new Error('Invalid response structure from participation API')
      }
      
      if (participationData.participation.length === 0) {
        console.log('Participation array is empty')
        // This is now handled as a normal case, not an error situation
        setProgramError('You are not currently participating in any program')
        return // Exit early but don't throw an error
      }
      
      // Get the active participation (the first one for now)
      const activeParticipation = participationData.participation[0]
      setCohort(activeParticipation.cohort)
      
      // Set initiative name and participation type
      if (activeParticipation.cohort?.initiativeDetails) {
        setInitiativeName(activeParticipation.cohort.initiativeDetails.name || "Program")
        setParticipationType(activeParticipation.cohort.initiativeDetails["Participation Type"] || "Individual")
      }
      
      // Get milestones for this cohort
      if (activeParticipation.cohort?.id) {
        const milestonesResponse = await fetch(`/api/cohorts/${activeParticipation.cohort.id}/milestones`)
        if (milestonesResponse.ok) {
          const milestonesData = await milestonesResponse.json()
          setMilestones(milestonesData.milestones || [])
        }
      }

      // Clear any previous errors
      setProgramError(null)
    } catch (err) {
      console.error('Error fetching active participation:', err)
      setProgramError(err.message || 'Failed to load program information')
      
      // Try fallback approach with team data if available
      if (teamsData.length > 0) {
        try {
          const team = teamsData[0]
          if (team.cohortIds && team.cohortIds.length > 0) {
            const cohortResponse = await fetch(`/api/teams/${team.id}/cohorts`)
            if (cohortResponse.ok) {
              const cohortData = await cohortResponse.json()
              if (cohortData.cohorts && cohortData.cohorts.length > 0) {
                setCohort(cohortData.cohorts[0])
                
                if (cohortData.cohorts[0].initiativeDetails?.name) {
                  setInitiativeName(cohortData.cohorts[0].initiativeDetails.name)
                }
                
                if (cohortData.cohorts[0].id) {
                  const milestonesResponse = await fetch(`/api/cohorts/${cohortData.cohorts[0].id}/milestones`)
                  if (milestonesResponse.ok) {
                    const milestonesData = await milestonesResponse.json()
                    setMilestones(milestonesData.milestones || [])
                  }
                }
                
                // If fallback worked, clear error
                setProgramError(null)
              }
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback approach failed:', fallbackErr)
        }
      }
    } finally {
      setProgramLoading(false)
    }
  }

  // Handle profile update
  async function handleProfileUpdate(updatedData) {
    try {
      setIsUpdating(true);
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast.success("Profile updated successfully");
      return updatedProfile;
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle refreshing specific data
  async function refreshData(dataType) {
    switch(dataType) {
      case 'profile':
        await fetchProfile();
        break;
      case 'teams':
        await fetchTeamData();
        break;
      case 'applications':
        await fetchApplications();
        break;
      case 'program':
        await fetchProgramData();
        break;
      case 'all':
        await Promise.all([
          fetchProfile(),
          fetchTeamData(),
          fetchApplications(),
          fetchProgramData()
        ]);
        break;
      default:
        console.error('Unknown data type:', dataType);
    }
  }

  // Create context value
  const value = {
    // User & profile data
    user,
    profile,
    isLoading: isLoading || isUserLoading,
    error,
    
    // Team data
    teamData,
    teamsData,
    isTeamLoading,
    
    // Application data
    applications,
    isLoadingApplications,
    
    // Program data
    cohort,
    milestones,
    initiativeName,
    participationType,
    programLoading,
    programError,
    
    // UI state
    isEditModalOpen,
    setIsEditModalOpen,
    isUpdating,
    
    // Actions
    refreshData,
    handleProfileUpdate,
    
    // Helper methods for navigation
    hasProgramData: Boolean(cohort) || Boolean(teamData?.cohortIds?.length)
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === null) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}