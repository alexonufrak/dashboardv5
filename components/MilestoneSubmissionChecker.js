"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useTeamSubmissions } from "@/lib/useDataFetching"

/**
 * Component that checks if a team has submitted for a milestone
 * This is a fully rewritten implementation based on the correct Airtable schema relationships
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
  // Component state
  const [hasSubmission, setHasSubmission] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)
  const [hasProcessed, setHasProcessed] = useState(false)
  const [lastTeamId, setLastTeamId] = useState(null)
  const [lastMilestoneId, setLastMilestoneId] = useState(null)
  
  // Get team data from context
  const { teamData } = useDashboard()
  
  // Fetch team submissions using our custom hook
  const { 
    data,
    isLoading, 
    error,
    refetch
  } = useTeamSubmissions(teamData?.id, milestoneId)
  
  // Listen for submission updates from the MilestoneSubmissionDialog component
  useEffect(() => {
    // Event handler for the custom submission updated event
    const handleSubmissionUpdate = (event) => {
      const { milestoneId: updatedMilestoneId, teamId } = event.detail;
      
      // Only process events for this milestone and team
      if (updatedMilestoneId === milestoneId && teamId === teamData?.id) {
        console.log("Received submission update event for this milestone");
        
        // Force a refetch of the submission data
        refetch();
        
        // Reset processed state to force reprocessing 
        setHasProcessed(false);
      }
    };
    
    // Add event listener
    window.addEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    };
  }, [milestoneId, teamData?.id, refetch]);
  
  // Debug logging
  useEffect(() => {
    if (milestoneId && teamData?.id) {
      console.log(`MilestoneSubmissionChecker for milestone=${milestoneId}, team=${teamData.id}`);
    }
    
    // Log when data changes
    if (data) {
      console.log(`Submission data received: ${data.submissions?.length || 0} submissions`);
    }
    
    // Log loading states and errors
    if (isLoading) {
      console.log("Loading submission data...");
    }
    
    if (error) {
      console.error("Error loading submission data:", error);
    }
  }, [milestoneId, teamData?.id, data, isLoading, error]);
  
  // Force reprocessing when team or milestone changes
  useEffect(() => {
    if (teamData?.id !== lastTeamId || milestoneId !== lastMilestoneId) {
      console.log("Team or milestone changed, resetting submission state");
      setLastTeamId(teamData?.id);
      setLastMilestoneId(milestoneId);
      setHasProcessed(false);
      
      // Clear submission data when changing team/milestone
      setHasSubmission(false);
      setSubmissionData(null);
      
      // Force refetch when parameters change
      if (teamData?.id && milestoneId) {
        refetch();
      }
    }
  }, [teamData?.id, milestoneId, lastTeamId, lastMilestoneId, refetch]);
  
  // Process submission data when it becomes available
  useEffect(() => {
    // Skip if still loading
    if (isLoading || !data) {
      return;
    }
    
    // Skip if we don't have both team and milestone IDs
    if (!teamData?.id || !milestoneId) {
      return;
    }
    
    console.log(`Processing submissions for milestone ${milestoneId}`);
    
    // Mark as processed
    setHasProcessed(true);
    
    // Get relevant submissions data
    const submissions = data.submissions || [];
    
    // Add detailed diagnostic logging
    console.log("Available submissions:", JSON.stringify(submissions.map(s => ({
      id: s.id,
      milestoneId: s.milestoneId,
      createdTime: s.createdTime?.substring(0, 10) || null
    }))));
    
    // First try to find submissions specifically linked to this milestone
    const milestoneMatches = submissions.filter(s => 
      s.milestoneId === milestoneId || 
      s.milestone?.id === milestoneId ||
      (s.milestone && (s.milestone.id === milestoneId || s.milestone.recordId === milestoneId))
    );
    
    if (milestoneMatches.length > 0) {
      console.log(`Found ${milestoneMatches.length} direct milestone matches for ${milestoneId}`);
      setHasSubmission(true);
      setSubmissionData(milestoneMatches[0]);
      
      // Call the callback with results
      if (onSubmissionCheck) {
        onSubmissionCheck(true, milestoneMatches);
      }
      return;
    }
    
    // If no specific milestone matches, try by milestone name if available
    if (submissions.length > 0) {
      // Try to get the milestone name from one of the component parents
      const milestoneNameMatches = submissions.filter(s => {
        if (s.milestoneName && s.milestone?.name) {
          // Match by name if available
          return s.milestoneName === s.milestone.name;
        }
        return false;
      });
      
      if (milestoneNameMatches.length > 0) {
        console.log(`Found ${milestoneNameMatches.length} milestone name matches`);
        setHasSubmission(true);
        setSubmissionData(milestoneNameMatches[0]);
        
        // Call the callback with results
        if (onSubmissionCheck) {
          onSubmissionCheck(true, milestoneNameMatches);
        }
        return;
      }
    }
    
    // Last resort - if no direct matches but we have submissions, assume the most recent is relevant
    // This is a fallback for when milestone relationships aren't properly set
    if (submissions.length > 0) {
      console.log(`Using fallback: ${submissions.length} team submissions (no direct milestone links)`);
      setHasSubmission(true);
      setSubmissionData(submissions[0]);
      
      // Call the callback with results
      if (onSubmissionCheck) {
        onSubmissionCheck(true, submissions);
      }
      return;
    }
    
    // If no submissions found at all
    console.log("No submissions found for this milestone");
    setHasSubmission(false);
    setSubmissionData(null);
    
    // Call the callback with negative result
    if (onSubmissionCheck) {
      onSubmissionCheck(false, null);
    }
  }, [data, isLoading, hasProcessed, teamData?.id, milestoneId, onSubmissionCheck]);

  // This component doesn't render anything itself
  return children || null;
}