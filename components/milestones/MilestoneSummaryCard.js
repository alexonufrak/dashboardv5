"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useDashboard } from "@/contexts/DashboardContext"
import MilestoneSubmissionChecker from "./MilestoneSubmissionChecker"

export default function MilestoneSummaryCard({ milestones = [], onViewMilestones }) {
  const { teamData } = useDashboard()
  const [enhancedMilestones, setEnhancedMilestones] = useState([])
  const [isProcessing, setIsProcessing] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Listen for submission updates from other components
  useEffect(() => {
    // Event handler for the custom submission updated event
    const handleSubmissionUpdate = (event) => {
      const { milestoneId, teamId, submissions } = event.detail;
      
      // Make sure this event is for our team
      if (teamData?.id && teamId && teamData.id !== teamId) {
        console.log(`Ignoring submission update for different team: ${teamId} vs ${teamData.id}`);
        return;
      }
      
      // Check if the updated milestone is in our list
      const milestoneIndex = enhancedMilestones.findIndex(m => m.id === milestoneId);
      
      if (milestoneIndex >= 0) {
        console.log(`MilestoneSummaryCard received update for milestone: ${milestoneId}`);
        
        // Update the milestone directly to ensure immediate feedback
        setEnhancedMilestones(prev => 
          prev.map(m => {
            if (m.id === milestoneId) {
              return {
                ...m,
                hasSubmission: true,
                status: "completed",
                submissions: submissions || []
              };
            }
            return m;
          })
        );
        
        // Also trigger a full refresh to ensure all stats are updated
        setRefreshTrigger(prev => prev + 1);
        setIsProcessing(false); // Ensure we're not in processing state
      }
    };
    
    // Add event listener
    window.addEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    };
  }, [enhancedMilestones, teamData?.id]);
  
  // Initialize enhancedMilestones from the raw milestones prop
  useEffect(() => {
    if (milestones && milestones.length > 0) {
      // Create a copy with submission properties
      const initialMilestones = milestones.map(milestone => ({
        ...milestone,
        hasSubmission: false,
        submissions: [],
        status: milestone.status || "upcoming",
      }))
      
      setEnhancedMilestones(initialMilestones)
      setIsProcessing(false)
    }
  }, [milestones, refreshTrigger]) // Add refreshTrigger to dependencies
  
  // Update milestone status when submissions are checked
  const handleSubmissionCheck = (milestoneId, hasSubmission, submissions) => {
    console.log(`Updating milestone ${milestoneId}: hasSubmission=${hasSubmission}, submissions=${submissions?.length || 0}`);
    
    setEnhancedMilestones(prev => 
      prev.map(m => {
        if (m.id === milestoneId) {
          let updatedStatus = m.status;
          
          // If there's a submission, always mark as completed
          if (hasSubmission) {
            updatedStatus = "completed";
          } 
          // If no submission, check if past due date
          else if (m.dueDate) {
            try {
              const dueDate = new Date(m.dueDate);
              const now = new Date();
              if (dueDate < now) {
                updatedStatus = "late";
              } else {
                updatedStatus = "upcoming";
              }
            } catch (e) {
              console.warn(`Invalid due date for milestone ${milestoneId}: ${m.dueDate}`);
              updatedStatus = "upcoming"; // Default to upcoming if date is invalid
            }
          }
          
          // Store submission data if available
          let submissionData = [];
          if (submissions && submissions.length > 0) {
            submissionData = submissions;
          }
          
          // Log what we're doing
          console.log(`Milestone ${milestoneId} updated: status=${updatedStatus}, hasSubmission=${hasSubmission}`);
          
          // Return updated milestone
          return {
            ...m,
            hasSubmission,
            submissions: submissionData,
            status: updatedStatus
          };
        }
        return m;
      })
    );
  }
  
  // Calculate milestone statistics using enhanced milestones with submission data
  const completedCount = enhancedMilestones.filter(m => m.status === "completed" || m.hasSubmission).length
  
  // For late milestones, consider due date and submission status
  const lateCount = enhancedMilestones.filter(m => {
    // If it's already marked as late
    if (m.status === "late") return true;
    
    // Check if it's past due date and has no submission
    if (!m.hasSubmission && m.dueDate) {
      try {
        const dueDate = new Date(m.dueDate);
        const now = new Date();
        return dueDate < now;
      } catch (e) {
        console.warn(`Invalid due date for milestone ${m.id}: ${m.dueDate}`);
        return false;
      }
    }
    
    return false;
  }).length;
  
  // Upcoming is everything else
  const upcomingCount = enhancedMilestones.length - completedCount - lateCount;
  
  // Calculate overall progress percentage
  const progressPercentage = enhancedMilestones.length > 0 
    ? Math.round((completedCount) / enhancedMilestones.length * 100) 
    : 0
    
  // Log current statistics for debugging
  console.log(`MilestoneSummaryCard stats: ${completedCount} completed, ${lateCount} late, ${upcomingCount} upcoming, ${progressPercentage}% progress`)
  
  // Find the next upcoming milestone
  const upcomingMilestones = enhancedMilestones
    .filter(m => m.status !== "completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  
  const nextMilestone = upcomingMilestones.length > 0 ? upcomingMilestones[0] : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Milestone Status</CardTitle>
            <CardDescription>Track your progress on program milestones</CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {progressPercentage}% Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Submission checker components */}
        {!isProcessing && enhancedMilestones.map(milestone => (
          <MilestoneSubmissionChecker
            key={`submission-check-${milestone.id}`}
            milestoneId={milestone.id}
            onSubmissionCheck={(hasSubmission, submissions) => 
              handleSubmissionCheck(milestone.id, hasSubmission, submissions)
            }
          />
        ))}
        
        {/* Progress indicator */}
        <div className="mb-6">
          <Progress value={progressPercentage} className="h-2.5" />
        </div>
        
        {isProcessing ? (
          <>
            {/* Skeleton loader for stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="animate-pulse h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="animate-pulse h-8 bg-gray-300 rounded w-10"></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="animate-pulse h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="animate-pulse h-8 bg-gray-300 rounded w-10"></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="animate-pulse h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="animate-pulse h-8 bg-gray-300 rounded w-10"></div>
              </div>
            </div>
            
            {/* Skeleton loader for next milestone */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="animate-pulse h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="animate-pulse h-5 bg-gray-200 rounded w-20"></div>
                <div className="animate-pulse h-5 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Stats grid - completed, late, and upcoming */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-green-50 dark:bg-green-900 p-3 border-green-100 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">Completed</span>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{completedCount}</div>
              </Card>
              
              <Card className="bg-neutral-50 dark:bg-neutral-900 p-3 border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-1">
                  <Circle className="h-5 w-5 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-300">Upcoming</span>
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{upcomingCount}</div>
              </Card>
              
              <Card className="bg-red-50 dark:bg-red-900 p-3 border-red-100 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">Late</span>
                </div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">{lateCount}</div>
              </Card>
            </div>
            
            {/* Next milestone */}
            {nextMilestone && (
              <Card className="bg-indigo-50 dark:bg-indigo-900 p-4 border-indigo-100 dark:border-indigo-800">
                <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">Next Milestone</h4>
                <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-1">{nextMilestone.name}</div>
                <div className="flex justify-between items-center">
                  <Badge 
                    variant={nextMilestone.status === "late" ? "destructive" : "outline"} 
                    className="whitespace-nowrap"
                  >
                    {nextMilestone.status === "late" ? "Late" : "Upcoming"}
                  </Badge>
                  <div className="text-sm text-indigo-700 dark:text-indigo-300">
                    Due: {nextMilestone.dueDate ? new Date(nextMilestone.dueDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    }) : "No date"}
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
        
        {/* View all button removed */}
      </CardContent>
    </Card>
  )
}