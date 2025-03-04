"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, TableIcon, AlignLeft } from "lucide-react"
import MilestoneTimeline from "./MilestoneTimeline"
import MilestoneTable from "./MilestoneTable"
import { Button } from "@/components/ui/button"

// Calculate overall progress percentage based on milestone statuses
const calculateOverallProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0
  
  const completedCount = milestones.filter(m => m.status === "completed").length
  const inProgressCount = milestones.filter(m => m.status === "in_progress").length
  
  // Count in-progress milestones as half complete for the calculation
  return Math.round((completedCount + (inProgressCount * 0.5)) / milestones.length * 100)
}

export default function TeamMilestoneProgress({ milestones, detailed = false, programName, programId, programType = "xperience" }) {
  const [viewMode, setViewMode] = useState("timeline") // "timeline" or "table"
  
  if (!milestones || milestones.length === 0) {
    return <div className="text-muted-foreground">No milestone data available.</div>
  }
  
  // Get overall progress
  const overallProgress = calculateOverallProgress(milestones)
  
  return (
    <div>
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
              variant={viewMode === "timeline" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("timeline")}
            >
              <AlignLeft className="h-4 w-4 mr-1" />
              Timeline
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4 mr-1" />
              Table
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