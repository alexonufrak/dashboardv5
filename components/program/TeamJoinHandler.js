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
  // Also handle resetting state when isActive becomes false
  useEffect(() => {
    let stateResetTimer;
    
    if (isActive && cohort) {
      startTeamJoinProcess()
    } else if (!isActive) {
      // Add a delay to prevent UI flicker when switching between dialogs
      stateResetTimer = setTimeout(() => {
        // Double-check we're still inactive before resetting state
        if (!isActive) {
          setShowJoinList(false)
          setShowCreateTeam(false)
          setError(null)
        }
      }, 150); // Small delay to allow any new dialog to open first
    }
    
    // Clean up the timer on unmount or when dependencies change
    return () => {
      if (stateResetTimer) clearTimeout(stateResetTimer);
    };
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
    
    // Log cohort teams if they exist
    if (cohort.Teams && cohort.Teams.length > 0) {
      console.log("Found team IDs in cohort.Teams:", cohort.Teams);
      
      // First try to fetch team details directly from the Teams array if available
      try {
        // Directly fetch team details for teams linked to the cohort
        const teamIds = cohort.Teams.join(',');
        console.log(`Directly fetching teams with IDs: ${teamIds}`);
        
        const response = await fetch(`/api/teams?ids=${teamIds}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched teams details:", data);
          
          if (data.teams && data.teams.length > 0) {
            // Log individual team info for debugging
            data.teams.forEach(team => {
              console.log(`Processed team ${team.id}: Name=${team.name || team.teamName || "Unnamed Team"}`);
            });
            
            // Update the teams state
            setTeams(data.teams);
            setShowJoinList(true);
            return; // Exit early since we have the teams
          }
        }
      } catch (directError) {
        console.error("Error fetching teams directly:", directError);
        // Continue to fallback approach
      }
    }
    
    // Fallback: fetch joinable teams for this cohort
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
      
      // Generate cache key for this request
      const cacheKey = `joinable-teams-${cohort.id}-${institutionId}`
      
      // Check for cached data first
      const cachedData = sessionStorage.getItem(cacheKey)
      let fetchedTeams = []
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData)
          // Check if cache is still valid (less than 5 minutes old)
          const cacheTime = new Date(parsedData._meta?.timestamp || 0)
          const now = new Date()
          const cacheAgeMs = now - cacheTime
          
          if (cacheAgeMs < 5 * 60 * 1000) { // 5 minutes in milliseconds
            console.log("Using cached joinable teams data", {
              cacheAge: `${Math.round(cacheAgeMs / 1000)} seconds`,
              teams: parsedData.teams.length
            })
            fetchedTeams = parsedData.teams || []
          } else {
            console.log("Cache expired, fetching fresh data")
          }
        } catch (cacheError) {
          console.error("Error parsing cached data:", cacheError)
          // Continue with API request on cache error
        }
      }
      
      // If cache was not valid or not found, fetch from API
      if (fetchedTeams.length === 0) {
        // Fetch the joinable teams specifically for this cohort and institution
        const response = await fetch(`/api/teams/joinable?institutionId=${institutionId}&cohortId=${cohort.id}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        fetchedTeams = data.teams || []
        
        // Cache the response for future use
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data))
        } catch (cacheError) {
          console.error("Error caching team data:", cacheError)
          // Continue even if caching fails
        }
        
        console.log("Fetched joinable teams from API:", {
          count: fetchedTeams.length,
          firstTeamName: fetchedTeams[0]?.name || "N/A"
        })
      }
      
      // Update state with fetched teams
      setTeams(fetchedTeams)
      
      // Debug log team names
      if (fetchedTeams.length > 0) {
        console.log("Team names:", fetchedTeams.map(team => team.name || "Unnamed"))
      }
      
      // For now, always show the join list regardless of team availability
      setShowJoinList(true)
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