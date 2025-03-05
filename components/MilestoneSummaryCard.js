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
  }, [milestones])
  
  // Update milestone status when submissions are checked
  const handleSubmissionCheck = (milestoneId, hasSubmission) => {
    setEnhancedMilestones(prev => 
      prev.map(m => {
        if (m.id === milestoneId) {
          // If there's a submission, mark as completed
          return {
            ...m,
            hasSubmission,
            status: hasSubmission ? "completed" : m.status
          }
        }
        return m
      })
    )
  }
  
  // Calculate milestone statistics using enhanced milestones with submission data
  const completedCount = enhancedMilestones.filter(m => m.status === "completed").length
  const lateCount = enhancedMilestones.filter(m => m.status === "late").length
  const upcomingCount = enhancedMilestones.filter(m => 
    m.status !== "completed" && m.status !== "late").length
  
  // Calculate overall progress percentage
  const progressPercentage = enhancedMilestones.length > 0 
    ? Math.round((completedCount) / enhancedMilestones.length * 100) 
    : 0
  
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
            onSubmissionCheck={(hasSubmission) => handleSubmissionCheck(milestone.id, hasSubmission)}
          />
        ))}
        
        {/* Progress indicator */}
        <div className="mb-6">
          <Progress value={progressPercentage} className="h-2.5" />
        </div>
        
        {/* Stats grid - completed, late, and upcoming */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{completedCount}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-800">Upcoming</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{upcomingCount}</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Late</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{lateCount}</div>
          </div>
        </div>
        
        {/* Next milestone */}
        {nextMilestone && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Next Milestone</h4>
            <div className="text-lg font-semibold text-indigo-900 mb-1">{nextMilestone.name}</div>
            <div className="flex justify-between items-center">
              <Badge 
                variant={nextMilestone.status === "late" ? "destructive" : "outline"} 
                className="whitespace-nowrap"
              >
                {nextMilestone.status === "late" ? "Late" : "Upcoming"}
              </Badge>
              <div className="text-sm text-indigo-700">
                Due: {nextMilestone.dueDate ? new Date(nextMilestone.dueDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                }) : "No date"}
              </div>
            </div>
          </div>
        )}
        
        {/* View all button */}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onViewMilestones}>
            View All Milestones
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}