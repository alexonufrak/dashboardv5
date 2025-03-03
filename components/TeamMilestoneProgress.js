"use client"

import { Progress } from "@/components/ui/progress"
import { ArrowRight } from "lucide-react"
import MilestoneTimeline from "./MilestoneTimeline"

// Calculate overall progress percentage based on milestone statuses
const calculateOverallProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0
  
  const completedCount = milestones.filter(m => m.status === "completed").length
  const inProgressCount = milestones.filter(m => m.status === "in_progress").length
  
  // Count in-progress milestones as half complete for the calculation
  return Math.round((completedCount + (inProgressCount * 0.5)) / milestones.length * 100)
}

export default function TeamMilestoneProgress({ milestones, detailed = false, programName, programId, programType = "xperience" }) {
  if (!milestones || milestones.length === 0) {
    return <div className="text-muted-foreground">No milestone data available.</div>
  }
  
  // Get overall progress
  const overallProgress = calculateOverallProgress(milestones)
  
  return (
    <div>
      {!detailed && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2.5" />
        </div>
      )}
      
      {/* Use the new MilestoneTimeline component */}
      <MilestoneTimeline
        programName={programName || "Team Milestones"}
        programId={programId}
        programType={programType}
        milestones={milestones}
        linkToDetail={!detailed}
        className="mt-4"
      />
      
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