"use client"

import { useState } from "react"
import { useQueryClient } from '@tanstack/react-query'
import { Button } from "@heroui/button"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react"
import { Input } from "@heroui/input"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@heroui/react"
import { toast } from "sonner"
import { Team } from "@/types/dashboard"

/**
 * Dialog component for inviting users to a team
 * @param {Object} props - Component props
 * @param {Team} props.team - Team data object
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onTeamUpdated - Callback function when team is updated
 */
const TeamInviteDialog = ({ 
  team, 
  isOpen, 
  onClose, 
  onTeamUpdated 
}: { 
  team: Team; 
  isOpen: boolean; 
  onClose: () => void; 
  onTeamUpdated?: (team: Team) => void;
}) => {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingDomain, setIsCheckingDomain] = useState(false)
  const [isValidDomain, setIsValidDomain] = useState(false)
  const [institutionInfo, setInstitutionInfo] = useState<any>(null)
  const [isVerified, setIsVerified] = useState(false)

  // Function to handle dialog open/close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    // For debugging only - skip verification in development
    // Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      // In development, we'll allow bypassing verification
      console.log("Development mode: Bypassing email verification");
    } else {
      // In production, enforce verification
      // Make sure email is verified and domain is valid
      if (!isVerified) {
        setError("Please verify the email domain first")
        return
      }
      
      if (!isValidDomain) {
        setError("Cannot invite team members from different institutions")
        return
      }
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const inviteData = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        institutionId: institutionInfo?.institutionId || null,
        institutionName: institutionInfo?.institution || null,
        createInviteToken: true,
      }
      
      // Use our centralized invitation method with automatic cache invalidation
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to send invitation")
      }
      
      const data = await response.json()
      
      // Invalidate teams cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      
      // Call the callback with the updated team
      if (typeof onTeamUpdated === 'function' && data.team) {
        onTeamUpdated(data.team)
      }
      
      // Show success message
      toast.success(`Invitation sent to ${firstName} ${lastName}`, {
        description: `An invitation to join ${team?.name || "your team"} has been sent to ${email}.`,
        duration: 5000,
      })
      
      // Close the dialog and reset the form
      resetForm()
      if (typeof onClose === 'function') {
        onClose()
      }
    } catch (error: any) {
      console.error("Error inviting team member:", error)
      setError(error.message || "Failed to invite team member")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <ModalContent>
        {(onModalClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">Invite Team Member</h3>
                <p className="text-sm text-default-500">
                  Send an invitation to join {team?.name || "your team"}.
                </p>
              </div>
            </ModalHeader>
            
            <ModalBody>
              {error && (
                <Alert variant="danger" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {warning && (
                <Alert variant="warning" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              )}
              
              {isVerified && isValidDomain && (
                <Alert variant="success" className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email verified from {institutionInfo?.institution || "valid institution"}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onValueChange={setEmail}
                      placeholder="Enter email address"
                      required
                      autoComplete="email"
                    />
                    <Button 
                      type="button" 
                      onPress={verifyEmailDomain} 
                      isDisabled={isCheckingDomain || !email}
                      className="whitespace-nowrap"
                    >
                      {isCheckingDomain ? "Checking..." : "Verify Email"}
                    </Button>
                  </div>
                  {isCheckingDomain && (
                    <p className="text-xs text-default-500 mt-1">Checking institution...</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onValueChange={setFirstName}
                      placeholder="First name"
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onValueChange={setLastName}
                      placeholder="Last name"
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-default-500">
                  All team members must have email addresses from the same institution.
                </p>
              </div>
            </ModalBody>
            
            <ModalFooter>
              <Button type="button" variant="outline" onPress={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                color="primary"
                isDisabled={isSubmitting || (!isVerified && process.env.NODE_ENV !== 'development')}
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}

export default TeamInviteDialog