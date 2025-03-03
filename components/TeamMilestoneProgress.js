"use client"

import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Clock, XCircle, ArrowRight } from "lucide-react"

const statusIcons = {
  completed: <CheckCircle className="h-5 w-5 text-green-600" />,
  in_progress: <Clock className="h-5 w-5 text-amber-600" />,
  not_started: <Clock className="h-5 w-5 text-gray-400" />,
  at_risk: <AlertCircle className="h-5 w-5 text-red-600" />,
  late: <XCircle className="h-5 w-5 text-red-500" />
}

const statusStyles = {
  completed: "text-green-600 bg-green-50 border-green-200",
  in_progress: "text-amber-600 bg-amber-50 border-amber-200",
  not_started: "text-gray-500 bg-gray-50 border-gray-200",
  at_risk: "text-red-600 bg-red-50 border-red-200",
  late: "text-red-600 bg-red-50 border-red-200"
}

const formatDate = (dateString) => {
  if (!dateString) return ""
  try {
    const date = parseISO(dateString)
    return format(date, "MMM d, yyyy")
  } catch (error) {
    console.error("Date parsing error:", error)
    return dateString
  }
}

const MilestoneItem = ({ milestone, detailed = false }) => {
  const { id, name, status, dueDate, completedDate, score, progress = 0 } = milestone
  const formattedDueDate = formatDate(dueDate)
  const formattedCompletedDate = formatDate(completedDate)
  
  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${detailed ? "mb-4" : "mb-2"} ${status === "completed" ? "bg-green-50/40" : ""}`}>
      <div className="flex-shrink-0 mt-1">
        {statusIcons[status] || statusIcons.not_started}
      </div>
      <div className="flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
          <h3 className="font-medium">{name}</h3>
          <Badge className={statusStyles[status] || statusStyles.not_started}>
            {status === "completed" ? "Completed" : 
             status === "in_progress" ? "In Progress" :
             status === "at_risk" ? "At Risk" :
             status === "late" ? "Late" : "Not Started"}
          </Badge>
        </div>
        
        {status === "in_progress" && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm">
          <div className="text-muted-foreground">
            {status === "completed" ? 
              `Completed: ${formattedCompletedDate}` : 
              `Due: ${formattedDueDate}`}
          </div>
          
          {status === "completed" && score && (
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">Score:</span>
              <span className={parseInt(score) >= 90 ? "text-green-600 font-medium" : 
                           parseInt(score) >= 80 ? "text-amber-600 font-medium" : 
                           "text-gray-600 font-medium"}>
                {score}/100
              </span>
            </div>
          )}
        </div>
        
        {detailed && (
          <div className="mt-2 text-sm">
            <p className="text-muted-foreground">
              {status === "completed" ? 
                "This milestone has been successfully completed by your team." :
                status === "in_progress" ? 
                "Your team is currently working on this milestone." : 
                "This milestone has not been started yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Calculate overall progress percentage based on milestone statuses
const calculateOverallProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0
  
  const completedCount = milestones.filter(m => m.status === "completed").length
  const inProgressCount = milestones.filter(m => m.status === "in_progress").length
  
  // Count in-progress milestones as half complete for the calculation
  return Math.round((completedCount + (inProgressCount * 0.5)) / milestones.length * 100)
}

export default function TeamMilestoneProgress({ milestones, detailed = false }) {
  if (!milestones || milestones.length === 0) {
    return <div className="text-muted-foreground">No milestone data available.</div>
  }
  
  // Sort milestones by status and date
  const sortedMilestones = [...milestones].sort((a, b) => {
    // Completed milestones at top, sorted by completion date (most recent first)
    if (a.status === "completed" && b.status === "completed") {
      return new Date(b.completedDate) - new Date(a.completedDate)
    }
    
    // In progress milestones next, sorted by due date (earliest first)
    if (a.status === "in_progress" && b.status === "in_progress") {
      return new Date(a.dueDate) - new Date(b.dueDate)
    }
    
    // Not started milestones last, sorted by due date (earliest first)
    if (a.status === "not_started" && b.status === "not_started") {
      return new Date(a.dueDate) - new Date(b.dueDate)
    }
    
    // Status priority: in_progress > not_started > completed
    const statusOrder = { in_progress: 0, not_started: 1, completed: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })
  
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
      
      <div>
        {detailed ? (
          // Show all milestones for detailed view
          sortedMilestones.map(milestone => (
            <MilestoneItem key={milestone.id} milestone={milestone} detailed={true} />
          ))
        ) : (
          // Show the first 3 active or upcoming milestones for summary view
          sortedMilestones
            .filter(m => m.status !== "completed")
            .slice(0, 2)
            .map(milestone => (
              <MilestoneItem key={milestone.id} milestone={milestone} />
            ))
        )}
        
        {!detailed && (
          <div className="flex justify-between items-center text-sm mt-1">
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
    </div>
  )
}