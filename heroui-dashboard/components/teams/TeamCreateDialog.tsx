"use client"

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Textarea
} from '@heroui/react'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@heroui/react'
import { createTeam } from '@/lib/useDataFetching'
import { Team } from '@/types/dashboard'

interface TeamCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam?: (team: Team) => void;
  cohortId?: string;
}

/**
 * Dialog for creating a new team
 */
const TeamCreateDialog = ({ 
  isOpen, 
  onClose, 
  onCreateTeam, 
  cohortId 
}: TeamCreateDialogProps) => {
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!teamName.trim()) {
      setError('Please enter a team name')
      return
    }
    
    setError('')
    setIsSubmitting(true)
    
    try {
      // Prepare team data
      const teamData = {
        name: teamName.trim(),
        description: teamDescription.trim()
      }
      
      // Call our create team function
      const team = await createTeam(teamData, cohortId, queryClient)
      
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
    } catch (error: any) {
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
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        {(closeModal) => (
          <>
            <ModalHeader>
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">Create a New Team</h3>
                <p className="text-sm text-default-500">
                  Create your team to collaborate with others on projects and challenges.
                </p>
              </div>
            </ModalHeader>
            
            <ModalBody>
              <form id="create-team-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                {error && (
                  <Alert variant="danger">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="teamName" className="text-sm font-medium">
                    Team Name <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onValueChange={setTeamName}
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
                    onValueChange={setTeamDescription}
                    placeholder="Briefly describe your team (optional)"
                    minRows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-default-500 mt-1">
                    Note: You can add team members after creating your team.
                  </p>
                </div>
              </form>
            </ModalBody>
            
            <ModalFooter>
              <Button 
                type="button" 
                variant="outline" 
                onPress={handleClose}
                isDisabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="create-team-form"
                color="primary"
                isDisabled={isSubmitting || !teamName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default TeamCreateDialog