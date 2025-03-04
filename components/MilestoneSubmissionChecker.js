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
  
  // Process the submissions data when fetched (but only once per milestone/team combination)
  useEffect(() => {
    // Skip if we've already processed this milestone/team combination or don't have data yet
    // This prevents an infinite re-render loop
    if (hasProcessed || isLoading) {
      return;
    }
    
    // Mark as processed to prevent further checks
    setHasProcessed(true);
    
    // More concise logging to prevent console flooding
    console.log(`Initial submission check for milestone ${milestoneId.slice(0, 8)}... (team ${teamData?.id?.slice(0, 8)}...)`)
    
    // Don't do anything if we don't have data or there was an error
    if (!data || error) {
      // Concise error logging
      if (error) {
        console.error(`Error fetching submissions for milestone ${milestoneId.slice(0, 8)}...`, error);
      }
      
      setHasSubmission(false)
      setSubmissionData(null)
      if (onSubmissionCheck) {
        onSubmissionCheck(false, null)
      }
      return
    }
    
    // Enhanced processing with minimal logging to prevent console flooding
    let submissions = data.submissions || [];
    
    // Apply validation to ensure milestoneIds match exactly
    const validatedSubmissions = submissions.filter(sub => {
      // Check exact match first
      if (sub.milestoneId === milestoneId) {
        return true;
      }
      
      // Check rawMilestone field
      if (Array.isArray(sub.rawMilestone) && sub.rawMilestone.includes(milestoneId)) {
        return true;
      }
      
      // Check requested milestone ID
      if (sub.requestedMilestoneId === milestoneId) {
        return true;
      }
      
      return false;
    });
    
    // Sort submissions to ensure most recent first
    validatedSubmissions.sort((a, b) => {
      const timeA = a.submissionTimestamp || new Date(a.createdTime).getTime();
      const timeB = b.submissionTimestamp || new Date(b.createdTime).getTime();
      return timeB - timeA; // newest first
    });
    
    // Only log if we found submissions or need to log once for debugging
    if (validatedSubmissions.length > 0) {
      console.log(`Found ${validatedSubmissions.length} submissions for milestone ${milestoneId.slice(0, 8)}...`);
    }
    
    // Process submission status
    const hasAnySubmission = validatedSubmissions.length > 0;
    setHasSubmission(hasAnySubmission);
    
    // Update submission data
    if (hasAnySubmission) {
      const mostRecentSubmission = validatedSubmissions[0];
      setSubmissionData(mostRecentSubmission);
    } else {
      setSubmissionData(null);
    }
    
    // Call the callback with results
    if (onSubmissionCheck) {
      onSubmissionCheck(
        hasAnySubmission, 
        hasAnySubmission ? validatedSubmissions : null
      );
    }
  }, [data, error, onSubmissionCheck, milestoneId, teamData?.id, isLoading, hasProcessed])

  // This component doesn't render anything itself
  return children || null
}