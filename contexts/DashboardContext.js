"use client"

import { createContext, useContext, useState, useMemo } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useQueryClient } from '@tanstack/react-query'
import { 
  useProfileData, 
  useTeamsData, 
  useApplicationsData, 
  useProgramData, 
  useMilestoneData,
  updateProfileData,
  updateTeamData,
  inviteTeamMember,
  invalidateAllData
} from '@/lib/useDataFetching'

/**
 * Generates fallback milestones if none are fetched from API
 * @param {string} programName - Name of the program/cohort
 * @returns {Array} Array of milestone objects
 */
function generateFallbackMilestones(programName) {
  // Return empty array instead of generating fallback milestones
  console.log("No real milestone data available, returning empty array instead of fallbacks");
  return [];
  
  /* Disabling fallback milestone generation to prevent API confusion
  const now = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(now.getMonth() - 1)
  
  const oneMonthLater = new Date()
  oneMonthLater.setMonth(now.getMonth() + 1)
  
  const twoMonthsLater = new Date()
  twoMonthsLater.setMonth(now.getMonth() + 2)
  
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(now.getMonth() + 3)
  
  return [
    {
      id: "fallback-milestone-1",
      name: `${programName} Kickoff`,
      number: 1,
      dueDate: oneMonthAgo.toISOString(),
      description: "Getting started and forming your team",
      status: "completed",
      progress: 100,
      completedDate: oneMonthAgo.toISOString(),
      score: 95
    },
    {
      id: "fallback-milestone-2",
      name: "Project Definition",
      number: 2,
      dueDate: now.toISOString(),
      description: "Define your project scope and goals",
      status: "upcoming",
      completedDate: null,
      score: null
    },
    {
      id: "fallback-milestone-3",
      name: "Initial Prototype",
      number: 3,
      dueDate: oneMonthLater.toISOString(),
      description: "Develop your first working prototype",
      status: "upcoming",
      progress: 0,
      completedDate: null,
      score: null
    },
    {
      id: "fallback-milestone-4",
      name: "User Testing",
      number: 4,
      dueDate: twoMonthsLater.toISOString(),
      description: "Test your prototype with real users",
      status: "upcoming",
      progress: 0,
      completedDate: null,
      score: null
    },
    {
      id: "fallback-milestone-5",
      name: "Final Presentation",
      number: 5,
      dueDate: threeMonthsLater.toISOString(),
      description: "Present your finished project",
      status: "upcoming",
      progress: 0,
      completedDate: null,
      score: null
    }
  ]
  */
}

// Create context
const DashboardContext = createContext(null)

// Context provider component
export function DashboardProvider({ children }) {
  const { user, isLoading: isUserLoading } = useUser()
  const queryClient = useQueryClient()
  
  // UI state management
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Track active program ID - defined early to avoid initialization error
  const [activeProgramId, setActiveProgramId] = useState(null)
  
  // Store active team for each program - defined early to avoid initialization errors
  const [programTeams, setProgramTeams] = useState({})
  
  // Use React Query hooks for data fetching
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useProfileData()
  
  const { 
    data: teams, 
    isLoading: isTeamsLoading, 
    error: teamsError 
  } = useTeamsData()
  
  const { 
    data: applications, 
    isLoading: isApplicationsLoading 
  } = useApplicationsData()
  
  const {
    data: participationData,
    isLoading: isProgramLoading,
    error: programError
  } = useProgramData()
  
  // Process teams data
  const teamData = useMemo(() => {
    return teams && teams.length > 0 ? teams[0] : null
  }, [teams])
  
  // Process program data
  const programDataProcessed = useMemo(() => {
    console.log("Processing participation data:", {
      hasData: !!participationData,
      recordCount: participationData?.participation?.length || 0
    });
    
    if (!participationData?.participation || participationData.participation.length === 0) {
      console.log("No participation records found, using default program data");
      return {
        cohort: null,
        initiativeName: "Program",
        participationType: null
      }
    }
    
    // Find current participation from participation data
    const currentParticipations = participationData.participation.filter(p => {
      if (!p.cohort) return false
      
      const isCurrent = p.cohort['Current Cohort'] === true || 
                        String(p.cohort['Current Cohort']).toLowerCase() === 'true' ||
                        p.cohort['Is Current'] === true ||
                        String(p.cohort['Is Current']).toLowerCase() === 'true'
                        
      return isCurrent
    })
    
    const activeParticipation = currentParticipations.length > 0 
      ? currentParticipations[0] 
      : participationData.participation[0]
    
    if (!activeParticipation?.cohort) {
      return {
        cohort: null,
        initiativeName: "Program",
        participationType: null
      }
    }
    
    return {
      cohort: activeParticipation.cohort,
      initiativeName: activeParticipation.cohort.initiativeDetails?.name || "Program",
      participationType: activeParticipation.cohort.initiativeDetails?.["Participation Type"] || "Individual"
    }
  }, [participationData])
  
  // Fetch milestones data using the cohort ID
  // Add enhanced logging to debug milestone fetching
  const cohortId = programDataProcessed.cohort?.id;
  
  // Provide more context in the log about where the cohortId comes from
  if (cohortId) {
    console.log(`Using cohortId for milestone fetching: ${cohortId} from ${programDataProcessed.cohort?.name || 'unknown cohort'}`);
  } else {
    console.log(`No cohortId available for milestone fetching. Using programDataProcessed: ${JSON.stringify({
      hasCohort: !!programDataProcessed.cohort,
      initiativeName: programDataProcessed.initiativeName,
      participationType: programDataProcessed.participationType
    })}`);
  }
  
  const { 
    data: milestonesData,
    isLoading: isMilestonesLoading 
  } = useMilestoneData(cohortId)
  
  
  // Function to get program cohort IDs - Define the function before using it
  const getProgramCohortIds = useMemo(() => {
    return (programId) => {
      // Use participationData directly without requiring a userProfile parameter  
      const participations = participationData?.participation || [];
      if (!participations.length) return [];
      
      // Get all cohort IDs related to this program initiative directly from participations
      return participations
        .filter(p => p.cohort?.initiativeDetails?.id === programId)
        .map(p => p.cohort?.id)
        .filter(Boolean);
    };
  }, [participationData]);

  // Process milestones data with fallbacks and filtering by active program
  const milestones = useMemo(() => {
    // Get all milestones from the API response
    const allMilestones = milestonesData?.milestones && milestonesData.milestones.length > 0
      ? milestonesData.milestones
      : programDataProcessed.cohort 
        ? generateFallbackMilestones(programDataProcessed.cohort.name || "Program")
        : [];
    
    console.log(`Found ${allMilestones.length} milestones for cohort ${cohortId}`);
    
    // Since we're already fetching milestones for the specific cohort,
    // we can just use them directly instead of filtering further
    
    // Only proceed with prefetching if we have both team and milestones
    if (teamData?.id && allMilestones.length > 0) {
      console.log(`Starting background prefetch for ${allMilestones.length} milestones`);
      
      // Prefetch submissions for milestones in the background
      // Using setTimeout to avoid blocking the UI rendering
      setTimeout(() => {
        // Single log message instead of one per milestone
        const milestoneIds = allMilestones
          .filter(m => m.id)
          .map(m => m.id)
          .slice(0, 3); // Only show first 3 in log
          
        console.log(`Prefetching milestones: ${milestoneIds.length > 3 ? 
          `${milestoneIds.join(', ')}... and ${allMilestones.length - 3} more` : 
          milestoneIds.join(', ')}`);
        
        // Process milestones in batches to reduce network congestion
        const processMilestones = (milestones, batchSize = 2) => {
          const batch = milestones.slice(0, batchSize);
          const remaining = milestones.slice(batchSize);
          
          // Process current batch
          batch.forEach(milestone => {
            if (milestone.id) {
              queryClient.prefetchQuery({
                queryKey: ['submissions', teamData.id, milestone.id],
                queryFn: async () => {
                  const url = `/api/teams/${teamData.id}/submissions?milestoneId=${encodeURIComponent(milestone.id)}&_t=${new Date().getTime()}`;
                  
                  try {
                    const response = await fetch(url);
                    if (!response.ok) {
                      return { submissions: [] };
                    }
                    
                    const data = await response.json();
                    return { submissions: data.submissions || [] };
                  } catch (err) {
                    return { submissions: [] };
                  }
                },
                staleTime: 60 * 1000 // 1 minute
              });
            }
          });
          
          // Process next batch if any
          if (remaining.length > 0) {
            setTimeout(() => processMilestones(remaining, batchSize), 500);
          }
        };
        
        // Start processing in batches
        processMilestones(allMilestones.filter(m => m.id));
      }, 1000); // Delay initial prefetching to let initial render complete
    }
    
    return allMilestones;
  }, [milestonesData, programDataProcessed.cohort, teamData?.id, queryClient, activeProgramId, profile, getProgramCohortIds])
  
  // Combine loading states
  const isLoading = isUserLoading || isProfileLoading
  const isTeamLoading = isTeamsLoading
  const programLoading = isProgramLoading || isMilestonesLoading
  
  // Combine error states
  const error = profileError || teamsError
  
  // Handle profile update with caching
  async function handleProfileUpdate(updatedData) {
    setIsUpdating(true)
    try {
      const updatedProfile = await updateProfileData(updatedData, queryClient)
      setIsUpdating(false)
      return updatedProfile
    } catch (err) {
      setIsUpdating(false)
      throw err
    }
  }
  
  // Handle refreshing specific data
  function refreshData(dataType) {
    switch(dataType) {
      case 'profile':
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        break
      case 'teams':
        queryClient.invalidateQueries({ queryKey: ['teams'] })
        break
      case 'applications':
        queryClient.invalidateQueries({ queryKey: ['applications'] })
        break
      case 'program':
        queryClient.invalidateQueries({ queryKey: ['participation'] })
        queryClient.invalidateQueries({ queryKey: ['milestones'] })
        break
      case 'all':
        invalidateAllData(queryClient)
        break
      default:
        console.error('Unknown data type:', dataType)
    }
  }
  
  // Enhance profile with participations data and add useful derived properties
  // Simplified implementation with less redundancy and standardized checks
  const enhancedProfile = useMemo(() => {
    if (!profile) return null;
    
    // Get participations data - these are already filtered for active records at the API level
    const participations = participationData?.participation || [];
    console.log(`Enhancing profile with ${participations.length} participation records`);
    
    // Helper function to normalize and check participation type consistently
    // This centralizes the logic for determining team-based participation
    const isTeamBasedParticipation = (participationType) => {
      if (!participationType) return false;
      
      const normalizedType = String(participationType).trim().toLowerCase();
      return normalizedType === "team" || 
             normalizedType.includes("team") ||
             normalizedType === "teams" ||
             normalizedType === "group" ||
             normalizedType.includes("group") ||
             normalizedType === "collaborative" ||
             normalizedType.includes("collaborative");
    };
    
    // Get participation type from a participation record consistently
    const getParticipationType = (p) => {
      return p.cohort?.participationType || 
             p.cohort?.initiativeDetails?.["Participation Type"] || 
             "Individual";
    };
    
    // Create a mapping of cohort IDs to participation records for easy lookup
    const participationByCohortId = {};
    // Create a mapping of initiative IDs to participation records
    const participationByInitiativeId = {};
    
    // Build lookup maps in a single pass
    participations.forEach(p => {
      // Map by cohort ID
      if (p.cohort && p.cohort.id) {
        participationByCohortId[p.cohort.id] = p;
      }
      
      // Map by initiative ID if available
      if (p.cohort?.initiativeDetails?.id) {
        const initiativeId = p.cohort.initiativeDetails.id;
        if (!participationByInitiativeId[initiativeId]) {
          participationByInitiativeId[initiativeId] = [];
        }
        participationByInitiativeId[initiativeId].push(p);
      }
    });
    
    // Calculate derived properties efficiently:
    
    // 1. Team-based participation - calculated once
    const teamParticipations = participations.filter(p => 
      isTeamBasedParticipation(getParticipationType(p))
    );
    
    // Add derived property: hasActiveTeamParticipation
    const hasActiveTeamParticipation = teamParticipations.length > 0;
    
    // Add derived property: hasActiveParticipation - simple check since we already filter at API level
    const hasActiveParticipation = participations.length > 0;
    
    // Create optimized lookup functions
    
    // Lookup participation by cohort ID
    const findParticipationByCohortId = (cohortId) => {
      return participationByCohortId[cohortId] || null;
    };
    
    // Lookup participations by initiative ID
    const findParticipationsByInitiativeId = (initiativeId) => {
      return participationByInitiativeId[initiativeId] || [];
    };
    
    // Get all active participation initiatives in a structured format
    const getActiveParticipationInitiatives = () => {
      // Use a Set to avoid duplicate initiatives
      const initiatives = new Set();
      const result = [];
      
      console.log("Getting active participation initiatives from", participations?.length || 0, "participations");
      
      participations.forEach(p => {
        console.log("Checking participation:", {
          cohortName: p.cohort?.name,
          initiativeId: p.cohort?.initiativeDetails?.id,
          initiativeName: p.cohort?.initiativeDetails?.name,
        });
        
        if (p.cohort?.initiativeDetails?.id) {
          const initiativeId = p.cohort.initiativeDetails.id;
          
          // Skip if we've already processed this initiative
          if (initiatives.has(initiativeId)) return;
          initiatives.add(initiativeId);
          
          result.push({
            id: initiativeId,
            name: p.cohort.initiativeDetails.name || "Unknown Initiative",
            participationType: getParticipationType(p),
            isTeamBased: isTeamBasedParticipation(getParticipationType(p)),
            teamId: p.teamId || null,
            cohortId: p.cohort.id
          });
        }
      });
      
      console.log("Found", result.length, "unique initiatives:", result);
      return result;
    };
    
    // Return the enhanced profile with participation data and optimized helpers
    return {
      ...profile,
      // Include participation data
      participations,
      // Include team-specific participation subset
      teamParticipations,
      // Add derived properties - calculated once for efficiency
      hasActiveTeamParticipation,
      hasActiveParticipation,
      // Add helper functions - reuse the normalized helpers
      isTeamBasedParticipation, // Expose the helper for components to use
      getParticipationType,     // Expose the helper for components to use
      // Add lookup functions
      findParticipationByCohortId,
      findParticipationsByInitiativeId,
      getActiveParticipationInitiatives,
      // Add direct access to lookup maps
      participationByCohortId
    };
  }, [profile, participationData]);
  
  // This function is a duplicate of the one defined earlier, removing it
  
  // Get all program initiatives - defined as early function to avoid circular dependencies
  const getAllProgramInitiatives = () => {
    // Get participations from participationData instead of profile
    if (!participationData?.participation) return [];
    
    // Use a Set to avoid duplicate initiatives
    const initiatives = new Set();
    const result = [];
    
    const participations = participationData.participation || [];
    console.log(`getAllProgramInitiatives: Found ${participations.length} participations`);
    
    participations.forEach(p => {
      if (p.cohort?.initiativeDetails?.id) {
        const initiativeId = p.cohort.initiativeDetails.id;
        
        // Skip if we've already processed this initiative
        if (initiatives.has(initiativeId)) return;
        initiatives.add(initiativeId);
        
        const participationType = p.cohort?.participationType || 
                               p.cohort?.initiativeDetails?.["Participation Type"] || 
                               "Individual";
        
        // Helper function to check if participation type is team-based
        const isTeamBased = (() => {
          if (!participationType) return false;
          
          const normalizedType = String(participationType).trim().toLowerCase();
          return normalizedType === "team" || 
                 normalizedType.includes("team") ||
                 normalizedType === "teams" ||
                 normalizedType === "group" ||
                 normalizedType.includes("group") ||
                 normalizedType === "collaborative" ||
                 normalizedType.includes("collaborative");
        })();
        
        result.push({
          id: initiativeId,
          name: p.cohort.initiativeDetails.name || "Unknown Initiative",
          participationType: participationType,
          isTeamBased: isTeamBased,
          teamId: p.teamId || null,
          cohortId: p.cohort.id
        });
      }
    });
    
    console.log(`getAllProgramInitiatives: Returning ${result.length} initiatives`, result);
    return result;
  };
  
  // Get teams for a specific program - defined early to avoid circular dependencies
  const getTeamsForProgram = (programId) => {
    if (!teams) return [];
    
    console.log(`Getting teams for program ${programId}`);
    
    // Get cohort IDs for this program directly from profile data to avoid circular dependency
    const programCohorts = getProgramCohortIds(programId);
    
    // Get teams for the specific program based on cohort
    const filteredTeams = teams.filter(team => {
      // If team has cohortIds array, check if it contains any cohort related to this program
      if (team.cohortIds && Array.isArray(team.cohortIds)) {
        // Check if any of the team's cohorts match the program cohorts
        const matchesCohort = team.cohortIds.some(cohortId => programCohorts.includes(cohortId));
        
        if (!matchesCohort && team.name) {
          console.log(`Excluding team ${team.name} (${team.id}) - cohorts don't match program`);
        }
        
        return matchesCohort;
      }
      
      // No cohortIds, can't match
      return false;
    });
    
    console.log(`Filtered teams for program ${programId}: ${filteredTeams.length} (of ${teams?.length || 0} total)`);
    return filteredTeams;
  };
  
  // Get active team for a program - defined early to avoid circular dependencies
  const getActiveTeamForProgram = (programId) => {
    // Try to get from state first
    if (programTeams[programId]) {
      return programTeams[programId];
    }
    
    // If not set in state, find a default team for this program
    const programTeamsList = getTeamsForProgram(programId);
    
    if (programTeamsList.length > 0) {
      // Set the first team as default and store it
      setProgramTeams(prev => ({
        ...prev,
        [programId]: programTeamsList[0].id
      }));
      return programTeamsList[0].id;
    }
    
    return null;
  };
  
  // Get the active program data
  const getActiveProgramData = (programId) => {
    if (!profile) return null;
    
    // Use our independently defined function instead of accessing through enhancedProfile
    const initiatives = getAllProgramInitiatives();
    
    // If no program ID specified, use the currently active one or the first available
    const activeId = programId || activeProgramId || (initiatives.length > 0 ? initiatives[0].id : null);
    
    if (!activeId) return programDataProcessed;
    
    // Find the active initiative
    const initiative = initiatives.find(init => init.id === activeId);
    if (!initiative) {
      console.log(`Initiative not found for program ID: ${activeId}`);
      return programDataProcessed;
    }
    
    // Find participation using participationData
    const participation = participationData?.participation?.find(p => 
      p.cohort?.initiativeDetails?.id === activeId
    );
    
    if (!participation) {
      console.log(`Participation not found for initiative ID: ${activeId}`);
      return programDataProcessed;
    }
    
    console.log(`Found participation for program ${activeId}:`, {
      cohortId: participation.cohort?.id,
      cohortName: participation.cohort?.name,
      initiativeName: initiative.name
    });
    
    // Get all available teams for this program
    const availableTeams = getTeamsForProgram(activeId);
    
    // Get the active team for this program (could be different from initiative.teamId)
    const teamId = getActiveTeamForProgram(activeId) || initiative.teamId;
    
    const userHasMultipleTeams = availableTeams.length > 1;
    
    // Find the actual team data for this program
    let teamData = availableTeams.find(team => team.id === teamId);
    
    // If no team found in available teams but we have a teamId, try to find it in all teams
    if (!teamData && teamId && teams) {
      teamData = teams.find(team => team.id === teamId);
      
      // If team is found in all teams but not in available teams, it might be from another cohort
      if (teamData) {
        console.log(`Team ${teamData.name} (${teamId}) found in all teams but not in available teams for this program.`);
      }
    }
    
    // Create the program data object with filtered info
    const programData = {
      programId: activeId,
      cohort: participation.cohort,
      initiativeName: initiative.name,
      participationType: initiative.participationType,
      isTeamBased: initiative.isTeamBased,
      teamId: teamId,
      teamData: teamData,
      userHasMultipleTeams: userHasMultipleTeams,
      availableTeams: availableTeams
    };
    
    console.log(`Program data for ${activeId}:`, {
      cohortId: programData.cohort?.id, 
      teamId: programData.teamId, 
      teamsCount: programData.availableTeams?.length
    });
    
    return programData;
  };
  
  // Set the active program - use useCallback to prevent recreation on each render
  const setActiveProgram = useMemo(() => {
    return (programId) => {
      console.log(`Setting active program: ${programId} (current: ${activeProgramId})`);
      // Only update state if it's actually changing
      if (programId !== activeProgramId) {
        setActiveProgramId(programId);
      }
    };
  }, [activeProgramId]);

  // Set active team for a program
  const setActiveTeamForProgram = (programId, teamId) => {
    setProgramTeams(prev => ({
      ...prev,
      [programId]: teamId
    }))
  }
  
  // Track data refresh timestamps
  const [lastUpdatedTimestamps, setLastUpdatedTimestamps] = useState({
    teams: null,
    milestones: null,
    submissions: null,
    profile: null,
    participations: null,
    applications: null,
  });
  
  // Update timestamps when data changes
  useEffect(() => {
    if (teams) {
      setLastUpdatedTimestamps(prev => ({ ...prev, teams: new Date().toISOString() }));
    }
  }, [teams]);
  
  useEffect(() => {
    if (milestones && milestones.length > 0) {
      setLastUpdatedTimestamps(prev => ({ ...prev, milestones: new Date().toISOString() }));
    }
  }, [milestones]);
  
  useEffect(() => {
    if (profile) {
      setLastUpdatedTimestamps(prev => ({ ...prev, profile: new Date().toISOString() }));
    }
  }, [profile]);
  
  useEffect(() => {
    if (participationData) {
      setLastUpdatedTimestamps(prev => ({ ...prev, participations: new Date().toISOString() }));
    }
  }, [participationData]);
  
  // Get the latest update timestamp across all data types
  const getLastUpdatedTimestamp = () => {
    const timestamps = Object.values(lastUpdatedTimestamps).filter(Boolean);
    if (timestamps.length === 0) return null;
    
    // Sort timestamps in descending order and get the most recent
    return timestamps.sort((a, b) => new Date(b) - new Date(a))[0];
  };
  
  // Enhanced refreshData function that updates timestamps
  const refreshDataWithTimestamps = (dataType) => {
    refreshData(dataType);
    
    // Update timestamp for the refreshed data type
    if (dataType && dataType !== 'all') {
      setLastUpdatedTimestamps(prev => ({ 
        ...prev, 
        [dataType]: new Date().toISOString() 
      }));
    } else if (dataType === 'all') {
      // Update all timestamps
      const now = new Date().toISOString();
      setLastUpdatedTimestamps({
        teams: now,
        milestones: now,
        submissions: now,
        profile: now,
        participations: now,
        applications: now,
      });
    }
  };

  // Create context value
  const value = {
    // User & profile data
    user,
    profile: enhancedProfile,
    isLoading,
    error,
    
    // Team data
    teamData,
    teamsData: teams || [],
    isTeamLoading,
    
    // Application data
    applications: applications || [],
    isLoadingApplications: isApplicationsLoading,
    
    // Program data
    cohort: programDataProcessed.cohort,
    milestones,
    initiativeName: programDataProcessed.initiativeName,
    participationType: programDataProcessed.participationType,
    programLoading,
    programError,
    
    // Raw API data - expose this for safer access in components
    participationData,
    
    // UI state
    isEditModalOpen,
    setIsEditModalOpen,
    isUpdating,
    
    // Actions
    refreshData: refreshDataWithTimestamps,
    handleProfileUpdate,
    
    // Helper methods for navigation
    hasProgramData: Boolean(programDataProcessed.cohort) || Boolean(teamData?.cohortIds?.length),
    
    // Multiple program management
    activeProgramId,
    setActiveProgram,
    getActiveProgramData,
    getAllProgramInitiatives,
    
    // Multiple teams per program support
    getTeamsForProgram,
    setActiveTeamForProgram,
    getActiveTeamForProgram,
    
    // Data freshness tracking
    lastUpdatedTimestamps,
    getLastUpdatedTimestamp
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