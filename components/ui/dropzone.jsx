"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { cva } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { UploadIcon, X, FileIcon, ImageIcon, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"

// Define variants using class-variance-authority for consistent styling
const dropzoneVariants = cva(
  "relative flex flex-col items-center justify-center w-full rounded-md transition-all duration-200 cursor-pointer border-2 border-dashed focus:outline-none",
  {
    variants: {
      variant: {
        default: 
          "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 dark:border-neutral-800 dark:bg-neutral-900/20 dark:hover:bg-neutral-800/20",
        success: 
          "border-green-200 bg-green-50/30 hover:bg-green-100/40 dark:border-green-900/50 dark:bg-green-900/10 dark:hover:bg-green-900/20",
        error: 
          "border-red-200 bg-red-50/30 hover:bg-red-100/40 dark:border-red-900/50 dark:bg-red-900/10 dark:hover:bg-red-900/20",
        disabled: 
          "border-neutral-200 bg-neutral-100 cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-900/50",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
      active: {
        true: "border-primary/70 bg-primary/10 dark:border-primary/40 dark:bg-primary/5",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      active: false,
    },
  }
)

const Dropzone = React.forwardRef((
  { 
    className,
    variant,
    size,
    onDrop,
    maxFiles = 1,
    maxSize = 2 * 1024 * 1024, // 2MB default
    accept = {},
    disabled = false,
    filePreview = true,
    children,
    prompt = "Drag & drop your file here, or click to browse",
    subPrompt,
    currentFiles = [],
    onFileRemove,
    ...props 
  }, 
  ref
) => {
  const [error, setError] = React.useState(null)
  const [files, setFiles] = React.useState(currentFiles || [])

  // Set up react-dropzone
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle rejected files (too large, wrong type, etc.)
      if (rejectedFiles?.length > 0) {
        const rejectionError = rejectedFiles[0]?.errors?.[0]
        if (rejectionError) {
          if (rejectionError.code === 'file-too-large') {
            setError(`File is too large. Maximum size is ${formatFileSize(maxSize)}.`)
          } else if (rejectionError.code === 'file-invalid-type') {
            setError('File type not accepted.')
          } else {
            setError(rejectionError.message)
          }
        }
        return
      }

      // Clear any previous errors
      setError(null)
      
      // Process accepted files
      const processedFiles = acceptedFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      )
      
      // Update the local state
      const newFiles = maxFiles === 1 ? processedFiles : [...files, ...processedFiles]
      setFiles(newFiles)
      
      // Call the parent onDrop callback if provided
      if (onDrop) {
        // If single file mode, just pass the file
        if (maxFiles === 1) {
          onDrop(processedFiles[0] || null)
        } else {
          onDrop(newFiles)
        }
      }
    },
    maxFiles,
    maxSize,
    accept,
    disabled,
    multiple: maxFiles !== 1,
  })

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Calculate default subPrompt if not provided
  const defaultSubPrompt = `Maximum file size: ${formatFileSize(maxSize)}${maxFiles === 1 ? '' : `, up to ${maxFiles} files`}`
  
  // Determine variant based on state
  const currentVariant = 
    disabled ? 'disabled' : 
    error ? 'error' : 
    files.length > 0 ? 'success' : 
    variant

  // Handle removing a file
  const handleRemoveFile = (e, fileIndex) => {
    e.stopPropagation()
    
    // Create a copy of the files array
    const updatedFiles = [...files]
    
    // Get the file being removed
    const removedFile = updatedFiles[fileIndex]
    
    // If the file has a preview URL, revoke it to free up memory
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview)
    }
    
    // Remove the file from the array
    updatedFiles.splice(fileIndex, 1)
    
    // Update the local state
    setFiles(updatedFiles)
    
    // Call the parent callback if provided
    if (onFileRemove) {
      onFileRemove(maxFiles === 1 ? null : updatedFiles)
    }
    
    // Clear any error when files are removed
    setError(null)
  }

  // Clean up preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  // Determine icon based on file type
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5" />
    }
    return <FileIcon className="h-5 w-5" />
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps({
          className: cn(
            dropzoneVariants({ 
              variant: currentVariant, 
              size, 
              active: isDragActive
            }),
            className
          ),
          ...props
        })}
        ref={ref}
      >
        <input {...getInputProps()} data-testid="dropzone-input" />
        
        {/* Render file preview only if there are files and preview mode is enabled */}
        {filePreview && files.length > 0 ? (
          <div className="w-full px-1">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-background rounded-md p-2 mb-2 border shadow-sm"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    {file.type.startsWith('image/') && file.preview ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          onLoad={() => { URL.revokeObjectURL(file.preview) }}
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                        {getFileIcon(file)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={(e) => handleRemoveFile(e, index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={isDragActive ? 'active' : 'inactive'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center"
              >
                {isDragActive ? (
                  <>
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <UploadIcon className="h-10 w-10 mb-3 text-primary" />
                    </motion.div>
                    <p className="text-sm font-medium">Drop to upload</p>
                  </>
                ) : (
                  <>
                    <UploadIcon 
                      className={cn(
                        "h-10 w-10 mb-3", 
                        error ? "text-red-500" : "text-muted-foreground"
                      )} 
                    />
                    <p className="text-sm font-medium">{prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">{subPrompt || defaultSubPrompt}</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        
        {children}
      </div>
      
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-red-500 text-xs mt-2"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </motion.div>
      )}
    </div>
  )
})

Dropzone.displayName = "Dropzone"

export { Dropzone }