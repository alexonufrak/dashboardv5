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
    // Skip if already processed or still loading
    if (hasProcessed || isLoading || !data) {
      return;
    }
    
    // Skip if we don't have both team and milestone IDs
    if (!teamData?.id || !milestoneId) {
      return;
    }
    
    console.log(`Processing submissions for milestone ${milestoneId}`);
    
    // Mark as processed to prevent repeated processing
    setHasProcessed(true);
    
    // Get relevant submissions data
    const submissions = data.submissions || [];
    
    // Add detailed diagnostic logging
    console.log("Available submissions:", JSON.stringify(submissions.map(s => ({
      id: s.id,
      milestoneId: s.milestoneId,
      createdTime: s.createdTime?.substring(0, 10) || null
    }))));
    
    // First, check for direct milestone matches using the Milestone field
    // (According to AIRTABLE_SCHEMA.md, Submissions has a direct link to Milestones)
    const directMatches = submissions.filter(submission => {
      // Handle exact match
      if (submission.milestoneId === milestoneId) {
        return true;
      }
      
      // Handle array of milestone IDs
      if (Array.isArray(submission.milestoneId) && submission.milestoneId.includes(milestoneId)) {
        return true;
      }
      
      // Handle special case for milestone fields
      if (submission.fields && submission.fields.Milestone) {
        if (Array.isArray(submission.fields.Milestone)) {
          return submission.fields.Milestone.includes(milestoneId);
        } else if (submission.fields.Milestone === milestoneId) {
          return true;
        }
      }
      
      // No matches
      return false;
    });
    
    if (directMatches.length > 0) {
      console.log(`Found ${directMatches.length} direct milestone matches`);
      setHasSubmission(true);
      setSubmissionData(directMatches[0]);
      
      // Call the callback with results
      if (onSubmissionCheck) {
        onSubmissionCheck(true, directMatches);
      }
      return;
    }
    
    // If no direct matches, check if any submissions exist for the team
    // This is a fallback for when proper milestone relationships aren't set
    if (submissions.length > 0) {
      console.log(`Found ${submissions.length} team submissions (no direct milestone links)`);
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