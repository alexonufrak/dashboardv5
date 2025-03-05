"use client"

import { useState, useCallback, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { format, parseISO, isValid } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { upload } from "@vercel/blob/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  UploadCloud,
  X,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"

/**
 * MilestoneSubmissionDialog Component
 * Handles viewing and creating submissions for milestones
 */
export default function MilestoneSubmissionDialog({
  milestone,
  mode = "submit", // "submit" or "view"
  open,
  onOpenChange,
  programName,
}) {
  const { teamData } = useDashboard()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState([])
  const [linkUrl, setLinkUrl] = useState("")
  const [comments, setComments] = useState("")
  const [currentTab, setCurrentTab] = useState("file") // "file" or "link"

  // Format date for display
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

  // Dropzone setup
  const onDrop = useCallback(acceptedFiles => {
    // Maximum allowed combined file size (10MB)
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
    
    // Filter out files that are too large or not compatible
    const validFiles = [];
    let totalSize = 0;
    
    acceptedFiles.forEach(file => {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Files must be under 5MB each.`);
        return;
      }
      
      // Check total accumulated size
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        toast.error(`Total file size exceeds 10MB limit. "${file.name}" was not added.`);
        return;
      }
      
      // Add to valid files and update total size
      totalSize += file.size;
      validFiles.push(file);
    });
    
    // If we have any valid files, add them to the state
    if (validFiles.length > 0) {
      // Add preview URL to each file object
      const filesWithPreview = validFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      );
      
      setFiles(prev => [...prev, ...filesWithPreview]);
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 5,
    maxSize: 10485760, // 10MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt']
    },
    onDropRejected: (rejectedFiles) => {
      // Show a toast for each rejected file
      rejectedFiles.forEach(rejection => {
        const { file, errors } = rejection;
        const errorMessages = errors.map(e => e.message).join(', ');
        toast.error(`${file.name}: ${errorMessages}`);
      });
    }
  })

  // Remove file from list
  const removeFile = (file) => {
    const newFiles = [...files]
    const index = newFiles.indexOf(file)
    if (index > -1) {
      newFiles.splice(index, 1)
      setFiles(newFiles)
    }
  }

  // State for tracking upload progress
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState([])

  // Handle file upload to Vercel Blob
  const uploadFileToBlob = async (file) => {
    try {
      // Create a unique folder path for each team/milestone combination
      const folderPath = `team-${teamData.id}/milestone-${milestone.id}`

      // Create a clientPayload with metadata
      const clientPayload = JSON.stringify({
        teamId: teamData.id,
        milestoneId: milestone.id,
        fileName: file.name
      })

      // Show toast for upload start
      const toastId = toast.loading(`Uploading ${file.name}...`)

      // Track progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          progress: 0,
          total: 100,
          status: 'uploading'
        }
      }))
      
      // Upload file to Vercel Blob
      const blob = await upload(`${folderPath}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload,
        maxRetries: 3, // Add retries for reliability
        onUploadProgress: ({ loaded, total, percentage }) => {
          // Update progress state
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              progress: loaded,
              total,
              percentage,
              status: 'uploading'
            }
          }))
          
          // Update toast with progress
          toast.loading(`Uploading ${file.name}... ${Math.round(percentage)}%`, {
            id: toastId
          })
        }
      })

      // Update progress state to complete
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          progress: 100,
          total: 100,
          percentage: 100,
          status: 'completed'
        }
      }))

      // Success toast
      toast.success(`Uploaded ${file.name}`, {
        id: toastId
      })

      // Return the blob URL and metadata
      return {
        url: blob.url,
        filename: file.name,
        contentType: file.type,
        size: file.size
      }
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error)
      toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`)
      
      // Update progress state to error
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          ...prev[file.name],
          status: 'error'
        }
      }))
      
      // Throw error to be caught by caller
      throw error
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!teamData?.id || !milestone?.id) {
      toast.error("Missing team or milestone information")
      return
    }
    
    // Make sure we have either files or a link
    if (files.length === 0 && !linkUrl) {
      toast.error("Please upload at least one file or provide a link")
      return
    }
    
    // Validate link if provided
    if (linkUrl && !isValidUrl(linkUrl)) {
      toast.error("Please enter a valid URL")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Step 1: Upload files to Vercel Blob (if any)
      const fileUrls = []
      
      if (files.length > 0) {
        // Clear any previous uploaded files
        setUploadedFiles([])
        
        // Upload files in sequence
        for (const file of files) {
          try {
            const uploadedFile = await uploadFileToBlob(file)
            fileUrls.push(uploadedFile)
            
            // Track successfully uploaded files
            setUploadedFiles(prev => [...prev, uploadedFile])
          } catch (error) {
            // Individual file upload errors are already handled by uploadFileToBlob
            // Continue with other files
          }
        }
        
        // Check if any files were uploaded successfully
        if (fileUrls.length === 0 && files.length > 0) {
          throw new Error("None of the files could be uploaded. Please try again.")
        }
      }
      
      // Step 2: Submit the milestone with file URLs
      const submissionData = {
        teamId: teamData.id,
        milestoneId: milestone.id,
        fileUrls,
        comments
      }
      
      if (linkUrl) {
        submissionData.link = linkUrl
      }
      
      // Make API request to create the submission
      const response = await fetch("/api/teams/submissions", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        console.error("Submission error response:", responseData)
        throw new Error(responseData.details || responseData.error || "Failed to submit")
      }
      
      // Check for warnings in the response
      if (responseData.warning) {
        toast.warning(responseData.warning)
        console.warn("Submission warning:", responseData.warning)
      }
      
      toast.success("Milestone submission successful")
      
      // Reset form
      setFiles([])
      setUploadedFiles([])
      setUploadProgress({})
      setLinkUrl("")
      setComments("")
      
      // Close dialog
      onOpenChange(false)
      
      // Trigger a refetch of milestone data (would happen through context update)
    } catch (error) {
      console.error("Submission error:", error)
      toast.error(error.message || "Failed to submit")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to validate URL
  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // Render file upload progress
  const renderUploadProgress = (file) => {
    const fileProgress = uploadProgress[file.name]
    
    if (!fileProgress) return null
    
    const { percentage, status } = fileProgress
    
    return (
      <div className="mt-1">
        <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${
              status === 'error' ? 'bg-red-500' : 
              status === 'completed' ? 'bg-green-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${percentage || 0}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-muted-foreground">
            {status === 'error' ? 'Upload failed' : 
             status === 'completed' ? 'Uploaded' : 
             `${Math.round(percentage || 0)}%`}
          </span>
          {status === 'completed' && (
            <span className="text-xs text-green-600">Complete</span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-600">Failed</span>
          )}
        </div>
      </div>
    )
  }

  // Render file list with previews and upload progress
  const renderFileList = () => {
    if (files.length === 0) return null
    
    return (
      <div className="mt-2 space-y-2">
        {files.map((file, index) => {
          // Check if this file has been uploaded successfully
          const isUploaded = uploadedFiles.some(u => u.filename === file.name)
          
          return (
            <div key={index} className="p-2 border rounded bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className={`h-4 w-4 mr-2 ${isUploaded ? 'text-green-500' : 'text-blue-500'}`} />
                  <span className="text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                {!isSubmitting && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(file)}
                    className="h-6 w-6 p-0" 
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Render progress bar during upload */}
              {renderUploadProgress(file)}
            </div>
          )
        })}
      </div>
    )
  }

  // Render submission list for view mode
  const renderSubmissions = () => {
    if (!milestone.submissions || milestone.submissions.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
            <p className="text-sm">
              There are no submissions for this milestone.
              <br />
              Use the "Submit" button on the milestone table to make a submission.
            </p>
          </div>
        </div>
      )
    }
    
    return (
      <Table>
        <TableCaption>Submissions for this milestone</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {milestone.submissions.map((submission, index) => (
            <TableRow key={index}>
              <TableCell>
                {formatDate(submission.createdTime)}
              </TableCell>
              <TableCell>
                {submission.attachments && submission.attachments.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <FileText className="h-3 w-3 mr-1" />
                    File
                  </Badge>
                )}
                {submission.link && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-1">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Link
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="flex items-center text-sm">
                      <FileText className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      <span>
                        {submission.attachments.length} {submission.attachments.length === 1 ? 'file' : 'files'}
                      </span>
                      {/* Advanced attachment handling with comprehensive validation */}
                      {(() => {
                        // Early return if no attachments
                        if (!submission.attachments || submission.attachments.length === 0) {
                          return null;
                        }
                        
                        // Log attachment data for debugging
                        console.log(`Processing ${submission.attachments.length} attachments for submission ${submission.id}`);
                        
                        // Filter to only valid attachments with URLs
                        const validAttachments = submission.attachments.filter(att => {
                          // Skip null or undefined attachments
                          if (!att) {
                            console.log(`Skipping null attachment`);
                            return false;
                          }
                          
                          // Check for direct URL
                          if (att.url) {
                            return true;
                          }
                          
                          // Check for thumbnail URLs
                          if (att.thumbnails?.large?.url || att.thumbnails?.small?.url) {
                            return true;
                          }
                          
                          // Check for filename and type (could be an Airtable attachment format)
                          if (att.filename && att.type) {
                            console.log(`Found Airtable attachment: ${att.filename}`);
                            return true;
                          }
                          
                          console.log(`Invalid attachment format:`, att);
                          return false;
                        });
                        
                        console.log(`Found ${validAttachments.length} valid attachments of ${submission.attachments.length} total`);
                        
                        // Map valid attachments to links
                        return validAttachments.map((att, i) => {
                          // Get the best available URL
                          let fileUrl = '#';
                          let fileName = `File ${i+1}`;
                          
                          // Direct URL - best option
                          if (att.url) {
                            fileUrl = att.url;
                            fileName = att.filename || `File ${i+1}`;
                          } 
                          // Thumbnail URL from Airtable - second best option
                          else if (att.thumbnails?.large?.url) {
                            fileUrl = att.thumbnails.large.url;
                            fileName = att.filename || `File ${i+1}`;
                          }
                          // Small thumbnail fallback
                          else if (att.thumbnails?.small?.url) {
                            fileUrl = att.thumbnails.small.url;
                            fileName = att.filename || `File ${i+1}`;
                          }
                          // Last resort - use the ID as a key
                          else if (att.id) {
                            fileUrl = '#'; // No direct URL available
                            fileName = att.filename || `File ${i+1}`;
                          }
                          
                          return (
                            <a 
                              key={i}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-2 text-xs"
                              title={fileName}
                            >
                              {fileName.length > 15 ? `${fileName.substring(0, 12)}...` : fileName}
                            </a>
                          );
                        });
                      })()}
                    </div>
                  )}
                  
                  {submission.link && (
                    <div className="flex items-center text-sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      <a 
                        href={submission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {submission.link.length > 30 ? `${submission.link.substring(0, 30)}...` : submission.link}
                      </a>
                    </div>
                  )}
                  
                  {submission.comments && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {submission.comments.length > 100 
                        ? `${submission.comments.substring(0, 100)}...` 
                        : submission.comments}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "submit" ? "Submit Milestone" : "View Submissions"}
          </DialogTitle>
          <DialogDescription>
            {milestone?.name} - {programName}
          </DialogDescription>
        </DialogHeader>
        
        {/* Milestone details */}
        <div className="bg-gray-50 p-3 rounded-md text-sm">
          {milestone?.dueDate && (
            <div className="flex items-center mb-1">
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">Due: {formatDate(milestone.dueDate)}</span>
            </div>
          )}
          
          <div className="flex items-center mb-2">
            {milestone?.status === "completed" ? (
              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            ) : milestone?.status === "late" ? (
              <AlertCircle className="h-4 w-4 mr-1 text-red-600" />
            ) : milestone?.status === "in_progress" ? (
              <Clock className="h-4 w-4 mr-1 text-blue-600" />
            ) : (
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
            )}
            <span className={
              milestone?.status === "completed" ? "text-green-600" : "text-gray-500"
            }>
              Status: {
                milestone?.status === "completed" ? "Completed" : "Upcoming"
              }
            </span>
          </div>
          
          {milestone?.description && (
            <div className="text-sm text-muted-foreground">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="markdown-content"
                components={{
                  p: ({node, ...props}) => <p className="mb-2" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-md font-bold mt-3 mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-300 pl-2 italic my-2" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-auto" {...props} />
                }}
              >
                {milestone.description}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {mode === "submit" ? (
          /* Submit mode - Show file upload form */
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tab navigation between file and link */}
              <div className="flex border-b">
                <div 
                  className={`py-2 px-4 cursor-pointer ${currentTab === 'file' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                  onClick={() => setCurrentTab('file')}
                >
                  Upload Files
                </div>
                <div 
                  className={`py-2 px-4 cursor-pointer ${currentTab === 'link' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
                  onClick={() => setCurrentTab('link')}
                >
                  Add Link
                </div>
              </div>
              
              {/* File upload */}
              {currentTab === 'file' && (
                <div>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {isDragActive ? "Drop files here" : "Drag and drop files here, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepts PDF, Word, Excel, PowerPoint, images, and ZIP (Max 10MB)
                    </p>
                  </div>
                  
                  {renderFileList()}
                </div>
              )}
              
              {/* Link input */}
              {currentTab === 'link' && (
                <div className="space-y-2">
                  <Label htmlFor="link">Add a link to your work</Label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add a link to Google Drive, GitHub, or other external resources
                  </p>
                </div>
              )}
              
              {/* Comments area */}
              <div className="space-y-2">
                <Label htmlFor="comments">Comments (optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any additional context or notes about your submission"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || (files.length === 0 && !linkUrl)}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* View mode - Show submission history */
          <div className="space-y-4">
            {renderSubmissions()}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}