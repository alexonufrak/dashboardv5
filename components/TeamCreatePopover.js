"use client"

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, PlusCircle } from 'lucide-react'

/**
 * Popover for quick team creation
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Trigger element
 * @param {Function} props.onCreateTeam Callback when team is created
 */
const TeamCreatePopover = ({ children, onCreateTeam }) => {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

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
      // Create team API call
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
      
      // Reset form and close popover
      setTeamName('')
      setTeamDescription('')
      setIsOpen(false)
      
      // Call success callback
      if (onCreateTeam) {
        onCreateTeam(team)
      }
    } catch (error) {
      setError(error.message || 'Error creating team')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Create a New Team</h4>
            <p className="text-sm text-muted-foreground">
              Create a team to collaborate with others
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                You can add team members later.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={isSubmitting || !teamName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default TeamCreatePopover