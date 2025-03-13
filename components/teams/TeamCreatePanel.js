"use client"

import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

/**
 * Panel component for creating a new team
 */
const TeamCreatePanel = ({ onTeamCreated, profile, cohortId }) => {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!teamName.trim()) {
      setError('Team name is required')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Call API to create team
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          institutionId: profile?.institution?.id,
          cohortId: cohortId // If provided, associate with this cohort
        })
      })
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }
      
      const data = await response.json()
      
      // Call the onTeamCreated callback with the new team data
      if (onTeamCreated && data.team) {
        onTeamCreated(data.team)
      }
    } catch (err) {
      console.error('Error creating team:', err)
      setError(err.message || 'Failed to create team')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
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
        />
      </div>
      
      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Team...
            </>
          ) : (
            'Create Team'
          )}
        </Button>
      </div>
    </form>
  )
}

export default TeamCreatePanel