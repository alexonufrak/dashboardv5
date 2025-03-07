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
  
  // UI state management
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
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
  console.log(`Using cohortId for milestone fetching: ${cohortId}`);
  
  const { 
    data: milestonesData,
    isLoading: isMilestonesLoading 
  } = useMilestoneData(cohortId)
  
  // Process milestones data with fallbacks
  const milestones = useMemo(() => {
    const processedMilestones = milestonesData?.milestones && milestonesData.milestones.length > 0
      ? milestonesData.milestones
      : programDataProcessed.cohort 
        ? generateFallbackMilestones(programDataProcessed.cohort.name || "Program")
        : [];
    
    // Only proceed with prefetching if we have both team and milestones
    if (teamData?.id && processedMilestones.length > 0) {
      console.log(`Starting background prefetch for ${processedMilestones.length} milestones`);
      
      // Prefetch submissions for milestones in the background
      // Using setTimeout to avoid blocking the UI rendering
      setTimeout(() => {
        // Single log message instead of one per milestone
        const milestoneIds = processedMilestones
          .filter(m => m.id)
          .map(m => m.id)
          .slice(0, 3); // Only show first 3 in log
          
        console.log(`Prefetching milestones: ${milestoneIds.length > 3 ? 
          `${milestoneIds.join(', ')}... and ${processedMilestones.length - 3} more` : 
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
        processMilestones(processedMilestones.filter(m => m.id));
      }, 1000); // Delay initial prefetching to let initial render complete
    }
    
    return processedMilestones;
  }, [milestonesData, programDataProcessed.cohort, teamData?.id, queryClient])
  
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
      
      participations.forEach(p => {
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
    
    // UI state
    isEditModalOpen,
    setIsEditModalOpen,
    isUpdating,
    
    // Actions
    refreshData,
    handleProfileUpdate,
    
    // Helper methods for navigation
    hasProgramData: Boolean(programDataProcessed.cohort) || Boolean(teamData?.cohortIds?.length)
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