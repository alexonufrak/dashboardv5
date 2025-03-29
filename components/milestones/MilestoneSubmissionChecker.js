"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useTeamSubmissions } from "@/lib/useDataFetching"
import { useQueryClient } from "@tanstack/react-query"

/**
 * Component that checks if a team has submitted for a milestone
 * Simplified implementation that leverages the standardized API response format
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
  // Get global query client for cache management
  const queryClient = useQueryClient();
  
  // Get team data from dashboard context
  const { teamData } = useDashboard();
  
  // Component state
  const [hasSubmission, setHasSubmission] = useState(false);
  
  // Use the standardized team submissions hook
  // This directly fetches submissions for the specific milestone
  const { 
    data,
    isLoading, 
    error,
    refetch
  } = useTeamSubmissions(teamData?.id, milestoneId);
  
  // Listen for submission updates from the MilestoneSubmissionDialog component
  useEffect(() => {
    const handleSubmissionUpdate = (event) => {
      const { milestoneId: updatedMilestoneId, teamId } = event.detail;
      
      // Only process events for this milestone and team
      if (updatedMilestoneId === milestoneId && teamId === teamData?.id) {
        console.log("MilestoneSubmissionChecker: Received submission update event");
        
        // Invalidate the cache and refetch
        queryClient.invalidateQueries({ 
          queryKey: ['submissions', teamId, updatedMilestoneId] 
        });
        
        // Trigger refetch to get fresh data
        refetch();
      }
    };
    
    // Add event listener
    window.addEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    
    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    };
  }, [milestoneId, teamData?.id, refetch, queryClient]);
  
  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Error loading submission data:", error);
    }
  }, [error]);
  
  // Process submission data when it becomes available
  useEffect(() => {
    // Wait for data to be loaded
    if (isLoading || !data) {
      return;
    }
    
    // Get the submissions array
    const submissions = data.submissions || [];
    
    // Process submissions to determine status
    const hasSubmissions = submissions.length > 0;
    setHasSubmission(hasSubmissions);
    
    // Call the callback with results
    if (onSubmissionCheck) {
      onSubmissionCheck(
        hasSubmissions, 
        hasSubmissions ? submissions : null
      );
    }
    
  }, [data, isLoading, onSubmissionCheck]);

  // This component doesn't render anything itself
  return children || null;
}