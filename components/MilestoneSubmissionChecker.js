"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useTeamSubmissions } from "@/lib/useDataFetching"

/**
 * Component that checks if a team has submitted for a milestone
 * 
 * @param {Object} props - Component props
 * @param {string} props.milestoneId - The ID of the milestone to check
 * @param {Function} props.onSubmissionCheck - Callback function that receives submission status
 * @param {React.ReactNode} props.children - Child components (not typically used)
 */
export default function MilestoneSubmissionChecker({ 
  milestoneId, 
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
    
    // Get all submissions directly linked to this milestone
    // Since API already sorts by created time desc, we can trust the order
    let submissions = data.submissions || []
    
    // Check if any submissions exist
    const hasAnySubmission = submissions.length > 0
    setHasSubmission(hasAnySubmission)
    
    // If there are submissions, the first one is already the most recent
    // thanks to the API sort order (Created Time desc)
    if (hasAnySubmission) {
      const mostRecentSubmission = submissions[0]
      setSubmissionData(mostRecentSubmission)
    } else {
      setSubmissionData(null)
    }
    
    // Call the callback if provided
    if (onSubmissionCheck) {
      onSubmissionCheck(
        hasAnySubmission, 
        hasAnySubmission ? submissions : null
      )
    }
  }, [data, error, onSubmissionCheck])

  // This component doesn't render anything itself
  return children || null
}