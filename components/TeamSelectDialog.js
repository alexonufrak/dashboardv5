"use client"

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, PlusCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import TeamCreateDialog from './TeamCreateDialog'

/**
 * Dialog for selecting or creating a team for an application
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {Function} props.onSubmit Callback when application is submitted with selected team
 * @param {Object} props.cohort The cohort details for this application
 * @param {Array} props.teams List of user's teams
 */
const TeamSelectDialog = ({ open, onClose, onSubmit, cohort, teams = [] }) => {
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false)
  const [userTeams, setUserTeams] = useState(teams)
  
  // Fetch user's teams if not provided
  useEffect(() => {
    const fetchTeams = async () => {
      if (teams && teams.length > 0) {
        setUserTeams(teams)
        return
      }
      
      try {
        const response = await fetch('/api/teams')
        if (response.ok) {
          const data = await response.json()
          setUserTeams(data.teams || [])
          
          // If user has only one team, select it by default
          if (data.teams?.length === 1) {
            setSelectedTeamId(data.teams[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
      }
    }
    
    if (open) {
      fetchTeams()
    }
  }, [open, teams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate selection
    if (!selectedTeamId) {
      setError('Please select a team')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Create the application with the selected team
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cohortId: cohort.id,
          teamId: selectedTeamId
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }
      
      const application = await response.json()
      
      // Call the success callback
      if (onSubmit) {
        onSubmit(application)
      }
      
      // Reset and close
      setSelectedTeamId('')
      if (onClose) {
        onClose()
      }
    } catch (error) {
      setError(error.message || 'An error occurred while submitting your application')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleTeamCreated = (newTeam) => {
    // Add the new team to the user's teams list
    setUserTeams(prevTeams => [...prevTeams, newTeam])
    
    // Select the newly created team
    setSelectedTeamId(newTeam.id)
    
    // Close the create team dialog
    setShowCreateTeamDialog(false)
  }
  
  const handleOpenCreateTeam = () => {
    setShowCreateTeamDialog(true)
  }
  
  const handleClose = () => {
    // Reset states
    setSelectedTeamId('')
    setError('')
    
    if (onClose) {
      onClose()
    }
  }

  // Extract initiative details
  const initiativeName = cohort?.initiativeDetails?.name || "Program Application"
  const initiativeDescription = cohort?.initiativeDetails?.description || ""
  const topics = cohort?.topicNames || []
  const classNames = cohort?.classNames || []
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{initiativeName}</DialogTitle>
            <DialogDescription>
              {initiativeDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-wrap gap-2 my-2">
            {topics.map((topic, index) => (
              <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800">
                {topic}
              </Badge>
            ))}
            
            {classNames.map((className, index) => (
              <Badge key={`class-${index}`} variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">
                {className}
              </Badge>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="teamSelect" className="text-sm font-medium">
                Select your team <span className="text-red-500">*</span>
              </label>
              
              {userTeams.length > 0 ? (
                <Select 
                  value={selectedTeamId} 
                  onValueChange={setSelectedTeamId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create_new" className="text-primary font-medium">
                      <span className="flex items-center">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create new team
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You don't have any teams yet. Create a team to continue.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenCreateTeam}
                    className="w-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create a new team
                  </Button>
                </div>
              )}
            </div>
            
            {selectedTeamId === 'create_new' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenCreateTeam}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create a new team
              </Button>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedTeamId || selectedTeamId === 'create_new'}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <TeamCreateDialog 
        open={showCreateTeamDialog}
        onClose={() => setShowCreateTeamDialog(false)}
        onCreateTeam={handleTeamCreated}
      />
    </>
  )
}

export default TeamSelectDialog