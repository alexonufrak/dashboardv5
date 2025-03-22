"use client"

import { useState, useEffect } from "react"
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
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Used to trigger re-processing of milestones
  
  // Listen for submission updates
  useEffect(() => {
    // Track if the component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Event handler for the custom submission updated event
    const handleSubmissionUpdate = (event) => {
      if (!isMounted) return;
      
      const { milestoneId } = event.detail;
      
      // Check if the updated milestone is in our list
      const milestoneIndex = enhancedMilestones.findIndex(m => m.id === milestoneId);
      
      if (milestoneIndex >= 0) {
        console.log(`IMPORTANT: Detected submission update for milestone ${milestoneId} at index ${milestoneIndex}`);
        
        // Force a COMPLETE reset of the milestone state
        setEnhancedMilestones(prev => {
          // Create a new array with all milestones
          const newMilestones = [...prev];
          
          // Reset the specific milestone to force reprocessing
          if (newMilestones[milestoneIndex]) {
            // Keep basic data but reset submission-specific fields
            newMilestones[milestoneIndex] = {
              ...newMilestones[milestoneIndex],
              hasSubmission: false,
              submissions: [],
              submissionDate: null,
              submissionLink: null,
              hasAttachments: false,
              attachmentCount: 0,
              _forceRefresh: Date.now() // Add a timestamp to force react to see this as different
            };
          }
          return newMilestones;
        });
        
        // Update the refresh trigger to force milestone reprocessing
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    // Add event listener
    window.addEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    
    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
    };
  }, [enhancedMilestones]);
  
  // Status configuration for visual elements - completed/upcoming/late
  const statusConfig = {
    completed: { 
      icon: <CheckCircle className="h-5 w-5 text-success" />,
      textClass: "text-success dark:text-success/90"
    },
    upcoming: { 
      icon: <Circle className="h-5 w-5 text-muted-foreground/50" />,
      textClass: "text-muted-foreground"
    },
    late: {
      icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      textClass: "text-destructive dark:text-destructive/90"
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
        
        // Enhanced logging for troubleshooting
        console.log(`======= MILESTONE SUBMISSION CHECK =======`);
        console.log(`Milestone: ${milestone.id} (${milestone.name})`);
        console.log(`Has Submission: ${hasSubmission}`);
        console.log(`Submissions Count: ${submissions?.length || 0}`);
        if (submissions && submissions.length > 0) {
          console.log(`First Submission ID: ${submissions[0].id}`);
          console.log(`First Submission Milestone ID: ${submissions[0].milestoneId}`);
          console.log(`First Submission Created: ${submissions[0].createdTime}`);
          console.log(`Raw Milestone Data: ${JSON.stringify(submissions[0].rawMilestone || 'N/A')}`);
        }
        console.log(`=======================================`);
        
        // Update milestone based on validated submission data
        if (hasSubmission && submissions && submissions.length > 0) {
          // Should already be sorted by the MilestoneSubmissionChecker component
          // but we'll sort again to be certain
          const sortedSubmissions = [...submissions].sort((a, b) => {
            // Use timestamp if available, otherwise parse date
            const timeA = a.submissionTimestamp || new Date(a.createdTime).getTime();
            const timeB = b.submissionTimestamp || new Date(b.createdTime).getTime();
            return timeB - timeA; // newest first
          })
          
          const latestSubmission = sortedSubmissions[0]
          console.log(`Using latest submission: ID=${latestSubmission.id}, Date=${latestSubmission.createdTime}`);
          
          // Ensure we have a valid creation date
          let submissionDate = latestSubmission.createdTime;
          let validSubmissionDate = true;
          
          try {
            // Validate the date format
            const parsedDate = new Date(submissionDate);
            if (isNaN(parsedDate.getTime())) {
              console.error(`Invalid submission date format: ${submissionDate}`);
              submissionDate = new Date().toISOString(); // Use current date as fallback
              validSubmissionDate = false;
            }
          } catch (err) {
            console.error(`Error parsing submission date: ${err.message}`);
            submissionDate = new Date().toISOString(); // Use current date as fallback
            validSubmissionDate = false;
          }
          
          // Update milestone with validated submission data
          milestone.hasSubmission = true;
          milestone.submissions = sortedSubmissions;
          milestone.submissionDate = submissionDate;
          milestone.status = "completed";
          milestone.completedDate = submissionDate;
          milestone.validSubmissionDate = validSubmissionDate;
          
          // Include submission ID for reference
          milestone.submissionId = latestSubmission.id;
          
          // Include link if available
          if (latestSubmission.link) {
            milestone.submissionLink = latestSubmission.link;
          }
          
          // Process attachments with validation
          if (latestSubmission.attachments && latestSubmission.attachments.length > 0) {
            // Filter out any invalid attachments
            const validAttachments = latestSubmission.attachments.filter(att => att !== null);
            
            milestone.hasAttachments = validAttachments.length > 0;
            milestone.attachmentCount = validAttachments.length;
            milestone.attachments = validAttachments;
          }
          
          // Log successful update
          console.log(`MILESTONE STATUS UPDATE: ${milestone.id} marked as COMPLETED`);
          console.log(`Submission date: ${milestone.submissionDate}`);
          console.log(`Attachment count: ${milestone.attachmentCount || 0}`);
        } else {
          // No submission - determine status based on due date with enhanced validation
          milestone.hasSubmission = false;
          milestone.submissions = [];
          
          // Check if milestone is past due - with robust date handling
          try {
            let dueDate = null;
            
            if (milestone.dueDate) {
              // Try to parse the due date
              dueDate = parseISO(milestone.dueDate);
              
              // Validate the parsed date
              if (!isValid(dueDate)) {
                console.error(`Invalid due date format: ${milestone.dueDate}`);
                dueDate = null;
              }
            }
            
            // Determine status based on validated due date
            if (dueDate && isPast(dueDate)) {
              milestone.status = "late";
              console.log(`MILESTONE STATUS UPDATE: ${milestone.id} marked as LATE`);
              console.log(`Due date: ${format(dueDate, 'yyyy-MM-dd')} (${milestone.dueDate})`);
            } else if (dueDate) {
              milestone.status = "upcoming";
              console.log(`MILESTONE STATUS UPDATE: ${milestone.id} marked as UPCOMING`);
              console.log(`Due date: ${format(dueDate, 'yyyy-MM-dd')} (${milestone.dueDate})`);
            } else {
              // No valid due date - treat as upcoming
              milestone.status = "upcoming";
              console.log(`MILESTONE STATUS UPDATE: ${milestone.id} marked as UPCOMING (no valid due date)`);
            }
          } catch (err) {
            console.error(`Error processing milestone due date for ${milestone.id}:`, err);
            milestone.status = "upcoming"; // Default to upcoming if date processing fails
            console.log(`MILESTONE STATUS UPDATE: ${milestone.id} marked as UPCOMING (due to error)`);
          }
        }
        
        updatedMilestones[index] = milestone;
        return updatedMilestones;
      });
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
  
  // If no milestones, show empty state message
  if (!milestones || milestones.length === 0 || enhancedMilestones.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex flex-col mb-4">
          <h2 className="text-xl font-bold">
            {programName || "Program Milestones"}
          </h2>
          <p className="text-muted-foreground">
            No milestones have been created yet
          </p>
        </div>
        
        <div className="border rounded-md p-8 text-center">
          <div className="text-muted-foreground mb-2">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-1">No Milestones Available</h3>
            <p className="text-sm">
              The program administrator has not added any milestones to this program yet.
              <br />
              Check back later or contact your program coordinator for more information.
            </p>
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
                    
                    {/* Days remaining indicator - simplified */}
                    {status !== "completed" && daysRemaining !== null && (
                      <Badge variant="outline" className="mt-1 bg-muted/50 border-muted">
                        {daysRemaining <= 0 ? "Due today" : `${daysRemaining} days remaining`}
                      </Badge>
                    )}
                    
                    {/* Submission date (if completed) */}
                    {status === "completed" && milestone.submissionDate && (
                      <div className="flex items-center gap-1 text-xs text-success mt-1">
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
                             status === "late" ? "destructive" : "outline"}
                  >
                    {status === "completed" ? "Completed" : 
                     status === "late" ? "Late" : "Upcoming"}
                  </Badge>
                  
                  {/* Additional submission info */}
                  {milestone.hasSubmission && (
                    <div className="mt-1 flex flex-col text-xs">
                      {milestone.hasAttachments && (
                        <div className="flex items-center gap-1 text-primary">
                          <FileText className="h-3 w-3" />
                          <span>
                            {milestone.attachmentCount > 1 
                              ? `${milestone.attachmentCount} files` 
                              : "1 file"}
                          </span>
                        </div>
                      )}
                      
                      {milestone.submissionLink && (
                        <div className="flex items-center gap-1 text-primary">
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