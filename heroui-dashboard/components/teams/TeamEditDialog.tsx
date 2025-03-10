"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@heroui/button"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react"
import { Input } from "@heroui/input"
import { Textarea } from "@heroui/react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@heroui/react"
import { toast } from "sonner"
import { Team } from "@/types/dashboard"
import { updateTeamData } from "@/lib/useDataFetching"

/**
 * Dialog component for editing team details
 */
const TeamEditDialog = ({ 
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      
      // Show success message
      toast.success("Team updated successfully", {
        description: `Your team details have been updated.`,
        duration: 3000,
      })
      
      // Close the dialog
      if (typeof onClose === 'function') {
        onClose()
      }
    } catch (error: any) {
      console.error("Error updating team:", error)
      setError(error.message || "Failed to update team")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog open state changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <ModalContent>
        {(onModalClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">Edit Team</h3>
                <p className="text-sm text-default-500">
                  Update your team's details below
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
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Team Name <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onValueChange={setTeamName}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="teamDescription" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="teamDescription"
                    value={teamDescription}
                    onValueChange={setTeamDescription}
                    placeholder="Enter team description (optional)"
                    minRows={4}
                  />
                </div>
              </div>
            </ModalBody>
            
            <ModalFooter>
              <Button type="button" variant="outline" onPress={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                color="primary"
                isDisabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}

export default TeamEditDialog