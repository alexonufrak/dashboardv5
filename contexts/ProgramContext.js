"use client"

import { createContext, useContext, useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useParticipation,
  useCohortMilestones,
  useUserApplications
} from "@/lib/airtable/hooks"
import { useUserContext } from "./UserContext"

// Helper function to generate fallback milestones if needed
function generateFallbackMilestones(programName) {
  // Return empty array instead of generating fallback milestones
  console.log("No real milestone data available, returning empty array instead of fallbacks")
  return []
}

/**
 * Context for program-related data and operations
 */
const ProgramContext = createContext(null)

/**
 * Provider component for program data and operations
 */
export function ProgramProvider({ children }) {
  const queryClient = useQueryClient()
  const { user, profile } = useUserContext()
  
  // Track active program ID
  const [activeProgramId, setActiveProgramId] = useState(null)
  
  // Fetch participation data using domain-specific hooks
  const {
    data: participationData,
    isLoading: isProgramLoading,
    error: programError,
    refetch: refetchParticipation
  } = useParticipation()
  
  // Fetch applications data
  const { 
    data: applications, 
    isLoading: isApplicationsLoading,
    refetch: refetchApplications
  } = useUserApplications()
  
  // Process program data from participation
  const programDataProcessed = useMemo(() => {
    if (!participationData?.participation || participationData.participation.length === 0) {
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
  const cohortId = programDataProcessed.cohort?.id
  
  const { 
    data: milestonesData,
    isLoading: isMilestonesLoading,
    refetch: refetchMilestones
  } = useCohortMilestones(cohortId)
  
  // Function to get program cohort IDs
  const getProgramCohortIds = useMemo(() => {
    return (programId) => {
      const participations = participationData?.participation || []
      if (!participations.length) return []
      
      // Get all cohort IDs related to this program initiative directly from participations
      return participations
        .filter(p => p.cohort?.initiativeDetails?.id === programId)
        .map(p => p.cohort?.id)
        .filter(Boolean)
    }
  }, [participationData])
  
  // Process milestones data
  const milestones = useMemo(() => {
    // Get all milestones from the API response
    const allMilestones = milestonesData?.milestones && milestonesData.milestones.length > 0
      ? milestonesData.milestones
      : programDataProcessed.cohort 
        ? generateFallbackMilestones(programDataProcessed.cohort.name || "Program")
        : []
    
    return allMilestones
  }, [milestonesData, programDataProcessed.cohort])
  
  // Get all program initiatives
  const getAllProgramInitiatives = () => {
    if (!participationData?.participation) return []
    
    // Use a Set to avoid duplicate initiatives
    const initiatives = new Set()
    const result = []
    
    const participations = participationData.participation || []
    
    participations.forEach(p => {
      if (p.cohort?.initiativeDetails?.id) {
        const initiativeId = p.cohort.initiativeDetails.id
        
        // Skip if we've already processed this initiative
        if (initiatives.has(initiativeId)) return
        initiatives.add(initiativeId)
        
        const participationType = p.cohort?.participationType || 
                               p.cohort?.initiativeDetails?.["Participation Type"] || 
                               "Individual"
        
        // Helper function to check if participation type is team-based
        const isTeamBased = (() => {
          if (!participationType) return false
          
          const normalizedType = String(participationType).trim().toLowerCase()
          return normalizedType === "team" || 
                 normalizedType.includes("team") ||
                 normalizedType === "teams" ||
                 normalizedType === "group" ||
                 normalizedType.includes("group") ||
                 normalizedType === "collaborative" ||
                 normalizedType.includes("collaborative")
        })()
        
        result.push({
          id: initiativeId,
          name: p.cohort.initiativeDetails.name || "Unknown Initiative",
          participationType: participationType,
          isTeamBased: isTeamBased,
          teamId: p.teamId || null,
          cohortId: p.cohort.id
        })
      }
    })
    
    return result
  }
  
  // Get active program data
  const getActiveProgramData = (programId) => {
    if (!profile) return null
    
    // Use our independently defined function
    const initiatives = getAllProgramInitiatives()
    
    // If no program ID specified, use the currently active one or the first available
    const activeId = programId || activeProgramId || (initiatives.length > 0 ? initiatives[0].id : null)
    
    if (!activeId) return programDataProcessed
    
    // Find the active initiative
    const initiative = initiatives.find(init => init.id === activeId)
    if (!initiative) {
      return programDataProcessed
    }
    
    // Find participation using participationData
    const participation = participationData?.participation?.find(p => 
      p.cohort?.initiativeDetails?.id === activeId
    )
    
    if (!participation) {
      return programDataProcessed
    }
    
    // Create the program data object
    return {
      programId: activeId,
      cohort: participation.cohort,
      initiativeName: initiative.name,
      participationType: initiative.participationType,
      isTeamBased: initiative.isTeamBased,
      teamId: initiative.teamId
    }
  }
  
  /**
   * Refresh program data
   */
  const refreshProgramData = () => {
    refetchParticipation()
    refetchMilestones()
    refetchApplications()
  }
  
  // Combined loading state
  const isLoading = isProgramLoading || isMilestonesLoading || isApplicationsLoading
  
  // Create the context value object
  const contextValue = {
    // Program data
    participationData,
    cohort: programDataProcessed.cohort,
    milestones,
    initiativeName: programDataProcessed.initiativeName,
    participationType: programDataProcessed.participationType,
    applications: applications || [],
    
    // Active program management
    activeProgramId,
    setActiveProgram: setActiveProgramId,
    getActiveProgramData,
    getAllProgramInitiatives,
    getProgramCohortIds,
    
    // Loading and error states
    isLoading,
    isProgramLoading,
    isMilestonesLoading,
    isApplicationsLoading,
    programError,
    
    // Operations
    refreshProgramData,
    
    // Derived properties  
    hasProgramData: Boolean(programDataProcessed.cohort),
    programCount: (getAllProgramInitiatives() || []).length
  }
  
  return (
    <ProgramContext.Provider value={contextValue}>
      {children}
    </ProgramContext.Provider>
  )
}

/**
 * Hook to use the program context
 * @returns {Object} Program context value
 */
export function useProgramContext() {
  const context = useContext(ProgramContext)
  if (context === null) {
    throw new Error("useProgramContext must be used within a ProgramProvider")
  }
  return context
}