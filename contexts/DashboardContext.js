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

  // Track if data has been loaded once
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Fetch all dashboard data - only once per session
  useEffect(() => {
    async function fetchAllDashboardData() {
      if (!user || isUserLoading || initialDataLoaded) return
      
      try {
        // Load all data in parallel
        await Promise.all([
          fetchApplications(),
          fetchProfile(),
          fetchTeamData(),
          fetchProgramData()
        ])
        
        console.log("All dashboard data loaded successfully")
        setInitialDataLoaded(true)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load all dashboard data")
      }
    }
    
    fetchAllDashboardData()
  }, [user, isUserLoading, initialDataLoaded])

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
    let participationSuccess = false
    
    try {
      // First try the participation API
      try {
        // Check if the user has any participation records
        console.log('Fetching participation data from API...')
        
        // Check if the user object is available
        if (!user) {
          console.warn('User object not available when fetching participation')
        } else {
          console.log('User email:', user.email)
          console.log('User ID:', user.sub)
        }
        
        // Add a timestamp to avoid caching issues
        const timestamp = new Date().getTime()
        const participationResponse = await fetch(`/api/user/participation?_t=${timestamp}`)
        
        // Log response status and headers
        console.log(`Participation API response status: ${participationResponse.status}`)
        
        if (!participationResponse.ok) {
          console.error(`API returned error status: ${participationResponse.status}`)
          throw new Error(`Failed to fetch participation data: ${participationResponse.statusText}`)
        }
        
        console.log('Received successful response from participation API')
        const responseText = await participationResponse.text()
        console.log('Raw participation response (truncated):', 
                    responseText.length > 100 ? 
                    responseText.substring(0, 100) + '...' : 
                    responseText)
        
        let participationData
        try {
          // Safely parse the JSON
          participationData = JSON.parse(responseText)
          console.log('Participation data structure:', 
                      Object.keys(participationData).join(', '),
                      'items:', participationData.participation?.length || 0)
        } catch (e) {
          console.error('Failed to parse participation response as JSON:', e)
          console.error('Raw response:', responseText)
          throw new Error('Invalid response format from participation API')
        }
        
        if (!participationData.participation) {
          console.error('Missing participation field in response:', participationData)
          throw new Error('Invalid response structure from participation API')
        }
        
        // Only consider this a failure if no fallback available
        if (participationData.participation.length === 0) {
          console.log('Participation array is empty')
          // Not throwing - will try team fallback
        } else {
          console.log(`Found ${participationData.participation.length} participation records`);
          
          // Log each participation record for debugging
          participationData.participation.forEach((record, index) => {
            console.log(`Participation record #${index + 1}:`, 
                        'cohort:', record.cohort?.id || 'none', 
                        'name:', record.cohort?.name || 'none',
                        'current:', record.cohort?.['Current Cohort'] || false);
          });
          
          // Filter for current participation records using the "Current Cohort" field
          // Be more flexible - accept true string or boolean true
          const currentParticipations = participationData.participation.filter(p => {
            const isCurrent = p.cohort?.['Current Cohort'] === true || 
                             p.cohort?.['Current Cohort'] === 'true' ||
                             p.cohort?.['Is Current'] === true ||
                             p.cohort?.['Is Current'] === 'true';
                             
            // Log the decision for this record
            if (p.cohort) {
              console.log(`Evaluation for ${p.cohort.name || 'unknown cohort'}:`, 
                         `Current Cohort value: ${p.cohort['Current Cohort']}`,
                         `type: ${typeof p.cohort['Current Cohort']}`,
                         `included: ${isCurrent}`);
            }
            
            return isCurrent;
          });
          
          console.log(`Found ${currentParticipations.length} CURRENT participation records`);
          
          if (currentParticipations.length > 0) {
            // Use the first current participation record
            const activeParticipation = currentParticipations[0];
            console.log('Active participation:', activeParticipation);
            
            setCohort(activeParticipation.cohort);
            
            // Set initiative name and participation type
            if (activeParticipation.cohort?.initiativeDetails) {
              setInitiativeName(activeParticipation.cohort.initiativeDetails.name || "Program")
              setParticipationType(activeParticipation.cohort.initiativeDetails["Participation Type"] || "Individual")
            }
            
            // Get start and end dates if available
            const startDate = activeParticipation.cohort?.['Start Date'] 
              ? new Date(activeParticipation.cohort['Start Date']) 
              : null;
              
            const endDate = activeParticipation.cohort?.['End Date'] 
              ? new Date(activeParticipation.cohort['End Date']) 
              : null;
              
            console.log(`Cohort dates: ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`);
            
            // Get milestones for this cohort
            if (activeParticipation.cohort?.id) {
              const milestonesResponse = await fetch(`/api/cohorts/${activeParticipation.cohort.id}/milestones`)
              if (milestonesResponse.ok) {
                const milestonesData = await milestonesResponse.json()
                setMilestones(milestonesData.milestones || [])
              }
            }
            
            // Clear any previous errors - participation approach succeeded
            setProgramError(null)
            participationSuccess = true
          } else {
            // No current participation records found, try fallback approach
            console.log('No CURRENT participation records found');
            // We'll move to team fallback approach
          }
        }
      } catch (participationErr) {
        console.error('Participation approach failed:', participationErr)
        // Will try team fallback
      }
      
      // If participation approach didn't succeed, try team approach
      if (!participationSuccess) {
        console.log('Trying team-based fallback approach...')
        
        // Wait for team data to be available if not already
        if (isTeamLoading) {
          console.log('Waiting for team data to be loaded...')
          await new Promise(resolve => {
            const checkInterval = setInterval(() => {
              if (!isTeamLoading) {
                clearInterval(checkInterval)
                resolve()
              }
            }, 100)
          })
        }
        
        if (teamsData.length > 0) {
          console.log('Team data available, using for fallback')
          const team = teamsData[0]
          console.log('Team:', team)
          
          if (team && team.id) {
            try {
              console.log(`Fetching cohorts for team ${team.id}...`)
              const cohortResponse = await fetch(`/api/teams/${team.id}/cohorts`)
              
              if (cohortResponse.ok) {
                const cohortData = await cohortResponse.json()
                console.log(`Fetched cohorts for team ${team.name}:`, cohortData)
                
                if (cohortData.cohorts && cohortData.cohorts.length > 0) {
                  console.log(`Found ${cohortData.cohorts.length} cohorts for team`);
                  
                  // Log each cohort for debugging
                  cohortData.cohorts.forEach((cohort, index) => {
                    console.log(`Cohort #${index + 1}:`, 
                                'id:', cohort.id || 'none', 
                                'name:', cohort.name || 'none',
                                'current:', cohort['Current Cohort'] || false,
                                'type:', typeof cohort['Current Cohort']);
                  });
                  
                  // Filter for current cohorts using the "Current Cohort" field
                  // Be more flexible - accept true string or boolean true
                  const currentCohorts = cohortData.cohorts.filter(cohort => {
                    const isCurrent = cohort['Current Cohort'] === true || 
                                    cohort['Current Cohort'] === 'true' ||
                                    cohort['Is Current'] === true ||
                                    cohort['Is Current'] === 'true';
                                    
                    console.log(`Evaluation for ${cohort.name || 'unknown cohort'}:`, 
                               `Current Cohort value: ${cohort['Current Cohort']}`,
                               `type: ${typeof cohort['Current Cohort']}`,
                               `included: ${isCurrent}`);
                                    
                    return isCurrent;
                  });
                  
                  console.log(`Found ${currentCohorts.length} CURRENT cohorts for team`);
                  
                  // Use a current cohort if available, otherwise fall back to first cohort
                  const activeCohort = currentCohorts.length > 0 ? currentCohorts[0] : cohortData.cohorts[0];
                  
                  // Log whether using current or fallback cohort
                  if (currentCohorts.length > 0) {
                    console.log('Using current active cohort:', activeCohort.name);
                  } else {
                    console.log('No current cohorts found, using first cohort as fallback:', activeCohort.name);
                  }
                  
                  setCohort(activeCohort)
                  console.log('Set cohort:', activeCohort)
                  
                  // Set team data for rendering
                  if (team && !teamData) {
                    setTeamData(team)
                  }
                  
                  // Set initiative details if available
                  const initiativeName = activeCohort.initiativeDetails?.name || 
                                        activeCohort.details?.initiativeName || 
                                        activeCohort.name || 
                                        "Program"
                  setInitiativeName(initiativeName)
                  
                  // Get participation type
                  const partType = activeCohort.initiativeDetails?.["Participation Type"] || 
                                   activeCohort.details?.participationType || 
                                   (team ? "Team" : "Individual")
                  setParticipationType(partType)
                  
                  // Get milestones if possible
                  if (activeCohort.id) {
                    console.log(`Fetching milestones for cohort ${activeCohort.id}...`)
                    try {
                      const milestonesResponse = await fetch(`/api/cohorts/${activeCohort.id}/milestones`)
                      if (milestonesResponse.ok) {
                        const milestonesData = await milestonesResponse.json()
                        setMilestones(milestonesData.milestones || [])
                        console.log('Set milestones:', milestonesData.milestones)
                      } else {
                        console.log(`No milestones response for cohort ${activeCohort.id}`)
                        // Use empty milestones but don't consider this a failure
                        setMilestones([])
                      }
                    } catch (milestonesError) {
                      console.error('Error fetching milestones:', milestonesError)
                      // Use empty milestones but don't consider this a failure
                      setMilestones([])
                    }
                  }
                  
                  // Team approach succeeded
                  setProgramError(null)
                  participationSuccess = true
                  console.log('Successfully configured program dashboard from team data')
                } else {
                  console.log('No cohorts found for team')
                }
              } else {
                console.error(`Failed to fetch cohorts for team: ${cohortResponse.status}`)
              }
            } catch (teamFallbackErr) {
              console.error('Team fallback approach failed:', teamFallbackErr)
            }
          }
        } else {
          console.log('No teams available for fallback approach')
        }
      }
      
      // If neither approach succeeded, set the error
      if (!participationSuccess) {
        setProgramError('You are not currently participating in any program')
      }
    } catch (err) {
      console.error('Error in program data fetching:', err)
      setProgramError(err.message || 'Failed to load program information')
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