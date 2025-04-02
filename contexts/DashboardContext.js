"use client"

import { createContext, useContext } from "react"
import { useUserContext } from "./UserContext"
import { useProgramContext } from "./ProgramContext"
import { useTeamContext } from "./TeamContext" 
import { useEducationContext } from "./EducationContext"
import { DashboardProvider as CompositeProvider } from "./DashboardProvider"

/**
 * Legacy context for backward compatibility
 * Combines all domain-specific contexts into a single context
 */
const DashboardContext = createContext(null)

/**
 * Legacy provider that maintains backward compatibility
 * Uses the new domain-driven contexts internally
 */
export function DashboardProvider({ children }) {
  return (
    <CompositeProvider>
      <LegacyContextBridge>
        {children}
      </LegacyContextBridge>
    </CompositeProvider>
  )
}

/**
 * Bridge component that combines all domain contexts into the legacy format
 */
function LegacyContextBridge({ children }) {
  // Get values from domain-specific contexts
  const userContext = useUserContext()
  const programContext = useProgramContext()
  const teamContext = useTeamContext()
  const educationContext = useEducationContext()
  
  // Combine all context values for backward compatibility
  const combinedValue = {
    // From UserContext
    user: userContext.user,
    profile: userContext.profile,
    isLoading: userContext.isLoading,
    error: userContext.error,
    handleProfileUpdate: userContext.updateProfile,
    updateOnboardingStatus: userContext.updateOnboardingStatus,
    findUser: userContext.findUser,
    userLookupTools: userContext.userLookupTools,
    
    // From ProgramContext
    cohort: programContext.cohort,
    milestones: programContext.milestones,
    initiativeName: programContext.initiativeName,
    participationType: programContext.participationType,
    programLoading: programContext.isLoading,
    programError: programContext.programError,
    activeProgramId: programContext.activeProgramId,
    setActiveProgram: programContext.setActiveProgram,
    getActiveProgramData: programContext.getActiveProgramData,
    getAllProgramInitiatives: programContext.getAllProgramInitiatives,
    getProgramCohortIds: programContext.getProgramCohortIds,
    hasProgramData: programContext.hasProgramData,
    applications: programContext.applications,
    participationData: programContext.participationData,
    
    // From TeamContext
    teamData: teamContext.teamData,
    teamsData: teamContext.teams,
    isTeamLoading: teamContext.isTeamsLoading,
    getTeamsForProgram: teamContext.getTeamsForProgram,
    setActiveTeamForProgram: teamContext.setActiveTeamForProgram,
    getActiveTeamForProgram: teamContext.getActiveTeamForProgram,
    
    // From EducationContext
    education: educationContext.education,
    isEducationLoading: educationContext.isEducationLoading,
    hasCompletedEducationProfile: educationContext.hasCompletedEducationProfile,
    
    // UI State (temporary - should be moved to a UI context)
    isEditModalOpen: false,  // Default value, will be implemented in UI context
    setIsEditModalOpen: () => {},  // No-op, will be implemented in UI context
    isUpdating: false,  // Default value, will be implemented in UI context
    
    // Combined refresh functionality
    refreshData: (dataType) => {
      switch(dataType) {
        case 'profile':
          userContext.refetchProfile()
          break
        case 'teams':
          teamContext.refetchTeams()
          break
        case 'applications':
          // Handled through program context
          programContext.refreshProgramData()
          break
        case 'program':
          programContext.refreshProgramData()
          break
        case 'education':
          educationContext.refetchEducation()
          break
        case 'all':
          userContext.refetchProfile()
          teamContext.refetchTeams()
          programContext.refreshProgramData()
          educationContext.refetchEducation()
          break
        default:
          console.error('Unknown data type:', dataType)
      }
    }
  }
  
  return (
    <DashboardContext.Provider value={combinedValue}>
      {children}
    </DashboardContext.Provider>
  )
}

/**
 * Legacy hook for backward compatibility
 * @returns {Object} Combined context values from all domain contexts
 */
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === null) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}

/**
 * Exports direct access to domain contexts
 * Encourages gradual migration from legacy context to domain contexts
 */
export {
  useUserContext,
  useProgramContext,
  useTeamContext,
  useEducationContext
}