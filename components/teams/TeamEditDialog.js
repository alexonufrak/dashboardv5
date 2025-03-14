"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateTeamData } from "@/lib/useDataFetching"

/**
 * Dialog component for editing team details
 * @param {Object} props - Component props
 * @param {Object} props.team - Team data object
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onTeamUpdated - Callback function when team is updated
 */
const TeamEditDialog = ({ team, open, onClose, onTeamUpdated }) => {
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form data when team changes
  useEffect(() => {
    if (team) {
      setTeamName(team.name || "")
      setTeamDescription(team.description || "")
    }
  }, [team])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!team?.id) {
      setError("Missing team ID")
      return
    }
    
    // Validate form data
    if (!teamName.trim()) {
      setError("Please enter a team name")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      // Create local copy of updated team data to use immediately
      // This makes UI updates immediate without waiting for refresh
      const updatedTeamLocal = {
        ...team,
        name: teamName,
        description: teamDescription
      }
      
      // Call the update function from our data fetching layer
      await updateTeamData(
        team.id, 
        { name: teamName, description: teamDescription },
        queryClient
      )
      
      // Call the onTeamUpdated callback if provided, with local data for immediate UI update
      if (typeof onTeamUpdated === 'function') {
        onTeamUpdated(updatedTeamLocal)
      }
      
      // Close the dialog
      if (typeof onClose === 'function') {
        onClose()
      }
    } catch (error) {
      console.error("Error updating team:", error)
      setError(error.message || "Failed to update team")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog open state changes
  const handleOpenChange = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update your team's details below
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="teamDescription">Description</Label>
              <Textarea
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Enter team description (optional)"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TeamEditDialog