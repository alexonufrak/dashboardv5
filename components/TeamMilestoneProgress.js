"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, TableIcon, AlignLeft, AlertCircle } from "lucide-react"
import MilestoneTimeline from "./MilestoneTimeline"
import MilestoneTable from "./MilestoneTable"
import MilestoneSubmissionChecker from "./MilestoneSubmissionChecker"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useDashboard } from "@/contexts/DashboardContext"

// Calculate overall progress percentage based on milestone statuses
const calculateOverallProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0
  
  const completedCount = milestones.filter(m => m.status === "completed").length
  
  // Just use completed/total as the progress indicator
  return Math.round((completedCount) / milestones.length * 100)
}

export default function TeamMilestoneProgress({ milestones: initialMilestones = [], detailed = false, programName, programId, programType = "xperience" }) {
  const { teamData } = useDashboard()
  const [viewMode, setViewMode] = useState("table") // "table" or "timeline"
  const [processedMilestones, setProcessedMilestones] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize milestone data
  useEffect(() => {
    if (initialMilestones && initialMilestones.length > 0 && !isInitialized) {
      // Create enhanced initial state
      const enhanced = initialMilestones.map(milestone => ({
        ...milestone,
        hasSubmission: milestone.status === "completed",
        submissions: [],
        status: milestone.status || "upcoming"
      }))
      
      setProcessedMilestones(enhanced)
      setIsInitialized(true)
    }
  }, [initialMilestones, isInitialized])
  
  // Handler for submission check results
  const handleSubmissionCheck = (milestoneId, hasSubmission) => {
    setProcessedMilestones(prev => 
      prev.map(m => {
        if (m.id === milestoneId) {
          return {
            ...m,
            hasSubmission,
            status: hasSubmission ? "completed" : m.status,
          }
        }
        return m
      })
    )
  }
  
  // Use processed milestones if initialized, otherwise use initial milestones
  const milestones = isInitialized ? processedMilestones : initialMilestones;
  
  if (!milestones || milestones.length === 0) {
    return (
      <div className="border rounded-md p-6 text-center">
        <div className="text-muted-foreground mb-2">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Milestones Available</h3>
          <p className="text-sm">
            This team doesn't have any milestones assigned yet.
            <br />
            Your program coordinator will add milestones when they are ready.
          </p>
        </div>
        {programId && (
          <Button 
            variant="outline" 
            className="mt-4" 
            asChild
          >
            <Link href={`/dashboard/programs/${programType}/${programId}`}>
              View Program Details
            </Link>
          </Button>
        )}
      </div>
    )
  }
  
  // Get overall progress
  const overallProgress = calculateOverallProgress(milestones)
  
  return (
    <div>
      {/* Hidden submission checkers */}
      {isInitialized && processedMilestones.map(milestone => (
        <MilestoneSubmissionChecker
          key={`checker-${milestone.id}`}
          milestoneId={milestone.id}
          onSubmissionCheck={(hasSubmission) => handleSubmissionCheck(milestone.id, hasSubmission)}
        />
      ))}
    
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          {!detailed && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Overall Progress</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2.5" />
            </>
          )}
        </div>
        
        {/* View mode toggle */}
        <div className="flex ml-4">
          <div className="border rounded-md flex bg-muted/20">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === "timeline" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("timeline")}
            >
              <AlignLeft className="h-4 w-4 mr-1" />
              Timeline
            </Button>
          </div>
        </div>
      </div>
      
      {/* Render either timeline or table view */}
      {viewMode === "timeline" ? (
        <MilestoneTimeline
          programName={programName || "Team Milestones"}
          programId={programId}
          programType={programType}
          milestones={milestones}
          linkToDetail={!detailed}
          className="mt-4"
        />
      ) : (
        <MilestoneTable
          programName={programName || "Team Milestones"}
          programId={programId}
          programType={programType}
          milestones={milestones}
          className="mt-4"
        />
      )}
      
      {!detailed && !programId && (
        <div className="flex justify-between items-center text-sm mt-3">
          <div className="text-muted-foreground">
            <span className="font-medium">{milestones.filter(m => m.status === "completed").length}</span> of <span className="font-medium">{milestones.length}</span> milestones completed
          </div>
          <div className="text-primary font-medium flex items-center">
            <span>View all milestones</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      )}
    </div>
  )
}