"use client"

import { createContext, useContext, useState, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useUserTeams } from "@/lib/airtable/hooks"
import { useProgramContext } from "./ProgramContext"

// Import team functions (will be refactored to use domain entities later)
import { updateTeamData, inviteTeamMember } from "@/lib/useDataFetching"

/**
 * Context for team-related data and operations
 */
const TeamContext = createContext(null)

/**
 * Provider component for team data and operations
 */
export function TeamProvider({ children }) {
  const queryClient = useQueryClient()
  const { 
    activeProgramId, 
    getProgramCohortIds,
    participationData
  } = useProgramContext()
  
  // Store active team for each program
  const [programTeams, setProgramTeams] = useState({})
  
  // Fetch teams data using domain-specific hooks
  const { 
    data: teams, 
    isLoading: isTeamsLoading, 
    error: teamsError,
    refetch: refetchTeams
  } = useUserTeams()
  
  // Process teams data
  const teamData = useMemo(() => {
    return teams && teams.length > 0 ? teams[0] : null
  }, [teams])
  
  // Get teams for a specific program
  const getTeamsForProgram = (programId) => {
    if (!teams) return []
    
    // Get cohort IDs for this program
    const programCohorts = getProgramCohortIds(programId)
    
    // Get teams for the specific program based on cohort
    const filteredTeams = teams.filter(team => {
      // If team has cohortIds array, check if it contains any cohort related to this program
      if (team.cohortIds && Array.isArray(team.cohortIds)) {
        // Check if any of the team's cohorts match the program cohorts
        return team.cohortIds.some(cohortId => programCohorts.includes(cohortId))
      }
      
      // No cohortIds, can't match
      return false
    })
    
    return filteredTeams
  }
  
  // Get active team for a program
  const getActiveTeamForProgram = (programId) => {
    // Try to get from state first
    if (programTeams[programId]) {
      return programTeams[programId]
    }
    
    // If not set in state, find a default team for this program
    const programTeamsList = getTeamsForProgram(programId)
    
    if (programTeamsList.length > 0) {
      // Set the first team as default and store it
      setProgramTeams(prev => ({
        ...prev,
        [programId]: programTeamsList[0].id
      }))
      return programTeamsList[0].id
    }
    
    return null
  }
  
  // Set active team for a program
  const setActiveTeamForProgram = (programId, teamId) => {
    setProgramTeams(prev => ({
      ...prev,
      [programId]: teamId
    }))
  }
  
  /**
   * Invites a user to join a team
   * @param {string} teamId - Team ID
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Invitation result
   */
  const inviteUserToTeam = async (teamId, email) => {
    if (!teamId || !email) {
      throw new Error("Team ID and email are required")
    }
    
    try {
      const result = await inviteTeamMember(teamId, email)
      // Invalidate teams queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      return result
    } catch (error) {
      console.error("Failed to invite user to team:", error)
      throw error
    }
  }
  
  /**
   * Updates team information
   * @param {string} teamId - Team ID
   * @param {Object} data - Team data to update
   * @returns {Promise<Object>} Updated team data
   */
  const updateTeam = async (teamId, data) => {
    if (!teamId) {
      throw new Error("Team ID is required")
    }
    
    try {
      const result = await updateTeamData(teamId, data)
      // Invalidate teams queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["teams"] })
      return result
    } catch (error) {
      console.error("Failed to update team:", error)
      throw error
    }
  }
  
  /**
   * Gets team by ID
   * @param {string} teamId - Team ID to find
   * @returns {Object|null} Team data or null if not found
   */
  const getTeamById = (teamId) => {
    if (!teams || !teamId) return null
    return teams.find(team => team.id === teamId) || null
  }
  
  /**
   * Determines if user has a team for the active program
   */
  const hasTeamForActiveProgram = useMemo(() => {
    if (!activeProgramId || !teams) return false
    const programTeams = getTeamsForProgram(activeProgramId)
    return programTeams.length > 0
  }, [activeProgramId, teams, getTeamsForProgram])
  
  // Create the context value object
  const contextValue = {
    // Team data
    teams: teams || [],
    teamData,
    
    // Team selection for programs
    programTeams,
    getTeamsForProgram,
    getActiveTeamForProgram,
    setActiveTeamForProgram,
    
    // Team operations
    inviteUserToTeam,
    updateTeam,
    getTeamById,
    refetchTeams,
    
    // Loading and error states
    isTeamsLoading,
    teamsError,
    
    // Derived properties
    hasTeamForActiveProgram,
    userHasTeams: teams && teams.length > 0,
    teamCount: teams?.length || 0
  }
  
  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  )
}

/**
 * Hook to use the team context
 * @returns {Object} Team context value
 */
export function useTeamContext() {
  const context = useContext(TeamContext)
  if (context === null) {
    throw new Error("useTeamContext must be used within a TeamProvider")
  }
  return context
}