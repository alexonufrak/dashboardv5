"use client"

import { useState } from 'react'
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

/**
 * Dialog for creating a new team
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {Function} props.onCreateTeam Callback when team is created with team data
 */
const TeamCreateDialog = ({ open, onClose, onCreateTeam }) => {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate inputs
    if (!teamName.trim()) {
      setError('Please enter a team name')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Make API call to create team
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim()
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create team')
      }
      
      const team = await response.json()
      
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
    } finally {
      setIsSubmitting(false)
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !teamName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TeamCreateDialog