import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

/**
 * Hook for sending emails via the API
 */
export function useEmail() {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  /**
   * Send an email using a specific template
   * 
   * @param {string} templateType - The template file name without extension (e.g., 'welcome-email')
   * @param {Object} templateData - Data to pass to the email template
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} from - Optional sender email address 
   */
  const sendEmailMutation = useMutation({
    mutationFn: async ({ templateType, templateData, to, subject, from }) => {
      setIsLoading(true)
      setError(null)
      setIsSuccess(false)
      
      try {
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateType,
            templateData,
            to,
            subject,
            from
          }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send email')
        }
        
        setIsSuccess(true)
        return data
      } catch (err) {
        setError(err.message || 'An error occurred while sending the email')
        throw err
      } finally {
        setIsLoading(false)
      }
    }
  })

  /**
   * Send a team invitation email
   * 
   * @param {Object} options - Invitation options
   * @param {string} options.email - Recipient email address
   * @param {string} options.firstName - Recipient's first name
   * @param {string} options.lastName - Recipient's last name (optional)
   * @param {string} options.teamId - ID of the team the user is invited to
   * @param {string} options.inviteUrl - URL to accept the invitation
   */
  const sendTeamInviteMutation = useMutation({
    mutationFn: async ({ email, firstName, lastName, teamId, inviteUrl }) => {
      setIsLoading(true)
      setError(null)
      setIsSuccess(false)
      
      try {
        const response = await fetch('/api/email/send-team-invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            teamId,
            inviteUrl
          }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send team invitation email')
        }
        
        setIsSuccess(true)
        return data
      } catch (err) {
        setError(err.message || 'An error occurred while sending the team invitation email')
        throw err
      } finally {
        setIsLoading(false)
      }
    }
  })

  return {
    sendEmail: sendEmailMutation.mutateAsync,
    sendTeamInvite: sendTeamInviteMutation.mutateAsync,
    isLoading: isLoading || sendEmailMutation.isPending || sendTeamInviteMutation.isPending,
    error,
    isSuccess,
    resetState: () => {
      setError(null)
      setIsSuccess(false)
    }
  }
}