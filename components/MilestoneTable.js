"use client"

import { useState } from "react"
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar,
  FileText,
  UploadCloud,
  Eye,
  ExternalLink
} from "lucide-react"
import { format, isValid, parseISO, isPast } from "date-fns"
import MilestoneSubmissionChecker from "./MilestoneSubmissionChecker"
import MilestoneSubmissionDialog from "./MilestoneSubmissionDialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Milestone Table Component
 * Displays milestones in a table format with submission functionality
 */
export default function MilestoneTable({
  programName,
  programId,
  programType = "xperience",
  milestones = [],
  className = "",
}) {
  const [enhancedMilestones, setEnhancedMilestones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState(null)
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState("submit") // "submit" or "view"
  
  // Status configuration for visual elements
  const statusConfig = {
    completed: { 
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      textClass: "text-green-700"
    },
    upcoming: { 
      icon: <Circle className="h-5 w-5 text-gray-300" />,
      textClass: "text-gray-500"
    },
    at_risk: { 
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      textClass: "text-amber-700"
    },
    late: { 
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
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
          milestone.submissions = sortedSubmissions
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
          milestone.submissions = []
          
          // If due date is in the past and no submission, mark as late
          if (milestone.dueDate && isPast(new Date(milestone.dueDate))) {
            milestone.status = "late"
          }
          // Otherwise, default to upcoming
          else {
            milestone.status = "upcoming"
          }
        }
        
        updatedMilestones[index] = milestone
        return updatedMilestones
      })
    }
  }

  // Handle opening the submission dialog
  const handleOpenSubmissionDialog = (milestone, mode) => {
    setSelectedMilestone(milestone)
    setDialogMode(mode)
    setSubmissionDialogOpen(true)
  }

  // If we have milestones but enhancedMilestones is empty, initialize them
  if (milestones.length > 0 && enhancedMilestones.length === 0) {
    // Copy the milestones and set up for enhancement
    const initialEnhanced = milestones.map(milestone => ({
      ...milestone,
      hasSubmission: false,
      submissions: [],
      submissionDate: null,
      submissionLink: null,
      hasAttachments: false,
      attachmentCount: 0,
      // Preserve original status but will be updated based on submissions
      originalStatus: milestone.status || "upcoming"
    }))
    
    setEnhancedMilestones(initialEnhanced)
    setIsLoading(false)
  }
  
  // If still loading, show skeleton loader
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/3 mb-6"></div>
          
          <div className="border rounded-md">
            <div className="h-10 bg-gray-100 rounded-t-md"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 border-t flex items-center">
                <div className="w-1/3 px-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-1/3 px-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-1/3 px-4">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
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
      
      {/* Milestone table */}
      <Table>
        <TableCaption>All milestones for {programName || "your program"}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Milestone</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enhancedMilestones.map((milestone, index) => {
            const status = milestone.status || "not_started"
            const config = statusConfig[status]
            const daysRemaining = getDaysRemaining(milestone.dueDate)
            
            return (
              <TableRow key={index}>
                {/* Submission checker component - responsible for fetching submission status */}
                <MilestoneSubmissionChecker
                  key={`submission-checker-${milestone.id}`}
                  milestoneId={milestone.id}
                  onSubmissionCheck={(hasSubmission, submissions) => 
                    handleSubmissionCheck(index, hasSubmission, submissions)
                  }
                />
                
                {/* Milestone name and number */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {config.icon}
                    </div>
                    <div>
                      <div className={`font-medium ${config.textClass}`}>
                        {milestone.name}
                      </div>
                      {milestone.number && (
                        <div className="text-xs text-muted-foreground">
                          Milestone #{milestone.number}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                {/* Due date */}
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(milestone.dueDate) || "No due date"}</span>
                    </div>
                    
                    {/* Days remaining indicator */}
                    {status !== "completed" && daysRemaining !== null && (
                      <Badge variant="outline" className={
                        daysRemaining < 0 ? "mt-1 bg-red-50 text-red-700 border-red-200" :
                        daysRemaining <= 3 ? "mt-1 bg-amber-50 text-amber-700 border-amber-200" :
                        "mt-1 bg-gray-50 text-gray-700 border-gray-200"
                      }>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` :
                         daysRemaining === 0 ? "Due today" :
                         `${daysRemaining} days remaining`}
                      </Badge>
                    )}
                    
                    {/* Submission date (if completed) */}
                    {status === "completed" && milestone.submissionDate && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Submitted: {formatDate(milestone.submissionDate)}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                {/* Status */}
                <TableCell>
                  <Badge 
                    variant={status === "completed" ? "success" : 
                            status === "in_progress" ? "default" :
                            status === "late" ? "destructive" : 
                            status === "at_risk" ? "warning" : "outline"}
                  >
                    {status === "completed" ? "Completed" : 
                     status === "late" ? "Late" :
                     status === "at_risk" ? "At Risk" : "Upcoming"}
                  </Badge>
                  
                  {/* Additional submission info */}
                  {milestone.hasSubmission && (
                    <div className="mt-1 flex flex-col text-xs">
                      {milestone.hasAttachments && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <FileText className="h-3 w-3" />
                          <span>
                            {milestone.attachmentCount > 1 
                              ? `${milestone.attachmentCount} files` 
                              : "1 file"}
                          </span>
                        </div>
                      )}
                      
                      {milestone.submissionLink && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <ExternalLink className="h-3 w-3" />
                          <a 
                            href={milestone.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            External link
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                
                {/* Actions */}
                <TableCell>
                  {milestone.hasSubmission ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSubmissionDialog(milestone, "view")}
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Submissions
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSubmissionDialog(milestone, "submit")}
                      className="w-full"
                    >
                      <UploadCloud className="h-4 w-4 mr-1" />
                      Submit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      
      {/* Submission dialog */}
      {selectedMilestone && (
        <MilestoneSubmissionDialog 
          open={submissionDialogOpen}
          onOpenChange={setSubmissionDialogOpen}
          milestone={selectedMilestone}
          mode={dialogMode}
          programName={programName}
        />
      )}
    </div>
  )
}