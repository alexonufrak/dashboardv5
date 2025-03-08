"use client"

import { useState } from 'react'
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
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateTeam } from '@/lib/useDataFetching'

/**
 * Dialog for creating a new team
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {Function} props.onCreateTeam Callback when team is created with team data
 * @param {string} props.cohortId Optional cohort ID to associate the team with
 */
const TeamCreateDialog = ({ open, onClose, onCreateTeam, cohortId }) => {
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [error, setError] = useState('')
  
  // Use our createTeam mutation hook
  const createTeamMutation = useCreateTeam()

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
  
  const handleClose = () => {
    // Reset form
    setTeamName('')
    setTeamDescription('')
    setError('')
    
    if (onClose) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
          <DialogDescription>
            Create your team to collaborate with others on projects and challenges.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
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
              onClick={handleClose}
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
      </DialogContent>
    </Dialog>
  )
}

export default TeamCreateDialog