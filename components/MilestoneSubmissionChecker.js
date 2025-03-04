"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useTeamSubmissions } from "@/lib/useDataFetching"

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
  const [hasSubmission, setHasSubmission] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)
  const { teamData } = useDashboard()
  
  // Use our custom hook to fetch and cache submissions data
  const { 
    data, 
    isLoading, 
    error 
  } = useTeamSubmissions(teamData?.id, milestoneId)
  
  // Process the submissions data whenever it changes
  useEffect(() => {
    // Don't do anything if we don't have data or there was an error
    if (!data || error) {
      setHasSubmission(false)
      setSubmissionData(null)
      if (onSubmissionCheck) {
        onSubmissionCheck(false, null)
      }
      return
    }
    
    // Get all submissions, no need to filter by deliverableId anymore
    // since we're now directly linking milestones to submissions
    let filteredSubmissions = data.submissions || []
    
    // Check if any submissions exist
    const hasAnySubmission = filteredSubmissions.length > 0
    setHasSubmission(hasAnySubmission)
    
    // If there are submissions, get the most recent one
    if (hasAnySubmission) {
      // Sort submissions by creation date (most recent first)
      const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
        return new Date(b.createdTime) - new Date(a.createdTime)
      })
      
      const mostRecentSubmission = sortedSubmissions[0]
      setSubmissionData(mostRecentSubmission)
    } else {
      setSubmissionData(null)
    }
    
    // Call the callback if provided
    if (onSubmissionCheck) {
      onSubmissionCheck(
        hasAnySubmission, 
        hasAnySubmission ? filteredSubmissions : null
      )
    }
  }, [data, error, deliverableId, onSubmissionCheck])

  // This component doesn't render anything itself
  return children || null
}