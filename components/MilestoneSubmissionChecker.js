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
    // Enhanced logging for debugging the milestone and team data
    console.log(`Checking submissions for milestone ${milestoneId} with team ${teamData?.id || 'unknown'}`)
    console.log(`Milestone ID type: ${typeof milestoneId}, Team ID type: ${typeof teamData?.id}`)
    
    // Don't do anything if we don't have data or there was an error
    if (!data || error) {
      console.log(`No data or error for milestone ${milestoneId}:`, error || 'No data returned')
      setHasSubmission(false)
      setSubmissionData(null)
      if (onSubmissionCheck) {
        onSubmissionCheck(false, null)
      }
      return
    }
    
    // Enhanced processing for submissions with detailed validation
    let submissions = data.submissions || []
    
    // Apply additional validation to ensure milestoneIds match exactly
    // This helps catch cases where the API might return incorrect matches
    const validatedSubmissions = submissions.filter(sub => {
      // Check for exact match first
      if (sub.milestoneId === milestoneId) {
        return true;
      }
      
      // Check if it's in the rawMilestone field (array or string)
      if (Array.isArray(sub.rawMilestone) && sub.rawMilestone.includes(milestoneId)) {
        console.log(`Found milestone ${milestoneId} in rawMilestone array`);
        return true;
      }
      
      // Final check with requested milestone ID
      if (sub.requestedMilestoneId === milestoneId) {
        console.log(`Submission matches requested milestone ID ${milestoneId}`);
        return true;
      }
      
      // Log mismatches for debugging
      console.log(`Submission ${sub.id} milestone mismatch: 
        - Expected: ${milestoneId}
        - Found: ${sub.milestoneId}
        - Raw: ${JSON.stringify(sub.rawMilestone)}`);
      
      return false;
    });
    
    // Sort submissions to ensure the most recent is first
    // Even though the API should sort, we'll sort again to be certain
    validatedSubmissions.sort((a, b) => {
      // Use submissionTimestamp if available, otherwise parse the createdTime
      const timeA = a.submissionTimestamp || new Date(a.createdTime).getTime();
      const timeB = b.submissionTimestamp || new Date(b.createdTime).getTime();
      return timeB - timeA; // descending order (newest first)
    });
    
    // Log the submissions we found after validation
    console.log(`Found ${validatedSubmissions.length} validated submissions for milestone ${milestoneId} (original count: ${submissions.length})`, 
      validatedSubmissions.length > 0 
        ? `First submission ID: ${validatedSubmissions[0].id}, createdTime: ${validatedSubmissions[0].createdTime}` 
        : 'No submissions after validation'
    )
    
    // Check if any validated submissions exist
    const hasAnySubmission = validatedSubmissions.length > 0
    setHasSubmission(hasAnySubmission)
    
    // If there are validated submissions, use the most recent one
    if (hasAnySubmission) {
      const mostRecentSubmission = validatedSubmissions[0]
      setSubmissionData(mostRecentSubmission)
      console.log(`Using most recent submission from ${mostRecentSubmission.createdTime}`)
    } else {
      setSubmissionData(null)
    }
    
    // Call the callback if provided
    if (onSubmissionCheck) {
      onSubmissionCheck(
        hasAnySubmission, 
        hasAnySubmission ? validatedSubmissions : null
      )
    }
  }, [data, error, onSubmissionCheck, milestoneId, teamData?.id])

  // This component doesn't render anything itself
  return children || null
}