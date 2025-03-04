"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function MilestoneSummaryCard({ milestones = [], onViewMilestones }) {
  // Calculate milestone statistics
  const completedCount = milestones.filter(m => m.status === "completed").length
  const inProgressCount = milestones.filter(m => m.status === "in_progress").length
  const notStartedCount = milestones.filter(m => 
    m.status === "not_started" || !m.status).length
  const atRiskCount = milestones.filter(m => 
    m.status === "at_risk" || m.status === "late").length
  
  // Calculate overall progress percentage
  const progressPercentage = milestones.length > 0 
    ? Math.round((completedCount + (inProgressCount * 0.5)) / milestones.length * 100) 
    : 0
  
  // Find the next upcoming milestone
  const upcomingMilestones = milestones
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
        {/* Progress indicator */}
        <div className="mb-6">
          <Progress value={progressPercentage} className="h-2.5" />
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{completedCount}</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">In Progress</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{inProgressCount}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Circle className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-800">Not Started</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{notStartedCount}</div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">At Risk</span>
            </div>
            <div className="text-2xl font-bold text-amber-900">{atRiskCount}</div>
          </div>
        </div>
        
        {/* Next milestone */}
        {nextMilestone && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Next Milestone</h4>
            <div className="text-lg font-semibold text-indigo-900 mb-1">{nextMilestone.name}</div>
            <div className="flex justify-between items-center">
              <Badge variant={
                nextMilestone.status === "in_progress" ? "default" :
                nextMilestone.status === "late" ? "destructive" : 
                nextMilestone.status === "at_risk" ? "warning" : "outline"
              } className="whitespace-nowrap">
                {nextMilestone.status === "in_progress" ? "In Progress" :
                 nextMilestone.status === "late" ? "Late" :
                 nextMilestone.status === "at_risk" ? "At Risk" : "Not Started"}
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