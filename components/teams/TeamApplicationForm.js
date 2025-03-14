"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, Users, AlertCircle, Plus } from "lucide-react"
import { Dropzone } from "@/components/ui/dropzone"
import { upload } from '@vercel/blob/client'
import { toast } from 'sonner'

/**
 * Form component for team applications
 * This is used in the application page to handle team joining or creation
 */
const TeamApplicationForm = ({ profile, cohort, onSubmit, isPage = false }) => {
  const [activeTab, setActiveTab] = useState('create')
  const [isLoading, setIsLoading] = useState(false)
  const [joinableTeams, setJoinableTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [error, setError] = useState('')

  // Team creation state
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [teamIsJoinable, setTeamIsJoinable] = useState(true)
  const [headerImage, setHeaderImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Fetch joinable teams for this cohort
  useEffect(() => {
    const fetchJoinableTeams = async () => {
      if (!cohort || !profile?.institution?.id) return
      
      try {
        setIsLoading(true)
        setError('')
        
        // Use institutionId to fetch joinable teams for this cohort
        const institutionId = profile.institution.id
        const response = await fetch(`/api/teams/joinable?institutionId=${institutionId}&cohortId=${cohort.id}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        setJoinableTeams(data.teams || [])
      } catch (error) {
        console.error('Error fetching joinable teams:', error)
        setError('Failed to fetch teams. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (activeTab === 'join') {
      fetchJoinableTeams()
    }
  }, [cohort, profile, activeTab])
  
  // Handle team selection
  const handleTeamSelect = (team) => {
    setSelectedTeam(team)
    setError('')
  }
  
  // Handle header image upload
  const uploadHeaderImage = async () => {
    if (!headerImage) return null
    
    try {
      setIsUploading(true)
      const toastId = toast.loading(`Uploading team header image...`)
      
      // Create a unique folder path for the team header
      const timestamp = Date.now()
      const folderPath = `team-headers/${timestamp}`
      
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
      
      // Return file information
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
  
  // Handle create team form submission
  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault()
    
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
      
      // Call API to create team
      // Get body parameters from the current profile and cohort
      const requestBody = {
        name: teamName.trim(),
        description: teamDescription.trim(),
        joinable: teamIsJoinable,
        fileInfo: fileInfo
      }
      
      // Add cohort ID as query parameter for cleaner separation
      const url = cohort?.id ? 
        `/api/teams/create?cohortId=${encodeURIComponent(cohort.id)}` : 
        '/api/teams/create'
      
      // The user profile's institution is automatically used server-side to set the team's institution
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }
      
      const data = await response.json()
      
      // If team creation was successful, submit the application
      if (data.id) {
        // Prepare submission data
        const submissionData = {
          teamId: data.id,
          participationType: 'Team',
          applicationType: 'newTeam',
        }
        
        // Call onSubmit handler with data
        if (onSubmit) {
          await onSubmit(submissionData)
        }
      } else {
        throw new Error('Team created but no team data returned')
      }
    } catch (error) {
      console.error('Error creating team:', error)
      setError(error.message || 'Failed to create team')
      setIsSubmitting(false)
    }
  }
  
  // Handle join team form submission
  const handleJoinTeamSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedTeam) {
      setError('Please select a team')
      return
    }
    
    if (!joinMessage.trim()) {
      setError('Please enter a message to the team')
      return
    }
    
    setError('')
    setIsSubmitting(true)
    
    try {
      // Prepare submission data for joining team
      // For team join requests, the API expects:
      // - teamId or teamToJoin (teamId takes precedence)
      // - joinTeamMessage for the request message
      // - applicationType set to 'joinTeam' to trigger the correct logic
      const submissionData = {
        cohortId: cohort.id,
        participationType: 'Team',
        applicationType: 'joinTeam',
        teamId: selectedTeam.id,
        teamToJoin: selectedTeam.id, // Include for backward compatibility
        joinTeamMessage: joinMessage
      }
      
      // Call onSubmit handler with data
      if (onSubmit) {
        await onSubmit(submissionData)
      }
    } catch (error) {
      console.error('Error submitting join request:', error)
      setError(error.message || 'Failed to submit join request')
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card className={isPage ? 'border-0 shadow-none' : ''}>
      <CardContent className={isPage ? 'px-0' : ''}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Create New Team
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Join Existing Team
            </TabsTrigger>
          </TabsList>
          
          {/* Create Team Tab */}
          <TabsContent value="create" className="pt-2">
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              {error && activeTab === 'create' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamDescription">Team Description</Label>
                <Textarea
                  id="teamDescription"
                  placeholder="Describe your team and its goals..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>
              
              {/* Team Header Image Upload */}
              <div className="space-y-2">
                <Label>Team Header Image (optional)</Label>
                <Dropzone
                  maxFiles={1}
                  maxSize={2 * 1024 * 1024} // 2MB
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'image/gif': ['.gif'],
                    'image/svg+xml': ['.svg'],
                    'image/webp': ['.webp']
                  }}
                  prompt="Drag & drop a header image, or click to browse"
                  subPrompt="PNG, JPG, SVG, WEBP, GIF up to 2MB"
                  onDrop={(file) => setHeaderImage(file)}
                  onFileRemove={() => setHeaderImage(null)}
                  disabled={isSubmitting || isUploading}
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
                <Label htmlFor="teamJoinable" className="text-sm">
                  Allow others to request to join this team
                </Label>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting || isUploading || !teamName.trim()}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Image...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    'Create Team & Apply'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          {/* Join Team Tab */}
          <TabsContent value="join" className="pt-2">
            <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
              {error && activeTab === 'join' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Loading available teams...</p>
                </div>
              ) : joinableTeams.length === 0 ? (
                <div className="text-center py-8">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No teams are currently looking for members. 
                      You can create your own team by switching to the "Create New Team" tab.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <Label>Select a Team to Join</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {joinableTeams.map((team) => (
                        <Card 
                          key={team.id} 
                          className={`cursor-pointer transition-all ${
                            selectedTeam?.id === team.id ? 
                            'ring-2 ring-primary ring-offset-2' : 
                            'hover:border-primary/50'
                          }`}
                          onClick={() => handleTeamSelect(team)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{team.name}</h3>
                                {team.institution && (
                                  <p className="text-xs text-muted-foreground">{team.institution.name}</p>
                                )}
                              </div>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                                {team.memberCount || 0} members
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {team.description || "No description provided"}
                            </p>
                            {team.displayMembers && team.displayMembers.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Members:</span> {team.displayMembers.join(", ")}
                                {team.hasMoreMembers && ` +${team.additionalMembersCount} more`}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  {selectedTeam && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <Label htmlFor="joinMessage" className="text-base font-medium">
                          Why do you want to join this team?
                        </Label>
                        <Textarea
                          id="joinMessage"
                          placeholder="Introduce yourself and explain why you'd like to join this team..."
                          value={joinMessage}
                          onChange={(e) => setJoinMessage(e.target.value)}
                          rows={4}
                          className="mt-2"
                          required
                        />
                      </div>
                      
                      <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !joinMessage.trim()}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Join Request'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default TeamApplicationForm