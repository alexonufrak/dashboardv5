"use client"

import { useState, useEffect, useRef } from "react"
import { useDashboard } from "@/contexts/DashboardContext"

// Create a global cache to store submission check results
// This prevents duplicate API calls across components and page navigations
const submissionCache = new Map();

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
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmission, setHasSubmission] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)
  const { teamData } = useDashboard()
  
  // Create a cache key for this specific milestone/team combination
  const cacheKey = `${teamData?.id || 'unknown'}-${milestoneId}-${deliverableId || 'none'}`;
  
  // Track if the API call is in progress to prevent duplicate calls
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Don't do anything if we don't have milestone ID or team data
    if (!milestoneId || !teamData?.id) {
      return;
    }
    
    // Check if we already have cached results
    if (submissionCache.has(cacheKey)) {
      const cachedData = submissionCache.get(cacheKey);
      
      // Use cached data and call the callback
      setHasSubmission(cachedData.hasSubmission);
      setSubmissionData(cachedData.submissionData);
      
      if (onSubmissionCheck) {
        onSubmissionCheck(
          cachedData.hasSubmission,
          cachedData.submissions
        );
      }
      return;
    }
    
    // If loading is already in progress, don't start another request
    if (isLoadingRef.current) {
      return;
    }
    
    async function checkSubmission() {
      isLoadingRef.current = true;
      setIsLoading(true);
      
      try {
        // Build the query URL with or without deliverable ID
        let url = `/api/teams/${teamData.id}/submissions?milestoneId=${milestoneId}`
        if (deliverableId) {
          url += `&deliverableId=${deliverableId}`
        }
        
        // Add timestamp to prevent caching
        url += `&_t=${new Date().getTime()}`

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
        
        let mostRecentSubmission = null;
        
        // If there are submissions, get the most recent one
        if (hasAnySubmission) {
          // Sort submissions by creation date (most recent first)
          const sortedSubmissions = [...data.submissions].sort((a, b) => {
            return new Date(b.createdTime) - new Date(a.createdTime)
          })
          
          mostRecentSubmission = sortedSubmissions[0];
          setSubmissionData(mostRecentSubmission)
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
        
        // Cache the results
        submissionCache.set(cacheKey, {
          hasSubmission: hasAnySubmission,
          submissionData: mostRecentSubmission,
          submissions: hasAnySubmission ? data.submissions : null,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error("Error checking submission status:", error)
        setHasSubmission(false)
        setSubmissionData(null)
        if (onSubmissionCheck) {
          onSubmissionCheck(false, null)
        }
      } finally {
        setIsLoading(false)
        isLoadingRef.current = false;
      }
    }

    // Only execute if not in cache and not currently loading
    if (!submissionCache.has(cacheKey) && !isLoadingRef.current) {
      checkSubmission();
    }
  }, [cacheKey, milestoneId, deliverableId, teamData?.id, onSubmissionCheck])

  // This component doesn't render anything itself
  return children || null
}