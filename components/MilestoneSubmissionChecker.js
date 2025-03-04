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
  
  // Keep track of whether we've processed this milestone already
  const [hasProcessed, setHasProcessed] = useState(false);
  
  // Track if team data changes
  const [lastTeamId, setLastTeamId] = useState(teamData?.id);
  
  // Force reprocessing if team ID changes
  useEffect(() => {
    if (teamData?.id !== lastTeamId) {
      setLastTeamId(teamData?.id);
      setHasProcessed(false);
    }
  }, [teamData?.id, lastTeamId]);
  
  // Simplified implementation that always returns no submissions
  useEffect(() => {
    // Skip if we've already processed this milestone/team combination
    if (hasProcessed) {
      return;
    }
    
    // Mark as processed to prevent further checks
    setHasProcessed(true);
    
    // We are not fetching submissions at this time, so always return false
    setHasSubmission(false);
    setSubmissionData(null);
    
    // Call the callback with empty results
    if (onSubmissionCheck) {
      onSubmissionCheck(false, null);
    }
  }, [hasProcessed, onSubmissionCheck])

  // This component doesn't render anything itself
  return children || null
}