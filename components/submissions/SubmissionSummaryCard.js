"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileCheck, FileX, Calendar, BarChart, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDashboard } from "@/contexts/DashboardContext"
import { useTeamSubmissions } from "@/lib/useDataFetching"
import MilestoneSubmissionChecker from "@/components/milestones/MilestoneSubmissionChecker"

export default function SubmissionSummaryCard({ submissions: initialSubmissions = [], milestones = [] }) {
  const { teamData } = useDashboard()
  const [processedMilestones, setProcessedMilestones] = useState([])
  const [submissionsByMilestone, setSubmissionsByMilestone] = useState({})
  const [allSubmissions, setAllSubmissions] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Listen for submission updates
  useEffect(() => {
    // Event handler for submission updates
    const handleSubmissionUpdate = (event) => {
      const { milestoneId, teamId, submissions } = event.detail;
      
      // Make sure this event is for our team
      if (teamData?.id && teamId && teamData.id !== teamId) {
        return;
      }
      
      console.log(`SubmissionSummaryCard received update for milestone: ${milestoneId}`);
      
      // Update our submissions list
      if (submissions && submissions.length > 0) {
        // Add the new submissions to our tracking
        setAllSubmissions(prev => {
          // Filter out any existing submissions for this milestone
          const filtered = prev.filter(s => 
            !submissions.some(newSub => newSub.id === s.id)
          );
          
          // Add the new submissions
          return [...filtered, ...submissions];
        });
        
        // Update the submissions by milestone mapping
        setSubmissionsByMilestone(prev => ({
          ...prev,
          [milestoneId]: submissions
        }));
        
        // Update the milestone in our processed list
        setProcessedMilestones(prev => 
          prev.map(m => {
            if (m.id === milestoneId) {
              return {
                ...m,
                hasSubmission: true,
                status: "completed",
                submissions: submissions
              };
            }
            return m;
          })
        );
        
        // Trigger a refresh
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    // Add event listener
    window.addEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    };
  }, [teamData?.id]);
  
  // Initialize processed milestones
  useEffect(() => {
    if (milestones && milestones.length > 0 && !isInitialized) {
      // Create enhanced milestones with submission fields
      const enhanced = milestones.map(milestone => ({
        ...milestone,
        hasSubmission: false,
        submissions: [],
        status: milestone.status || "upcoming",
      }))
      
      setProcessedMilestones(enhanced)
      setIsInitialized(true)
    }
  }, [milestones, isInitialized, refreshTrigger])
  
  // Update when a submission is found
  const handleSubmissionCheck = (hasSubmission, submissions) => {
    // Only process if we have submissions
    if (hasSubmission && submissions && submissions.length > 0) {
      console.log(`SubmissionSummaryCard: received ${submissions.length} submissions`);
      
      // Extract milestone ID from submissions if available
      const milestoneId = submissions[0].milestoneId;
      
      if (milestoneId) {
        // Update the processed milestones
        setProcessedMilestones(prev => 
          prev.map(m => {
            if (m.id === milestoneId) {
              return {
                ...m,
                hasSubmission,
                status: hasSubmission ? "completed" : m.status,
                submissions: submissions || []
              }
            }
            return m
          })
        )
        
        // Update the submissions map
        setSubmissionsByMilestone(prev => ({
          ...prev,
          [milestoneId]: submissions
        }))
      }
      
      // Add to all submissions list
      setAllSubmissions(prev => {
        const newSubmissions = [...prev]
        submissions.forEach(sub => {
          if (!newSubmissions.some(existing => existing.id === sub.id)) {
            newSubmissions.push(sub)
          }
        })
        return newSubmissions
      })
    }
  }
  
  // Combine all submissions for processing
  const combinedSubmissions = [...allSubmissions, ...initialSubmissions]
  
  // Validate submissions and convert formats with improved field detection
  const validatedSubmissions = combinedSubmissions.filter(sub => {
    // Basic validation to ensure we have at least an ID
    if (!sub || !sub.id) return false;
    
    // Check for at least one of the possible creation date fields
    const hasCreationDate = !!(
      sub.createdTime || 
      sub.Created_Time || 
      sub.created || 
      sub.createdAt || 
      sub.timestamp ||
      sub.submissionTimestamp ||
      // Add a fallback creation time if coming from direct team submissions
      sub.fromTeamField
    );
    
    return hasCreationDate;
  });

  // Calculate submission statistics with validated data
  const totalSubmissions = validatedSubmissions.length;
  const totalMilestones = milestones.length;
  
  // Simplified validation logging without referencing any undeclared variables
  if (combinedSubmissions.length > 0) {
    const rejectedCount = combinedSubmissions.length - validatedSubmissions.length;
    if (rejectedCount > 0) {
      console.log(`Filtered out ${rejectedCount} invalid submissions from ${combinedSubmissions.length} total`);
    }
  }
  
  // Calculate recent submissions with robust date handling
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentSubmissions = validatedSubmissions.filter(sub => {
    try {
      // Try multiple date field formats
      const dateString = sub.createdTime || sub.Created_Time || sub.created;
      
      if (!dateString) {
        return false;
      }
      
      const createdDate = new Date(dateString);
      
      // Validate the date
      if (isNaN(createdDate.getTime())) {
        console.error(`Invalid submission date format: ${dateString}`);
        return false;
      }
      
      return createdDate >= oneWeekAgo;
    } catch (err) {
      console.error(`Error processing submission date: ${err.message}`);
      return false;
    }
  });
  
  // Count overdue/missing submissions with enhanced ID matching
  const overdueCount = milestones.filter(m => {
    try {
      // Parse and validate due date
      let isDueDate = false;
      if (m.dueDate) {
        const dueDate = new Date(m.dueDate);
        // Check if valid date and in the past
        isDueDate = !isNaN(dueDate.getTime()) && dueDate < new Date();
      }
      
      // Check completion status
      const notCompleted = m.status !== 'completed';
      
      // Enhanced submission matching with multiple approaches
      const hasNoSubmission = !validatedSubmissions.some(sub => {
        // Try direct ID matching first
        if (sub.milestoneId === m.id) {
          return true;
        }
        
        // Try alternative fields
        if (sub.Milestone?.[0] === m.id || sub.milestone?.[0] === m.id) {
          return true;
        }
        
        // Check raw milestone data (could be array or string)
        if (Array.isArray(sub.rawMilestone) && sub.rawMilestone.includes(m.id)) {
          return true;
        }
        
        // Check requested milestone ID
        if (sub.requestedMilestoneId === m.id) {
          return true;
        }
        
        return false;
      });
      
      // Minimal logging for overdue check - only log if there are submissions but milestone still shows as overdue
      if (isDueDate && notCompleted && hasNoSubmission && validatedSubmissions.length > 0) {
        // This is an unusual case - we have submissions but the milestone is still showing as overdue
        console.log(`Warning: Milestone ${m.id.slice(0, 8)}... (${m.name}) shows as overdue despite ${validatedSubmissions.length} submissions`);
      }
      
      return isDueDate && notCompleted && hasNoSubmission;
    } catch (err) {
      console.error(`Error processing milestone ${m.id} for overdue check:`, err);
      return false;
    }
  }).length;
  
  // Get upcoming submission deadlines with improved date validation
  const upcomingDeadlines = milestones
    .filter(m => {
      try {
        if (!m.dueDate) {
          return false;
        }
        
        const dueDate = new Date(m.dueDate);
        
        // Validate the date
        if (isNaN(dueDate.getTime())) {
          console.error(`Invalid due date format in milestone ${m.id}: ${m.dueDate}`);
          return false;
        }
        
        const isInFuture = dueDate > new Date();
        const notCompleted = m.status !== 'completed';
        
        return isInFuture && notCompleted;
      } catch (err) {
        console.error(`Error processing milestone due date for ${m.id}:`, err);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } catch (err) {
        // Fallback for sorting if date comparison fails
        console.error(`Error sorting milestone due dates:`, err);
        return 0;
      }
    })
    .slice(0, 3);
    
  // Calculate submission rate with validation
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  
  // Only log statistics if we have milestones to process
  if (processedMilestones.length > 0) {
    console.log(`Stats: ${completedMilestones}/${totalMilestones} milestones completed, ${overdueCount} overdue, ${totalSubmissions} submissions`);
  }
  
  const submissionRate = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Submission Summary</CardTitle>
        <CardDescription>Track your milestone submissions and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Hidden submission checkers to fetch submission data */}
        {isInitialized && processedMilestones.map(milestone => (
          <MilestoneSubmissionChecker
            key={`submission-check-${milestone.id}`}
            milestoneId={milestone.id}
            onSubmissionCheck={handleSubmissionCheck}
          />
        ))}
      
        {!isInitialized ? (
          /* Skeleton loading state */
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
            </div>
          </div>
        ) : (
          /* Actual content */
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-violet-50 dark:bg-violet-900 p-3 border-violet-100 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-1">
                <Upload className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-medium text-violet-800 dark:text-violet-300">Total Submissions</span>
              </div>
              <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">{totalSubmissions}</div>
            </Card>
            
            <Card className="bg-green-50 dark:bg-green-900 p-3 border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">Recent Submissions</span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{recentSubmissions.length}</div>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900 p-3 border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <FileX className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">Overdue</span>
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{overdueCount}</div>
            </Card>
            
            <Card className="bg-blue-50 dark:bg-blue-900 p-3 border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Submission Rate</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{submissionRate}%</div>
            </Card>
          </div>
        )}
        
        {/* Upcoming deadlines */}
        {!isInitialized ? (
          /* Skeleton loader for upcoming deadlines */
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 mb-6 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3"></div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ) : upcomingDeadlines.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-100 dark:border-amber-800/50 mb-6">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Upcoming Deadlines
            </h4>
            
            <div className="space-y-3">
              {upcomingDeadlines.map((milestone, index) => (
                <div key={milestone.id || index} className="flex justify-between items-center">
                  <div className="font-medium text-amber-900 dark:text-amber-300">{milestone.name}</div>
                  <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300">
                    {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    }) : "No date"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Submit button */}
        {/* Create New Submission button removed */}
      </CardContent>
    </Card>
  )
}