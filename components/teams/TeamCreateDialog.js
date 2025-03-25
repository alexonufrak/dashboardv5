"use client"

import { useState, useEffect, useCallback } from 'react'
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
import { Dropzone } from '@/components/ui/dropzone'
import { AlertCircle, Users, UserPlus, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCreateTeam } from '@/lib/useDataFetching'
import { upload } from '@vercel/blob/client'
import { toast } from 'sonner'
import { FILE_UPLOAD, formatFileSize } from "@/lib/constants"

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
  const [teamIsJoinable, setTeamIsJoinable] = useState(true) // Default to true - team is joinable
  const [error, setError] = useState('')
  const [joinableTeams, setJoinableTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Team header image upload states
  const [headerImage, setHeaderImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Use our createTeam mutation hook
  const createTeamMutation = useCreateTeam()
  
  // Handle header image upload to Vercel Blob
  const uploadHeaderImage = async () => {
    if (!headerImage) return null
    
    try {
      setIsUploading(true)
      const toastId = toast.loading(`Uploading team header image...`)
      
      // Create a unique folder path for the team header
      const timestamp = Date.now()
      const folderPath = `${FILE_UPLOAD.TEAM_IMAGE.FOLDER_PATH}/${timestamp}`
      
      // Clean up the file name
      const safeFilename = headerImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      
      // Create a payload with metadata
      const clientPayload = JSON.stringify({
        type: 'team-header',
        timestamp
      })
      
      // Upload the file to Vercel Blob
      const blob = await upload(`${folderPath}/${safeFilename}`, headerImage, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload,
        onUploadProgress: ({ percentage }) => {
          toast.loading(`Uploading team header image... ${Math.round(percentage)}%`, { id: toastId })
        }
      })
      
      toast.success('Team header image uploaded', { id: toastId })
      setIsUploading(false)
      
      // Return an object with the necessary file information for Airtable
      return {
        url: blob.url,
        filename: headerImage.name || safeFilename,
        contentType: headerImage.type,
        size: headerImage.size
      }
    } catch (error) {
      console.error('Error uploading team header:', error)
      toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`)
      setIsUploading(false)
      return null
    }
  }

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
        // Make sure each team has a name property - "Team Name" is the correct field according to schema
        const teamsWithNames = cohort.teams.map(team => {
          console.log("Team object:", team);
          
          // Check if this is an Airtable record format or standard format
          let processedTeam = { ...team };
          
          // Ensure team has a correct name regardless of format
          if (team.fields) {
            // Prioritize "Team Name" field which is the correct field name in Airtable
            const teamName = team.fields["Team Name"] || team.fields.Name || team.name || "Unnamed Team";
            console.log("Using team name:", teamName);
            
            processedTeam = { 
              ...team, 
              id: team.id || team.recordId,
              name: teamName, // Ensure proper name field
              description: team.fields.Description || team.description || "",
              members: team.fields.Members || team.members || [],
              memberCount: team.fields["Count (Members)"] || 0,
              institution: team.fields.Institution ? {
                id: Array.isArray(team.fields.Institution) ? team.fields.Institution[0] : team.fields.Institution,
                name: team.fields["Institution Name"] || "Unknown Institution"
              } : null,
              displayMembers: team.fields["Contact (from Members)"] || []
            };
          } else if (!team.name) {
            // Handle non-Airtable format teams that lack a name property
            processedTeam.name = team["Team Name"] || team.Name || "Unnamed Team";
          }
          
          // Log the processed team for debugging
          console.log(`Processed cohort team ${processedTeam.id}: Name=${processedTeam.name}`);
          
          return processedTeam;
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
                // Check if this is an Airtable record format or standard format
                let processedTeam = { ...team };
                
                // Ensure team has a correct name regardless of format
                // Prioritize "Team Name" field which is the correct field name in Airtable
                if (team.fields) {
                  const teamName = team.fields["Team Name"] || team.fields.Name || team.name || "Unnamed Team";
                  console.log("Using team name from API response:", teamName);
                  
                  processedTeam = {
                    ...team,
                    id: team.id || team.recordId,
                    name: teamName, // Ensure proper name field
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
                } else if (!team.name) {
                  // Handle non-Airtable format teams that lack a name property
                  processedTeam.name = team["Team Name"] || team.Name || "Unnamed Team";
                }
                
                // Log the processed team for debugging
                console.log(`Processed team ${processedTeam.id}: Name=${processedTeam.name}`);
                
                return processedTeam;
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
          // Check if this is an Airtable record format or standard format
          let processedTeam = { ...team };
          
          // Ensure team has a correct name regardless of format
          // Prioritize "Team Name" field which is the correct field name in Airtable
          if (team.fields) {
            const teamName = team.fields["Team Name"] || team.fields.Name || team.name || "Unnamed Team";
            console.log("Using team name from joinable API:", teamName);
            
            processedTeam = {
              ...team,
              id: team.id || team.recordId,
              name: teamName, // Ensure proper name field
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
          } else if (!team.name) {
            // Handle non-Airtable format teams that lack a name property
            processedTeam.name = team["Team Name"] || team.Name || "Unnamed Team";
          }
          
          // Log the processed team for debugging
          console.log(`Processed joinable team ${processedTeam.id}: Name=${processedTeam.name}`);
          
          return processedTeam;
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
    setIsSubmitting(true)
    
    try {
      // Upload header image if one is provided
      let fileInfo = null
      if (headerImage) {
        fileInfo = await uploadHeaderImage()
      }
      
      // Prepare team data
      const teamData = {
        name: teamName.trim(),
        description: teamDescription.trim(),
        joinable: teamIsJoinable, // Add the joinable field to be sent to the API
      }
      
      // Add header image if uploaded successfully
      if (fileInfo) {
        // Using the same pattern as milestone submissions
        teamData.fileInfo = fileInfo
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
      setHeaderImage(null)
      
      // Close dialog
      if (onClose) {
        onClose()
      }
    } catch (error) {
      setError(error.message || 'An error occurred while creating the team')
    } finally {
      setIsSubmitting(false)
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
          teamId: selectedTeam.id, // Changed from teamToJoin to teamId to match API expectations
          teamToJoin: selectedTeam.id, // Keep this for backward compatibility
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
      setTeamIsJoinable(true) // Reset joinable option to default (true)
      setError('')
      setActiveTab("create")
      setSelectedTeam(null)
      setJoinMessage('')
      setShowJoinDialog(false)
      setHeaderImage(null)
      
      if (onClose) {
        onClose()
      }
    }, 50);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[650px]">
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
                
                {/* Team Header Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Team Header Image (optional)
                  </label>
                  
                  <Dropzone
                    maxFiles={1}
                    maxSize={FILE_UPLOAD.TEAM_IMAGE.MAX_SIZE}
                    accept={FILE_UPLOAD.TEAM_IMAGE.ALLOWED_TYPES}
                    prompt="Drag & drop a header image, or click to browse"
                    subPrompt={`Supported image formats up to ${formatFileSize(FILE_UPLOAD.TEAM_IMAGE.MAX_SIZE)}`}
                    onDrop={(file) => setHeaderImage(file)}
                    onFileRemove={() => setHeaderImage(null)}
                    disabled={isSubmitting || createTeamMutation.isPending || isUploading}
                    currentFiles={headerImage ? [headerImage] : []}
                    variant={headerImage ? "success" : "default"}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="teamJoinable"
                    checked={teamIsJoinable}
                    onChange={(e) => setTeamIsJoinable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="teamJoinable" className="text-sm font-medium">
                    Allow others to request to join this team
                  </label>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleClose(false)}
                    disabled={isSubmitting || createTeamMutation.isPending || isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || createTeamMutation.isPending || isUploading || !teamName.trim()}
                  >
                    {isUploading ? 'Uploading Image...' : 
                     createTeamMutation.isPending ? 'Creating Team...' : 
                     isSubmitting ? 'Processing...' : 'Create Team'}
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
                      You can create your own team by clicking the &quot;Create a New Team&quot; button below.
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
              Send a message to the team explaining why you&apos;d like to join and what skills you bring.
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