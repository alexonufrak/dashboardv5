"use client"

import { useState, useEffect, useRef } from "react"
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Calendar,
  Star,
  FileText,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react"
import { format, isValid, parseISO, isPast } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import MilestoneSubmissionChecker from "./MilestoneSubmissionChecker"

/**
 * MilestoneTimeline Component
 * Displays milestones in a modern timeline format with submission status integration
 */
export default function MilestoneTimeline({
  programName,
  programId,
  programType = "xperience",
  milestones = [],
  linkToDetail = true,
  className = "",
}) {
  const [enhancedMilestones, setEnhancedMilestones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Status configuration for visual elements - completed/upcoming/late
  const statusConfig = {
    completed: { 
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      lineClass: "bg-green-500",
      nodeClass: "border-green-500 bg-green-100",
      textClass: "text-green-700"
    },
    upcoming: { 
      icon: <Circle className="h-5 w-5 text-gray-300" />,
      lineClass: "bg-gray-200",
      nodeClass: "border-gray-300 bg-gray-50",
      textClass: "text-gray-500"
    },
    late: { 
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      lineClass: "bg-red-500",
      nodeClass: "border-red-500 bg-red-100",
      textClass: "text-red-700"
    }
  }

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return ""
    
    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return dateString
      
      return format(date, "MMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  // Calculate the number of days remaining until a date
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null
    
    try {
      const dueDate = parseISO(dateString)
      if (!isValid(dueDate)) return null
      
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays
    } catch (e) {
      return null
    }
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!enhancedMilestones || enhancedMilestones.length === 0) return 0
    
    const completed = enhancedMilestones.filter(m => m.status === "completed").length
    return Math.round((completed / enhancedMilestones.length) * 100)
  }

  // Handle submissions data and update milestone status
  const handleSubmissionCheck = (index, hasSubmission, submissions) => {
    if (index >= 0 && index < milestones.length) {
      setEnhancedMilestones(prevMilestones => {
        const updatedMilestones = [...prevMilestones]
        const milestone = { ...updatedMilestones[index] }
        
        // Update milestone based on submission data
        if (hasSubmission && submissions && submissions.length > 0) {
          // Sort by date (newest first) and use the most recent
          const sortedSubmissions = [...submissions].sort((a, b) => {
            return new Date(b.createdTime) - new Date(a.createdTime)
          })
          
          const latestSubmission = sortedSubmissions[0]
          
          // Update milestone with submission data
          milestone.hasSubmission = true
          milestone.submissionDate = latestSubmission.createdTime
          milestone.status = "completed"
          milestone.completedDate = latestSubmission.createdTime
          
          // Include link if available
          if (latestSubmission.link) {
            milestone.submissionLink = latestSubmission.link
          }
          
          // Include attachment info if available
          if (latestSubmission.attachments && latestSubmission.attachments.length > 0) {
            milestone.hasAttachments = true
            milestone.attachmentCount = latestSubmission.attachments.length
          }
        } else {
          // No submission - determine status based on due date
          milestone.hasSubmission = false
          
          // Check if milestone is past due - ensure reliable date handling
          try {
            const dueDate = milestone.dueDate ? new Date(milestone.dueDate) : null
            const isValidDate = dueDate && !isNaN(dueDate.getTime())
            
            if (isValidDate && isPast(dueDate)) {
              milestone.status = "late"
            } else {
              milestone.status = "upcoming"
            }
          } catch (err) {
            console.error("Error processing milestone due date:", err)
            milestone.status = "upcoming" // Default to upcoming if date processing fails
          }
        }
        
        updatedMilestones[index] = milestone
        return updatedMilestones
      })
    }
  }

  // Use a ref to prevent re-initialization on every render
  const milestoneInitializedRef = useRef(false);
  
  // Initialize enhanced milestones with submission checks when milestones change
  useEffect(() => {
    if (!milestones || milestones.length === 0) {
      setEnhancedMilestones([])
      setIsLoading(false)
      milestoneInitializedRef.current = false;
      return
    }
    
    // If we've already initialized milestones, don't reinitialize
    // This prevents re-renders with stale data during navigation
    if (milestoneInitializedRef.current && enhancedMilestones.length > 0) {
      setIsLoading(false);
      return;
    }
    
    // Copy the milestones and set up for enhancement
    const initialEnhanced = milestones.map(milestone => ({
      ...milestone,
      hasSubmission: false,
      submissionDate: null,
      submissionLink: null,
      hasAttachments: false,
      attachmentCount: 0,
      // Preserve original status but will be updated based on submissions
      originalStatus: milestone.status || "upcoming"
    }))
    
    setEnhancedMilestones(initialEnhanced)
    setIsLoading(false)
    milestoneInitializedRef.current = true;
  }, [milestones, enhancedMilestones.length])
  
  // If still loading, show skeleton loader
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/3 mb-6"></div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-10 pb-8">
              <div className="absolute left-[10px] top-1 w-7 h-7 rounded-full bg-gray-200 -translate-x-1/2"></div>
              {i < 3 && <div className="absolute left-4 top-5 bottom-0 w-0.5 bg-gray-200"></div>}
              <div className="space-y-1.5">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate completeness metrics
  const completedCount = enhancedMilestones.filter(m => m.status === "completed").length
  const progressPercentage = calculateProgress()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Program header with progress data */}
      <div className="flex flex-col mb-4">
        <h2 className="text-xl font-bold">
          {programName || "Program Milestones"}
        </h2>
        <p className="text-muted-foreground">
          {progressPercentage}% Complete • {completedCount} of {enhancedMilestones.length} milestones
        </p>
      </div>
      
      {/* Timeline visualization */}
      <div className="relative space-y-0">
        {enhancedMilestones.map((milestone, index) => {
          const status = milestone.status || "not_started"
          const config = statusConfig[status]
          const isLast = index === enhancedMilestones.length - 1
          const daysRemaining = getDaysRemaining(milestone.dueDate)
          
          return (
            <div key={index} className="relative pl-10 pb-8">
              {/* Submission checker component - key is a combination of milestoneId and timeline instance to ensure uniqueness */}
              <MilestoneSubmissionChecker
                key={`submission-checker-${milestone.id}`}
                milestoneId={milestone.id}
                onSubmissionCheck={(hasSubmission, submissions) => 
                  handleSubmissionCheck(index, hasSubmission, submissions)
                }
              />
              
              {/* Connecting line between milestone nodes */}
              {!isLast && (
                <div className={`absolute left-4 top-5 bottom-0 w-0.5 ${config.lineClass}`} />
              )}
              
              {/* Milestone node circle */}
              <div className={`absolute left-[10px] top-1 w-7 h-7 rounded-full border-2 ${config.nodeClass} flex items-center justify-center -translate-x-1/2`}>
                {config.icon}
              </div>
              
              {/* Milestone content */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <h3 className={`font-medium ${config.textClass}`}>
                    {milestone.name}
                  </h3>
                  
                  {/* Status badge */}
                  <Badge 
                    className="ml-2"
                    variant={status === "completed" ? "success" : 
                            status === "late" ? "destructive" : "outline"}
                  >
                    {status === "completed" ? "Completed" : 
                     status === "late" ? "Late" : "Upcoming"}
                  </Badge>
                </div>
                
                <div className="flex flex-col text-sm space-y-1">
                  {/* Due date */}
                  {milestone.dueDate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Due: {formatDate(milestone.dueDate)}</span>
                      
                      {/* Days remaining indicator - simplified colors */}
                      {status !== "completed" && daysRemaining !== null && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {daysRemaining <= 0 ? "Due today" : `${daysRemaining} days remaining`}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Submission date (if completed) */}
                  {status === "completed" && milestone.submissionDate && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Submitted: {formatDate(milestone.submissionDate)}</span>
                    </div>
                  )}
                  
                  {/* Original completion date (if completed and no submission) */}
                  {status === "completed" && !milestone.submissionDate && milestone.completedDate && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Completed: {formatDate(milestone.completedDate)}</span>
                    </div>
                  )}
                  
                  {/* Removed score display as requested */}
                  
                  {/* Attachments indicator */}
                  {milestone.hasAttachments && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <FileText className="h-3.5 w-3.5" />
                      <span>
                        {milestone.attachmentCount > 1 
                          ? `${milestone.attachmentCount} files attached` 
                          : "1 file attached"}
                      </span>
                    </div>
                  )}
                  
                  {/* Submission link */}
                  {milestone.submissionLink && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
                      <a 
                        href={milestone.submissionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        View submission
                        <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    </div>
                  )}
                  
                  {/* Progress indicator (for in-progress milestones) */}
                  {status === "in_progress" && milestone.progress !== undefined && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Progress: {milestone.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Optional link to milestone details */}
      {linkToDetail && programId && (
        <Button 
          variant="outline" 
          className="w-full mt-4" 
          asChild
        >
          <Link href={`/dashboard/programs/${programType}/${programId}/milestones`}>
            View Milestone Details <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  )
}