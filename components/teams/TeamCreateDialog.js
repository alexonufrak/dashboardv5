"use client"

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Users, UserPlus, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCreateTeam } from '@/lib/useDataFetching'

/**
 * Combined dialog for creating a new team or joining an existing team
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {Function} props.onCreateTeam Callback when team is created with team data
 * @param {Function} props.onJoinTeam Callback when team is joined (optional)
 * @param {string} props.cohortId Optional cohort ID to associate the team with
 * @param {Object} props.profile User profile data (optional)
 * @param {Object} props.cohort Cohort data (optional)
 */
const TeamCreateDialog = ({ open, onClose, onCreateTeam, onJoinTeam, cohortId, profile, cohort }) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("create")
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [error, setError] = useState('')
  const [joinableTeams, setJoinableTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Use our createTeam mutation hook
  const createTeamMutation = useCreateTeam()

  // Fetch joinable teams when the dialog opens
  useEffect(() => {
    if (open && activeTab === "join") {
      fetchJoinableTeams()
    }
  }, [open, activeTab])

  // Fetch joinable teams for this cohort
  const fetchJoinableTeams = async () => {
    // Skip if we don't have the cohort
    if (!cohort) return;
    
    setIsLoadingTeams(true)
    setError('')
    
    try {
      console.log("Cohort data:", cohort);
      
      // First check if we can get teams directly from the cohort
      if (Array.isArray(cohort.teams) && cohort.teams.length > 0) {
        console.log("Found teams array directly in cohort:", cohort.teams);
        // Make sure each team has a name property - Name is the correct field according to schema
        const teamsWithNames = cohort.teams.map(team => {
          console.log("Team object:", team);
          // Check for Airtable fields format
          if (team.fields) {
            return { 
              ...team, 
              id: team.id || team.recordId,
              name: team.fields.Name || team.name || "Unnamed Team",
              description: team.fields.Description || team.description,
              members: team.fields.Members || team.members || [],
              memberCount: team.fields["Count (Members)"] || 0,
              institution: team.fields.Institution ? {
                id: Array.isArray(team.fields.Institution) ? team.fields.Institution[0] : team.fields.Institution,
                name: team.fields["Institution Name"] || "Unknown Institution"
              } : null,
              displayMembers: team.fields["Contact (from Members)"] || []
            };
          }
          // Standard properties
          return { 
            ...team,
            name: team.Name || team.name || "Unnamed Team" 
          };
        });
        setJoinableTeams(teamsWithNames);
        setIsLoadingTeams(false);
        return;
      }
      
      // Check if there's a Teams field that contains team IDs
      if (Array.isArray(cohort.Teams) && cohort.Teams.length > 0) {
        console.log("Found team IDs in cohort.Teams:", cohort.Teams);
        
        try {
          // Fetch details for these team IDs
          const teamsResponse = await fetch('/api/teams?ids=' + cohort.Teams.join(','));
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            console.log("Fetched teams details:", teamsData);
            if (Array.isArray(teamsData.teams)) {
              // Process teams to ensure they have name property
              const processedTeams = teamsData.teams.map(team => {
                // If team has standard expected format, return it
                if (team.name) return team;
                
                // Check if this is an Airtable record format
                if (team.fields) {
                  return {
                    ...team,
                    id: team.id || team.recordId,
                    name: team.fields.Name || "Unnamed Team",
                    description: team.fields.Description || "",
                    members: team.fields.Members || [],
                    memberCount: team.fields["Count (Members)"] || 0,
                    institution: team.fields.Institution ? {
                      id: Array.isArray(team.fields.Institution) ? team.fields.Institution[0] : team.fields.Institution,
                      name: team.fields["Institution Name"] || "Unknown Institution"
                    } : null,
                    displayMembers: team.fields["Contact (from Members)"] || [],
                    joinable: team.fields.Joinable || team.fields["Joinable (Yes No)"] === "Yes" || true
                  };
                }
                
                // Fallback
                return {
                  ...team,
                  name: team.Name || "Unnamed Team"
                };
              });
              
              setJoinableTeams(processedTeams);
              setIsLoadingTeams(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching team details from IDs:", error);
        }
      }
      
      // Fallback: Use the joinable API endpoint
      if (profile?.institution?.id) {
        const institutionId = profile.institution.id;
        console.log(`Falling back to joinable API with institutionId ${institutionId} and cohortId ${cohortId}`);
        
        const response = await fetch(`/api/teams/joinable?institutionId=${institutionId}&cohortId=${cohortId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const fetchedTeams = data.teams || [];
        
        console.log("Fetched joinable teams from API:", fetchedTeams);
        
        // Process fetched teams to ensure they have required properties
        const processedTeams = fetchedTeams.map(team => {
          // If team has standard expected format, return it
          if (team.name) return team;
          
          // Check if this is an Airtable record format
          if (team.fields) {
            return {
              ...team,
              id: team.id || team.recordId,
              name: team.fields.Name || "Unnamed Team",
              description: team.fields.Description || "",
              members: team.fields.Members || [],
              memberCount: team.fields["Count (Members)"] || 0,
              institution: team.fields.Institution ? {
                id: Array.isArray(team.fields.Institution) ? team.fields.Institution[0] : team.fields.Institution,
                name: team.fields["Institution Name"] || "Unknown Institution"
              } : null,
              displayMembers: team.fields["Contact (from Members)"] || [],
              joinable: team.fields.Joinable || team.fields["Joinable (Yes No)"] === "Yes" || true
            };
          }
          
          // Fallback
          return {
            ...team,
            name: team.Name || "Unnamed Team"
          };
        });
        
        setJoinableTeams(processedTeams);
      } else {
        console.log("No institution ID available in profile, can't fetch joinable teams");
        setJoinableTeams([]);
      }
    } catch (error) {
      console.error("Error fetching joinable teams:", error);
      setError("Failed to fetch teams. Please try again later.");
    } finally {
      setIsLoadingTeams(false);
    }
  }

  // Handle create team form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate inputs
    if (!teamName.trim()) {
      setError('Please enter a team name')
      return
    }
    
    setError('')
    
    try {
      // Prepare team data
      const teamData = {
        name: teamName.trim(),
        description: teamDescription.trim()
      }
      
      // Call our mutation function
      const team = await createTeamMutation.mutateAsync({ 
        teamData, 
        cohortId 
      })
      
      // Call the success callback with the new team data
      if (onCreateTeam) {
        onCreateTeam(team)
      }
      
      // Reset form
      setTeamName('')
      setTeamDescription('')
      
      // Close dialog
      if (onClose) {
        onClose()
      }
    } catch (error) {
      setError(error.message || 'An error occurred while creating the team')
    }
  }
  
  // Handle selection of a team to join
  const handleSelectTeam = (team) => {
    // Ensure the team has a proper id
    if (team) {
      // Log the team data to help with debugging
      console.log("Selected team for joining:", team);
      
      // Make sure we have a valid id
      if (!team.id && team.recordId) {
        team.id = team.recordId;
      }
      
      // Double check we have an id before proceeding
      if (!team.id) {
        console.error("Team selected for joining has no id:", team);
        setError("The selected team has no ID. Please try again or choose another team.");
        return;
      }
    }
    
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
    
    // Ensure the team has a valid ID
    if (!selectedTeam.id) {
      console.error("Team selected for joining has no id:", selectedTeam);
      setError("The selected team has no ID. Please try again or choose another team.");
      return;
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      console.log("Submitting join request for team:", selectedTeam.id, selectedTeam.name);
      
      // Create the application with the team join request
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cohortId: cohortId,
          participationType: 'Team',
          applicationType: 'joinTeam',
          teamToJoin: selectedTeam.id, // Make sure we're using the correct ID field
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
      
      // Call the success callback if provided
      if (onJoinTeam) {
        onJoinTeam(responseData)
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
  
  // Handle dialog close
  const handleClose = (isOpen) => {
    // Only handle dialog closing (isOpen = false)
    if (isOpen !== false) return;
    
    // Add a small delay before resetting state and calling onClose
    // to prevent UI flicker when another dialog is opening
    setTimeout(() => {
      // Reset all state
      setTeamName('')
      setTeamDescription('')
      setError('')
      setActiveTab("create")
      setSelectedTeam(null)
      setJoinMessage('')
      setShowJoinDialog(false)
      
      if (onClose) {
        onClose()
      }
    }, 50);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[650px] z-[200]">
          <DialogHeader>
            <DialogTitle>Team Participation</DialogTitle>
            <DialogDescription>
              Join an existing team or create your own team to participate in this program.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create a Team
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Join a Team
              </TabsTrigger>
            </TabsList>
            
            {/* Create Team Tab */}
            <TabsContent value="create" className="py-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && activeTab === "create" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    maxLength={50}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="teamDescription" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="teamDescription"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Briefly describe your team (optional)"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: You can add team members after creating your team.
                  </p>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleClose(false)}
                    disabled={createTeamMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTeamMutation.isPending || !teamName.trim()}
                  >
                    {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
            
            {/* Join Team Tab */}
            <TabsContent value="join" className="py-1">
              {error && activeTab === "join" && !showJoinDialog && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoadingTeams ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Loading available teams...</p>
                </div>
              ) : joinableTeams.length === 0 ? (
                <div className="py-8">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No teams are currently looking for members. 
                      You can create your own team by clicking the "Create a New Team" button below.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {joinableTeams.map(team => (
                      <Card key={team.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{team.name}</CardTitle>
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
                        <CardContent className="text-sm pb-3">
                          <p className="line-clamp-2">{team.description || "Team description not available."}</p>
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
              
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                {joinableTeams.length === 0 && !isLoadingTeams && (
                  <Button 
                    onClick={() => setActiveTab("create")}
                  >
                    Create a New Team
                  </Button>
                )}
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Join Team Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={handleCloseJoinDialog}>
        <DialogContent className="sm:max-w-md z-[210]">
          <DialogHeader>
            <DialogTitle>Join {selectedTeam?.name || "Team"}</DialogTitle>
            <DialogDescription>
              Send a message to the team explaining why you'd like to join and what skills you bring.
            </DialogDescription>
          </DialogHeader>
          
          {error && showJoinDialog && (
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
    </>
  )
}

export default TeamCreateDialog