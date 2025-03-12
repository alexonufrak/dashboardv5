"use client"

import { useState, useEffect } from 'react'
import JoinableTeamsList from './JoinableTeamsList'
import TeamCreateDialog from '@/components/teams/TeamCreateDialog'

/**
 * Handler component for the Xperience and Horizons Challenge team join process
 * This component manages the flow between joining an existing team or creating a new one
 * 
 * @param {Object} props - Component props 
 * @param {Object} props.cohort - The cohort data
 * @param {Object} props.profile - The user profile data
 * @param {boolean} props.isActive - Whether the handler is active
 * @param {Function} props.onComplete - Callback when the process is complete
 * @param {Function} props.onCancel - Callback when the user cancels the process
 */
const TeamJoinHandler = ({ cohort, profile, isActive = false, onComplete, onCancel }) => {
  const [teams, setTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [showJoinList, setShowJoinList] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [error, setError] = useState(null)
  
  // Start the process when isActive changes to true
  useEffect(() => {
    if (isActive && cohort) {
      startTeamJoinProcess()
    }
  }, [isActive, cohort])
  
  // Start the team join process
  const startTeamJoinProcess = async () => {
    // Check if this is an Xperience or Horizons Challenge cohort
    const initiativeName = cohort?.initiativeDetails?.name || ""
    const isEligibleInitiative = 
      initiativeName.toLowerCase().includes("xperience") || 
      initiativeName.toLowerCase().includes("horizons challenge")
    
    if (!isEligibleInitiative) {
      console.error("This handler is only for Xperience and Horizons Challenge initiatives")
      handleComplete()
      return
    }
    
    // Fetch joinable teams for this cohort
    await fetchJoinableTeams()
  }
  
  // Fetch joinable teams for this cohort
  const fetchJoinableTeams = async () => {
    setIsLoadingTeams(true)
    setError(null)
    
    try {
      // Get the institution from the profile
      const institutionId = profile?.institution?.id
      
      if (!institutionId) {
        console.error("No institution ID found in user profile")
        setError("Unable to find your institution. Please try again later.")
        return
      }
      
      // Fetch the joinable teams specifically for this cohort and institution
      const response = await fetch(`/api/teams/joinable?institutionId=${institutionId}&cohortId=${cohort.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      const fetchedTeams = data.teams || []
      
      console.log("Fetched joinable teams:", fetchedTeams)
      setTeams(fetchedTeams)
      
      // Check if there are any joinable teams
      const hasJoinableTeams = fetchedTeams.some(team => team.joinable)
      
      // Show the join list if there are joinable teams, otherwise show create dialog
      if (hasJoinableTeams) {
        setShowJoinList(true)
      } else {
        // Still show the join list, which will display a message that no teams are available
        setShowJoinList(true)
      }
    } catch (error) {
      console.error("Error fetching joinable teams:", error)
      setError("Failed to fetch teams. Please try again later.")
    } finally {
      setIsLoadingTeams(false)
    }
  }
  
  // Handle team creation
  const handleTeamCreated = (team) => {
    console.log("Team created successfully:", team)
    
    // Close the create team dialog
    setShowCreateTeam(false)
    
    // Complete the process
    handleComplete()
  }
  
  // Handle join team success
  const handleJoinSuccess = () => {
    console.log("Join team request submitted successfully")
    
    // Close the join list
    setShowJoinList(false)
    
    // Complete the process
    handleComplete()
  }
  
  // Handle create team button click from join list
  const handleCreateTeamFromJoinList = () => {
    // Close the join list
    setShowJoinList(false)
    
    // Show the create team dialog
    setShowCreateTeam(true)
  }
  
  // Handle completion of the process
  const handleComplete = () => {
    // Reset all states
    setShowJoinList(false)
    setShowCreateTeam(false)
    
    // Call the onComplete callback
    if (onComplete) {
      onComplete(cohort)
    }
  }
  
  // Handle cancellation of the process
  const handleCancel = () => {
    // Reset all states
    setShowJoinList(false)
    setShowCreateTeam(false)
    
    // Call the onCancel callback
    if (onCancel) {
      onCancel()
    }
  }
  
  // Render the component
  return (
    <>
      {/* Joinable Teams List */}
      <JoinableTeamsList
        open={showJoinList}
        onClose={() => setShowJoinList(false)}
        teams={teams}
        cohort={cohort}
        profile={profile}
        onApplySuccess={handleJoinSuccess}
        onCreateTeam={handleCreateTeamFromJoinList}
      />
      
      {/* Team Creation Dialog */}
      <TeamCreateDialog
        open={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onCreateTeam={handleTeamCreated}
        cohortId={cohort?.id}
      />
    </>
  )
}

export default TeamJoinHandler