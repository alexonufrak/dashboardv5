"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Users, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

/**
 * Helper function to format the cohort display name with initiative, topic, and class
 * @param {Object} cohort - The cohort object
 * @returns {string} - Formatted cohort display name
 */
const formatCohortDisplayName = (cohort) => {
  if (!cohort) return "this cohort";
  
  // Start with the initiative name
  const initiativeName = cohort.initiativeDetails?.name || "Program";
  
  // Get topic and class names if available
  const topicName = cohort.topicNames && cohort.topicNames.length > 0 
    ? cohort.topicNames[0]
    : null;
    
  const className = cohort.classNames && cohort.classNames.length > 0
    ? cohort.classNames[0]
    : null;
  
  // Combine parts with proper formatting
  let displayName = initiativeName;
  
  // Add topic name if available
  if (topicName) {
    displayName += `: ${topicName}`;
  }
  
  // Add class name if available
  if (className) {
    displayName += topicName ? ` (${className})` : `: ${className}`;
  }
  
  return displayName;
};

/**
 * A component that displays a list of joinable teams for a cohort
 * Used for Xperience and Horizons Challenge initiatives
 * 
 * @param {Object} props Component props
 * @param {Array} props.teams Array of teams for the cohort
 * @param {Object} props.cohort The cohort data
 * @param {Object} props.profile User profile data
 * @param {Function} props.onApplySuccess Callback when application is submitted successfully
 * @param {Function} props.onClose Callback when the dialog is closed
 * @param {Function} props.onCreateTeam Callback when create team button is clicked
 * @param {boolean} props.open Whether the dialog is open
 */
const JoinableTeamsList = ({ teams = [], cohort, profile, onApplySuccess, onClose, onCreateTeam, open }) => {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // For now, treat all teams as joinable
  // This is a temporary fix until the joinable flag is properly set in Airtable 
  const hasJoinableTeams = teams.length > 0
  
  // Format cohort display name
  const cohortDisplayName = formatCohortDisplayName(cohort);
  
  // Debug team and cohort info
  useEffect(() => {
    // Log cohort display name
    console.log("Cohort display name:", {
      formatted: cohortDisplayName,
      initiative: cohort?.initiativeDetails?.name,
      topics: cohort?.topicNames,
      classes: cohort?.classNames
    });
    
    // Log team details
    if (teams.length > 0) {
      console.log("Teams in JoinableTeamsList:", teams.map(team => ({
        id: team.id,
        name: team.name || "Unnamed",
        memberCount: team.memberCount || 0
      })))
    }
  }, [teams, cohort, cohortDisplayName])
  
  // Handle selection of a team to join
  const handleSelectTeam = (team) => {
    setSelectedTeam(team)
    setShowJoinDialog(true)
  }
  
  // Handle join message submission
  const handleSubmitJoinRequest = async () => {
    if (!selectedTeam) {
      setError('No team selected')
      return
    }
    
    if (!joinMessage.trim()) {
      setError('Please enter a message to the team')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Create the application with the team join request
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cohortId: cohort.id,
          participationType: 'Team',
          applicationType: 'joinTeam',
          teamToJoin: selectedTeam.id,
          joinTeamMessage: joinMessage
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit join request')
      }
      
      // Get the response data
      const responseData = await response.json()
      
      console.log('Join team request submitted successfully:', responseData)
      
      // Reset state
      setJoinMessage('')
      setSelectedTeam(null)
      setShowJoinDialog(false)
      
      // Call the success callback
      if (onApplySuccess) {
        onApplySuccess(cohort)
      }
      
      // Close the dialog
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting join request:', error)
      setError(error.message || 'An error occurred while submitting your request')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle closing the join dialog
  const handleCloseJoinDialog = () => {
    setShowJoinDialog(false)
    setJoinMessage('')
    setError('')
  }
  
  // Get team members count
  const getTeamMembersCount = (team) => {
    return team.memberCount || team.members?.length || 0
  }
  
  // Reset state when dialog is closed, with a small delay
  useEffect(() => {
    let resetTimer;
    
    if (!open) {
      // Add a delay to prevent issues with unmounting while transitioning
      resetTimer = setTimeout(() => {
        if (!open) { // Double-check we're still closed
          setSelectedTeam(null)
          setShowJoinDialog(false)
          setJoinMessage('')
          setError('')
        }
      }, 150);
    }
    
    return () => {
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [open])

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Only handle the close event (isOpen = false)
        // Don't immediately call onClose to prevent race conditions
        if (!isOpen && onClose) {
          // Small delay to prevent UI flickers
          setTimeout(() => onClose(), 50);
        }
      }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Join a Team for {cohortDisplayName}
          </DialogTitle>
          <DialogDescription>
            {hasJoinableTeams 
              ? "These teams are looking for new members. Select a team to join or create your own team."
              : "There are currently no teams looking for members. You can create your own team to get started."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {!hasJoinableTeams && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No teams are currently looking for members. You can create your own team to get started.
              </AlertDescription>
            </Alert>
          )}
          
          {hasJoinableTeams && (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => {
                  console.log(`Rendering team card for ${team.id}:`, {
                    name: team.name || team.teamName || "Unnamed Team",
                    nameType: typeof team.name,
                    teamNameType: typeof team.teamName,
                    members: getTeamMembersCount(team)
                  });
                  
                  // Get the best team name using multiple fallbacks
                  const displayName = 
                    team.name || 
                    team.teamName || 
                    team._debug?.originalName || 
                    team._debug?.teamNameField || 
                    `Team ${team.id.slice(-5)}`;
                  
                  return (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-bold text-primary">
                            {displayName}
                          </CardTitle>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {getTeamMembersCount(team)}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1">
                          {team.institution && (
                            <CardDescription className="text-xs">
                              {team.institution.name}
                            </CardDescription>
                          )}
                          {team.displayMembers && team.displayMembers.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Members:</span> {team.displayMembers.join(", ")}
                              {team.hasMoreMembers && ` +${team.additionalMembersCount} more`}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                    <CardContent className="text-sm">
                      <p className="line-clamp-3">{team.description || "Team description not available."}</p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleSelectTeam(team)} 
                        className="w-full flex items-center gap-2"
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        Apply to Join
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              if (onClose) onClose();
              if (onCreateTeam) onCreateTeam();
            }}
          >
            Create a New Team
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Join Team Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={handleCloseJoinDialog}>
        <DialogContent className="sm:max-w-md z-[210]">
          <DialogHeader>
            <DialogTitle>Join {selectedTeam?.name || "Team"}</DialogTitle>
            <DialogDescription>
              Send a message to the team explaining why you'd like to join and what skills you bring.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="py-4">
            <Textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you'd like to join this team..."
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseJoinDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitJoinRequest}
              disabled={isSubmitting || !joinMessage.trim()}
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default JoinableTeamsList