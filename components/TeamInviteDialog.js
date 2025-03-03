"use client"

import { useState } from "react"
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
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Dialog component for inviting users to a team
 * @param {Object} props - Component props
 * @param {Object} props.team - Team data object
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onTeamUpdated - Callback function when team is updated
 */
const TeamInviteDialog = ({ team, open, onClose, onTeamUpdated }) => {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form data when dialog opens/closes
  const handleOpenChange = (open) => {
    if (!open) {
      resetForm()
      onClose()
    }
  }

  // Reset form data
  const resetForm = () => {
    setEmail("")
    setName("")
    setError("")
    setIsSubmitting(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!team?.id) {
      setError("Team data is missing")
      return
    }
    
    // Validate form data
    if (!email.trim()) {
      setError("Please enter an email address")
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to invite team member")
      }
      
      const data = await response.json()
      
      // Call the callback with the updated team
      if (onTeamUpdated && data.team) {
        onTeamUpdated(data.team)
      }
      
      // Close the dialog and reset the form
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error inviting team member:", error)
      setError(error.message || "Failed to invite team member")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {team?.name || "your team"}.
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
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Name <span className="text-muted-foreground text-sm">(optional)</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                autoComplete="name"
              />
              <p className="text-sm text-muted-foreground">
                If the person doesn't have an account yet, we'll use this name to create their profile.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TeamInviteDialog