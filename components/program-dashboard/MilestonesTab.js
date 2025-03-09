"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, AlertCircle } from "lucide-react"
import TeamMilestoneProgress from "@/components/teams/TeamMilestoneProgress"

/**
 * Milestones tab content component that displays program milestones
 */
export function MilestonesTab({ milestones }) {
  return (
    <div className="space-y-4 w-full">
      <MilestonesSummaryCard milestones={milestones} />
      <MilestonesDetailCard milestones={milestones} />
    </div>
  )
}

/**
 * Summary card for milestones that shows completion status
 */
function MilestonesSummaryCard({ milestones }) {
  // Calculate milestone statistics
  const getMilestoneStats = () => {
    // Count milestones that are actually completed based on submission data
    const completedCount = milestones?.filter(m => 
      m.status === "completed" || m.hasSubmission
    ).length || 0;
    
    // Check if milestones are late based on due date
    const lateCount = milestones?.filter(m => {
      // If already marked as late or has a past due date without submission
      if (m.status === "late") return true;
      if (m.status === "completed" || m.hasSubmission) return false;
      
      // Check if past due date
      if (m.dueDate) {
        try {
          const dueDate = new Date(m.dueDate);
          const now = new Date();
          return dueDate < now;
        } catch (e) {
          console.warn(`Invalid due date for milestone: ${m.dueDate}`);
          return false;
        }
      }
      return false;
    }).length || 0;
    
    // Anything not completed or late is upcoming
    const upcomingCount = milestones?.length - completedCount - lateCount || 0;
    
    // Calculate completion percentage
    const totalCount = milestones?.length || 0;
    const completionPercentage = totalCount > 0 ? 
      Math.round((completedCount) / totalCount * 100) : 0;
      
    return {
      completedCount,
      lateCount,
      upcomingCount,
      totalCount,
      completionPercentage
    };
  };

  const stats = getMilestoneStats();

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-blue-100 w-full max-w-none">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between w-full">
          <div>
            <h2 className="text-xl font-semibold mb-2">Program Milestones</h2>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>{stats.completedCount}</strong> Completed</span>
                </span>
                <span className="flex items-center gap-1">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span><strong>{stats.upcomingCount}</strong> Upcoming</span>
                </span>
                {stats.lateCount > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span><strong>{stats.lateCount}</strong> Late</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Overall Progress:</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                {`${stats.completionPercentage}%`}
              </Badge>
            </div>
            <Progress 
              value={stats.completionPercentage} 
              className="h-2 w-[200px]" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Detailed card for milestones that shows all milestone details
 */
function MilestonesDetailCard({ milestones }) {
  return (
    <Card className="w-full max-w-none">
      <CardHeader>
        <CardTitle>Milestone Details</CardTitle>
        <CardDescription>Complete timeline of program milestones</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <TeamMilestoneProgress 
          milestones={milestones || []} 
          detailed={true}
          programName="Program Milestones"
        />
      </CardContent>
    </Card>
  )
}