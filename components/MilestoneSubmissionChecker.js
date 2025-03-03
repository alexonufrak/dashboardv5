"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"

/**
 * Component that checks if a team has submitted for a milestone
 * 
 * @param {Object} props - Component props
 * @param {string} props.milestoneId - The ID of the milestone to check
 * @param {string} props.deliverableId - Optional deliverable ID if checking specific deliverable
 * @param {Function} props.onSubmissionCheck - Callback function that receives submission status
 * @param {React.ReactNode} props.children - Child components (not typically used)
 */
export default function MilestoneSubmissionChecker({ 
  milestoneId, 
  deliverableId, 
  onSubmissionCheck,
  children 
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSubmission, setHasSubmission] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)
  const { teamData } = useDashboard()

  useEffect(() => {
    async function checkSubmission() {
      if (!milestoneId || !teamData?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Build the query URL with or without deliverable ID
        let url = `/api/teams/${teamData.id}/submissions?milestoneId=${milestoneId}`
        if (deliverableId) {
          url += `&deliverableId=${deliverableId}`
        }

        const response = await fetch(url)
        
        if (!response.ok) {
          console.error("Failed to check submissions:", response.statusText)
          setHasSubmission(false)
          setSubmissionData(null)
          if (onSubmissionCheck) {
            onSubmissionCheck(false, null)
          }
          return
        }

        const data = await response.json()
        
        // Check if any submissions exist
        const hasAnySubmission = data.submissions && data.submissions.length > 0
        setHasSubmission(hasAnySubmission)
        
        // If there are submissions, store the most recent one
        if (hasAnySubmission) {
          // Sort submissions by creation date (most recent first)
          const sortedSubmissions = [...data.submissions].sort((a, b) => {
            return new Date(b.createdTime) - new Date(a.createdTime)
          })
          
          setSubmissionData(sortedSubmissions[0])
        } else {
          setSubmissionData(null)
        }
        
        // Call the callback if provided
        if (onSubmissionCheck) {
          onSubmissionCheck(
            hasAnySubmission, 
            hasAnySubmission ? data.submissions : null
          )
        }
      } catch (error) {
        console.error("Error checking submission status:", error)
        setHasSubmission(false)
        setSubmissionData(null)
        if (onSubmissionCheck) {
          onSubmissionCheck(false, null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    checkSubmission()
  }, [milestoneId, deliverableId, teamData?.id, onSubmissionCheck])

  // This component doesn't render anything itself
  return children || null
}