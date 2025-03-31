"use client"

import { useState, useCallback, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { format, parseISO, isValid } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { upload } from "@vercel/blob/client"
import { FILE_UPLOAD, formatFileSize } from "@/lib/constants"
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
    // Maximum allowed combined file size
    const MAX_TOTAL_SIZE = FILE_UPLOAD.MILESTONE_SUBMISSION.MAX_SIZE;
    const MAX_SINGLE_FILE_SIZE = MAX_TOTAL_SIZE / 2; // Half of total limit for a single file
    
    // Filter out files that are too large or not compatible
    const validFiles = [];
    let totalSize = 0;
    
    acceptedFiles.forEach(file => {
      // Check file size
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        toast.error(`"${file.name}" is too large. Files must be under ${formatFileSize(MAX_SINGLE_FILE_SIZE)} each.`);
        return;
      }
      
      // Check total accumulated size
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        toast.error(`Total file size exceeds ${formatFileSize(MAX_TOTAL_SIZE)} limit. "${file.name}" was not added.`);
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
    maxSize: FILE_UPLOAD.MILESTONE_SUBMISSION.MAX_SIZE, // From constants
    accept: FILE_UPLOAD.MILESTONE_SUBMISSION.ALLOWED_TYPES,
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
    // Show toast for upload start
    const toastId = toast.loading(`Preparing to upload ${file.name}...`);
    
    try {
      // Create a unique folder path for each team/milestone combination
      // Include a timestamp to avoid filename conflicts
      const timestamp = Date.now();
      const folderPath = `${FILE_UPLOAD.MILESTONE_SUBMISSION.FOLDER_PATH}/team-${teamData.id}/milestone-${milestone.id}/${timestamp}`;
      
      // Clean up the file name to avoid path issues
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Create a clientPayload with metadata
      const clientPayload = JSON.stringify({
        teamId: teamData.id,
        milestoneId: milestone.id,
        fileName: safeFilename,
        timestamp: timestamp
      });

      // Track progress for this file
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          progress: 0,
          total: 100,
          status: 'uploading'
        }
      }));
      
      console.log(`Starting upload of ${safeFilename} to Vercel Blob...`);
      
      // Add a timeout to catch stalled uploads
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Upload timed out after 30 seconds. The server may not be configured correctly.'));
        }, 30000); // 30 second timeout
      });
      
      // Pure client-side upload with Vercel Blob client
      const uploadPromise = upload(`${folderPath}/${safeFilename}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload,
        multipart: file.size > 3 * 1024 * 1024, // Use multipart for files larger than 3MB
        maxRetries: 3, // Retry failed uploads up to 3 times
        retryDelay: 1000, // Wait 1 second between retries
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
          }));
          
          // Update toast with progress
          toast.loading(`Uploading ${file.name}... ${Math.round(percentage)}%`, {
            id: toastId
          });
        }
      });
      
      // Race between the upload and the timeout
      const blob = await Promise.race([uploadPromise, timeoutPromise]);
      
      // Update progress state to complete
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          progress: 100,
          total: 100,
          percentage: 100,
          status: 'completed'
        }
      }));

      // Success toast
      toast.success(`Uploaded ${file.name}`, {
        id: toastId
      });

      // Return the blob URL and metadata
      return {
        url: blob.url,
        filename: file.name,
        contentType: file.type,
        size: file.size
      };
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      
      // Update toast with error
      toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`, {
        id: toastId,
        duration: 5000 // Show error for longer
      });
      
      // Update progress state to error
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: {
          ...(prev[file.name] || {}),
          status: 'error',
          error: error.message || 'Upload failed'
        }
      }));
      
      // Check for specific error types and provide better error messages based on the Vercel Blob documentation
      let errorMessage = 'Failed to upload file';
      let shouldSuggestLinkOption = false;
      
      if (error.message) {
        // Check for specific Vercel Blob error patterns
        if (error.message.includes('token') || error.message.includes('Failed to retrieve the client token')) {
          errorMessage = 'Authentication error during upload. Please use the link option instead.';
          console.log('Blob token error: Server may be missing FILE_UPLOAD_READ_WRITE_TOKEN environment variable');
          shouldSuggestLinkOption = true;
          
          // Switch to link tab automatically after a short delay
          setTimeout(() => {
            setCurrentTab('link');
            toast.info('Switched to link submission due to upload issues', { 
              duration: 4000,
              icon: <LinkIcon className="h-4 w-4"/>
            });
          }, 1500);
          
        } else if (error.message.includes('allowedContentTypes')) {
          errorMessage = 'File type not allowed. Please upload a supported file type.';
          console.log('Content type rejected by Vercel Blob:', file.type);
          
        } else if (error.message.includes('maximumSizeInBytes') || error.message.includes('size')) {
          errorMessage = `File exceeds maximum size limit (${formatFileSize(FILE_UPLOAD.MILESTONE_SUBMISSION.MAX_SIZE / 2)}).`;
          shouldSuggestLinkOption = true;
          
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error during upload. Please check your connection or use the link option.';
          shouldSuggestLinkOption = true;
          
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. Please try using the link option instead.';
          shouldSuggestLinkOption = true;
          
        } else if (error.message.includes('aborted')) {
          errorMessage = 'Upload was cancelled.';
          
        } else if (error.message.includes('multipart')) {
          errorMessage = 'Error during multipart upload. Please try again with a smaller file.';
          shouldSuggestLinkOption = true;
          
        } else if (error.message.includes('access')) {
          errorMessage = 'Access denied. File storage is not correctly configured.';
          shouldSuggestLinkOption = true;
          console.error('Blob access error:', error);
        }
      }
      
      // Add link suggestion to error message if appropriate
      if (shouldSuggestLinkOption) {
        toast.info(
          'Try uploading your file to Google Drive, Dropbox or similar service and share the link instead', 
          { duration: 8000 }
        );
      }
      
      // Log enhanced error for debugging
      console.log(`Upload failed with error: ${errorMessage}`, error);
      
      // Throw a more specific error to be handled by the submission process
      throw new Error(errorMessage);
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
      let uploadFailed = false
      
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
            // Log the specific error but continue with other files
            console.error(`Error uploading ${file.name}:`, error);
            uploadFailed = true;
          }
        }
        
        // Check if any files were uploaded successfully when files were provided
        if (fileUrls.length === 0 && files.length > 0) {
          // If we also have a link, we can still proceed with just the link
          if (!linkUrl) {
            throw new Error("None of the files could be uploaded. Please try again or provide a link instead.")
          } else {
            toast.warning("File uploads failed. Proceeding with link submission only.");
          }
        } else if (uploadFailed) {
          // Some files failed but others succeeded
          toast.warning(`${files.length - fileUrls.length} of ${files.length} files failed to upload.`);
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
      
      // Show toast for submission processing
      const submissionToastId = toast.loading("Processing submission...");
      
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
        console.error("Submission error response:", responseData);
        toast.error(responseData.details || responseData.error || "Failed to submit", {
          id: submissionToastId
        });
        throw new Error(responseData.details || responseData.error || "Failed to submit");
      }
      
      // Check for warnings in the response
      if (responseData.warning) {
        toast.warning(responseData.warning);
        console.warn("Submission warning:", responseData.warning);
      }
      
      toast.success("Milestone submission successful", {
        id: submissionToastId
      });

      // Trigger a refresh of milestone submissions
      // We need to delay this slightly to ensure the backend data is updated
      setTimeout(async () => {
        try {
          // Get the React Query queryClient to invalidate caches
          const queryClient = window._queryClient;
          
          // Invalidate both the specific milestone submissions query and all other related queries
          if (queryClient) {
            console.log("Invalidating React Query caches for milestone submission");
            
            // The CORRECT way: completely reset and refetch from server
            // This is more reliable than invalidation + refetch
            queryClient.resetQueries({ 
              queryKey: ['submissions', teamData.id, milestone.id],
              exact: true // Only this exact query
            });
            
            // Also reset the general team submissions query
            queryClient.resetQueries({ 
              queryKey: ['submissions', teamData.id, null],
              exact: true // Only this exact query  
            });
            
            // Use a small timeout to ensure state updates properly
            setTimeout(() => {
              // Now force a refetch with fresh data
              queryClient.refetchQueries({ 
                queryKey: ['submissions', teamData.id],
                exact: false, // Include milestone-specific queries
                type: 'all' // Important: refetch ALL queries even if inactive
              });
            }, 100);
            
            // Server-side cache invalidation removed. Client-side invalidation handles refresh.
            console.log("Refreshing milestone data via React Query client-side invalidation.");
            
          } else {
            console.warn("QueryClient not available for cache invalidation, falling back to fetch");
          }
          
          // Fetch the latest submissions for this milestone
          const refreshResponse = await fetch(`/api/teams/${teamData.id}/submissions?milestoneId=${milestone.id}`);
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log("Refreshed submission data:", refreshData);
            
            // If the milestone has an onSubmissionUpdated callback, call it with the new data
            if (milestone?.onSubmissionUpdated) {
              milestone.onSubmissionUpdated(refreshData);
            }
            
            // Dispatch a custom event that parent components can listen for
            const submissionEvent = new CustomEvent('milestoneSubmissionUpdated', {
              detail: {
                milestoneId: milestone.id,
                teamId: teamData.id,
                submissions: refreshData
              }
            });
            window.dispatchEvent(submissionEvent);
          }
        } catch (refreshError) {
          console.error("Error refreshing submission data:", refreshError);
          // Don't throw here, as the submission itself was successful
        }
      }, 1000);
      
      // Reset form
      setFiles([])
      setUploadedFiles([])
      setUploadProgress({})
      setLinkUrl("")
      setComments("")
      
      // Close dialog after a small delay to ensure success message is seen
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
    } catch (error) {
      console.error("Submission error:", error);
      
      // Provide better error messaging based on the error
      let errorMessage = error.message || "Failed to submit";
      
      // If the error is related to file upload and we have a link, suggest using link only
      if (errorMessage.includes("upload") && linkUrl) {
        errorMessage += " Consider submitting with just the link.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
        <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${
              status === 'error' ? 'bg-destructive' : 
              status === 'completed' ? 'bg-green-500 dark:bg-green-600' : 
              'bg-primary'
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
            <span className="text-xs text-green-600 dark:text-green-400">Complete</span>
          )}
          {status === 'error' && (
            <span className="text-xs text-destructive">Failed</span>
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
            <div key={index} className="p-2 border rounded bg-muted/40 dark:bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className={`h-4 w-4 mr-2 ${isUploaded ? 'text-green-500 dark:text-green-400' : 'text-primary'}`} />
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
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
            <p className="text-sm">
              There are no submissions for this milestone.
              <br />
              Use the &quot;Submit&quot; button on the milestone table to make a submission.
            </p>
          </div>
        </div>
      )
    }
    
    return (
      <Table className="w-full table-fixed">
        <TableCaption>Submissions for this milestone</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Date</TableHead>
            <TableHead className="w-[20%]">Type</TableHead>
            <TableHead className="w-[50%]">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {milestone.submissions.map((submission, index) => (
            <TableRow key={index}>
              <TableCell className="align-top">
                {formatDate(submission.createdTime)}
              </TableCell>
              <TableCell className="align-top">
                {submission.attachments && submission.attachments.length > 0 && (
                  <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10">
                    <FileText className="h-3 w-3 mr-1" />
                    File
                  </Badge>
                )}
                {submission.link && (
                  <Badge variant="outline" className="border-green-500/20 text-green-600 dark:text-green-400 bg-green-500/10 ml-1">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Link
                  </Badge>
                )}
              </TableCell>
              <TableCell className="align-top break-words">
                <div className="space-y-1">
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="flex flex-wrap items-center text-sm">
                      <FileText className="h-3.5 w-3.5 mr-1 text-primary" />
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
                        console.log("Attachment data sample:", JSON.stringify(submission.attachments[0]));
                        
                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {submission.attachments.map((att, i) => {
                              // Skip null or undefined attachments
                              if (!att) return null;
                              
                              // Get file information
                              const fileUrl = att.url || '#';
                              const fileName = att.filename || `File ${i+1}`;
                              const fileType = att.type || '';
                              
                              // Only render if we have a URL
                              if (fileUrl === '#') {
                                console.log("Missing URL for attachment:", att);
                                return null;
                              }
                              
                              // Icons based on file type
                              let fileIcon = <FileText className="h-3 w-3 mr-1" />;
                              let bgColor = "bg-blue-50";
                              
                              // Customize appearance based on file type
                              if (fileType.includes('image/')) {
                                bgColor = "bg-purple-50";
                              } else if (fileType.includes('pdf')) {
                                bgColor = "bg-red-50";
                              } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
                                bgColor = "bg-green-50";
                              } else if (fileType.includes('document') || fileType.includes('word')) {
                                bgColor = "bg-blue-50";
                              }
                              
                              return (
                                <a 
                                  key={i}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-blue-700 hover:underline text-xs ${bgColor} px-2 py-1 rounded-md flex items-center`}
                                  title={fileName}
                                >
                                  {fileIcon}
                                  {fileName.length > 15 ? `${fileName.substring(0, 12)}...` : fileName}
                                </a>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {submission.link && (
                    <div className="flex items-center text-sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1 text-primary" />
                      <a 
                        href={submission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {submission.link.length > 30 ? `${submission.link.substring(0, 30)}...` : submission.link}
                      </a>
                    </div>
                  )}
                  
                  {submission.comments && (
                    <div className="text-xs text-muted-foreground mt-1 break-words">
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "submit" ? "Submit Milestone" : "View Submissions"}
          </DialogTitle>
          <DialogDescription>
            {milestone?.name} - {programName}
          </DialogDescription>
        </DialogHeader>
        
        {/* Milestone details */}
        <div className="bg-muted/30 p-3 rounded-md text-sm">
          {milestone?.dueDate && (
            <div className="flex items-center mb-1">
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">Due: {formatDate(milestone.dueDate)}</span>
            </div>
          )}
          
          <div className="flex items-center mb-2">
            {milestone?.status === "completed" ? (
              <CheckCircle className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />
            ) : milestone?.status === "late" ? (
              <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
            ) : milestone?.status === "in_progress" ? (
              <Clock className="h-4 w-4 mr-1 text-primary" />
            ) : (
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            )}
            <span className={
              milestone?.status === "completed" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
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
                  a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-border pl-2 italic my-2" {...props} />,
                  code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded my-2 overflow-auto" {...props} />
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
                  {/* Add Link Option Notice */}
                  <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-warning mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-foreground">File Upload Alternative</p>
                        <p className="text-xs text-warning-foreground/80 mt-0.5">
                          If file upload doesn&apos;t work, you can upload your file to Google Drive, Dropbox, 
                          or another service and share the link using the &quot;Add Link&quot; tab.
                        </p>
                      </div>
                    </div>
                  </div>
                
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {isDragActive ? "Drop files here" : "Drag and drop files here, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Accepts PDF, Word, Excel, PowerPoint, images, and ZIP (Max {formatFileSize(FILE_UPLOAD.MILESTONE_SUBMISSION.MAX_SIZE)})
                    </p>
                  </div>
                  
                  {renderFileList()}
                  
                  {/* Easy switch to link tab */}
                  {files.length === 0 && (
                    <button 
                      type="button"
                      onClick={() => setCurrentTab('link')}
                      className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                    >
                      <LinkIcon className="h-3.5 w-3.5 mr-1" />
                      Switch to link submission instead
                    </button>
                  )}
                </div>
              )}
              
              {/* Link input */}
              {currentTab === 'link' && (
                <div className="space-y-3">
                  {/* Instructions panel */}
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-md mb-4">
                    <h3 className="text-sm font-medium text-primary-foreground mb-1">How to share your work via a link</h3>
                    <ol className="text-xs text-primary-foreground/80 list-decimal ml-4 space-y-1">
                      <li>Upload your file to a cloud storage service (Google Drive, Dropbox, OneDrive, etc.)</li>
                      <li>Create a shareable link with <b>public access</b> to the file</li>
                      <li>Copy the link and paste it below</li>
                    </ol>
                  </div>
                
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
                  
                  {/* Link type selection */}
                  <div className="mt-2">
                    <Label className="text-xs mb-1 block">Link type (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Google Drive", "Dropbox", "OneDrive", "GitHub", "Other"].map(type => (
                        <Badge 
                          key={type}
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => {
                            // Could set link type metadata here
                            toast.info(`Selected ${type} link type`, { duration: 1500 });
                          }}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Make sure your link is publicly accessible so reviewers can view it
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
