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
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

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
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingDomain, setIsCheckingDomain] = useState(false)
  const [isValidDomain, setIsValidDomain] = useState(false)
  const [institutionInfo, setInstitutionInfo] = useState(null)
  const [isVerified, setIsVerified] = useState(false)

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
    setFirstName("")
    setLastName("")
    setError("")
    setWarning("")
    setIsSubmitting(false)
    setIsCheckingDomain(false)
    setIsValidDomain(false)
    setInstitutionInfo(null)
    setIsVerified(false)
  }
  
  // Verify the email domain matches the team institution
  const verifyEmailDomain = async () => {
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    
    setError("")
    setWarning("")
    setIsCheckingDomain(true)
    setIsVerified(false)
    
    try {
      const response = await fetch(`/api/user/check-email?email=${encodeURIComponent(email)}`)
      
      if (!response.ok) {
        setError("Error verifying email domain")
        return
      }
      
      const data = await response.json()
      setInstitutionInfo(data)
      setIsVerified(true)
      
      // If there's a domain mismatch, show a warning and prevent submission
      if (data.mismatch) {
        setWarning(`This email is from ${data.institution || 'a different institution'}, which doesn't match your team's institution. You cannot invite members from other institutions.`)
        setIsValidDomain(false)
      } else if (data.institution) {
        // Email domain matched an institution
        setIsValidDomain(true)
      } else {
        // Email domain didn't match any known institution
        setWarning("This email domain doesn't match any recognized institution. Please verify the email is correct.")
        setIsValidDomain(false)
      }
    } catch (error) {
      console.error("Error checking email domain:", error)
      setError("Failed to verify email domain")
    } finally {
      setIsCheckingDomain(false)
    }
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
    
    if (!firstName.trim()) {
      setError("Please enter a first name")
      return
    }
    
    if (!lastName.trim()) {
      setError("Please enter a last name")
      return
    }
    
    // Make sure email is verified and domain is valid
    if (!isVerified) {
      setError("Please verify the email domain first")
      return
    }
    
    if (!isValidDomain) {
      setError("Cannot invite team members from different institutions")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      // Make the request with institution info
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          institutionId: institutionInfo?.institutionId || null,
          institutionName: institutionInfo?.institution || null,
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
      
      // Show success message
      toast.success(`Invitation sent to ${firstName} ${lastName}`, {
        description: `An invitation to join ${team?.name || "your team"} has been sent to ${email}.`,
        duration: 5000,
      })
      
      // Close the dialog and reset the form
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error inviting team member:", error)
      setError(error.message || "Failed to invite team member")
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
          
          {warning && (
            <Alert className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          {isVerified && isValidDomain && (
            <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Email verified from {institutionInfo?.institution || "valid institution"}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    // Clear verification when email changes
                    if (isVerified) {
                      setIsVerified(false)
                      setIsValidDomain(false)
                      setWarning("")
                    }
                  }}
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                />
                <Button 
                  type="button" 
                  onClick={verifyEmailDomain} 
                  disabled={isCheckingDomain || !email}
                  className="whitespace-nowrap"
                >
                  {isCheckingDomain ? "Checking..." : "Verify Email"}
                </Button>
              </div>
              {isCheckingDomain && (
                <p className="text-xs text-muted-foreground mt-1">Checking institution...</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                  autoComplete="given-name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              All team members must have email addresses from the same institution.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isVerified || !isValidDomain}
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TeamInviteDialog