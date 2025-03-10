import React, { useState, useRef, useEffect } from "react";

import { Progress, Chip } from "@heroui/react";
import { upload } from '@vercel/blob/client';
import { useDashboard } from "@/contexts/DashboardContext";
import { Button } from "@heroui/react";

interface FileUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxSize?: number; // in MB
  maxFiles?: number;
  accept?: string;
  error?: string;
  teamId?: string;
  milestoneId?: string;
  onUploadComplete?: (fileInfo: {url: string; filename: string; contentType: string; size: number;}) => void;
}

export function FileUpload({
  value,
  onChange,
  maxSize = 10,
  maxFiles = 10,
  accept,
  error,
  teamId,
  milestoneId,
  onUploadComplete
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const { teamData } = useDashboard();
  
  // Reset progress when files change
  useEffect(() => {
    const newProgress: Record<string, number> = {};
    value.forEach(file => {
      // If we already have progress for this file, keep it
      if (uploadProgress[file.name]) {
        newProgress[file.name] = uploadProgress[file.name];
      } else {
        // Otherwise set to 100 (complete) as these are already "uploaded" to the component
        newProgress[file.name] = 100;
      }
    });
    setUploadProgress(newProgress);
  }, [value, uploadProgress]);
  
  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    const validFiles = validateFiles(newFiles);
    
    if (validFiles.length > 0) {
      // First add files to the component state
      onChange([...value, ...validFiles]);
      
      // Now handle upload if we have teamId and milestoneId
      if (teamId && milestoneId) {
        await uploadFiles(validFiles);
      } else {
        // If we don't have team/milestone info, just simulate progress
        simulateUploadProgress(validFiles);
      }
    }
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };
  
  // Perform the actual upload via Vercel Blob
  const uploadFiles = async (files: File[]) => {
    setUploadingFiles(true);
    
    try {
      for (const file of files) {
        // Start with 0 progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));
        
        // Create a metadata object for the upload
        const clientPayload = JSON.stringify({
          teamId: teamId || (teamData?.id || ''),
          milestoneId: milestoneId || '',
          fileName: file.name,
          timestamp: new Date().toISOString()
        });
        
        // Use timestamp and safe filename to create a unique path
        const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const folderPath = `uploads/${teamId || 'default'}/${milestoneId || 'default'}`;
        
        try {
          // Track initial progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 10
          }));
          
          // Upload file using client-side Vercel Blob
          const blob = await upload(`${folderPath}/${safeFilename}`, file, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            clientPayload,
            multipart: file.size > 3 * 1024 * 1024 // Use multipart for files > 3MB
          });
          
          // Notify parent of successful upload
          if (onUploadComplete) {
            onUploadComplete({
              url: blob.url,
              filename: file.name,
              contentType: file.type,
              size: file.size
            });
          }
          
          console.log(`File uploaded: ${blob.url}`);
          
          // Set progress to 100% when complete
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          // Mark as failed with red progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: -1 // Use negative value to indicate error
          }));
        }
      }
    } finally {
      setUploadingFiles(false);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(newFiles);
      
      if (validFiles.length > 0) {
        // Add new files to existing ones
        onChange([...value, ...validFiles]);
        
        // Now handle upload if we have teamId and milestoneId
        if (teamId && milestoneId) {
          await uploadFiles(validFiles);
        } else {
          // If we don't have team/milestone info, just simulate progress
          simulateUploadProgress(validFiles);
        }
      }
    }
  };
  
  // Validate files
  const validateFiles = (files: File[]): File[] => {
    // Check if adding these files would exceed the max file count
    if (value.length + files.length > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} files.`);
      return files.slice(0, maxFiles - value.length);
    }
    
    // Validate file types and sizes
    return files.filter(file => {
      // Validate file type if accept is specified
      if (accept) {
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()}`;
        const acceptTypes = accept.split(',');
        
        const isValidType = acceptTypes.some(type => {
          if (type.startsWith('.')) {
            // Check by extension
            return fileExtension.toLowerCase() === type.toLowerCase();
          } else {
            // Check by MIME type
            return fileType.match(new RegExp(type.replace('*', '.*')));
          }
        });
        
        if (!isValidType) {
          alert(`File type not supported: ${file.name}`);
          return false;
        }
      }
      
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File too large: ${file.name} (max ${maxSize}MB)`);
        return false;
      }
      
      return true;
    });
  };
  
  // Simulate upload progress for local-only operation
  const simulateUploadProgress = (files: File[]) => {
    files.forEach(file => {
      // Start with 0 progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));
      
      // Simulate progress with async/await pattern
      const simulateProgress = async () => {
        let progress = 0;
        while (progress < 100) {
          await new Promise(resolve => setTimeout(resolve, 200));
          progress += Math.random() * 10;
          if (progress >= 100) progress = 100;
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        }
      };
      
      // Start simulation
      simulateProgress();
    });
  };
  
  // Remove a file
  const handleRemoveFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };
  
  // Format file size
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : error
              ? "border-danger bg-danger/5" 
              : "border-default-300 hover:border-primary hover:bg-default-50"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept={accept}
          onChange={handleFileChange}
          disabled={uploadingFiles}
        />
        
        <div className="flex flex-col items-center justify-center gap-2">
          <svg
            className={`w-12 h-12 ${error ? "text-danger" : "text-default-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <div className="text-sm font-medium">
            {error ? (
              <p className="text-danger">{error}</p>
            ) : (
              <>
                <p className="text-default-700">
                  {uploadingFiles ? (
                    "Uploading files..."
                  ) : (
                    <>
                      Drag & drop files here or{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={handleButtonClick}
                      >
                        browse
                      </button>
                    </>
                  )}
                </p>
                <p className="text-default-500 text-xs mt-1">
                  Maximum {maxFiles} files, up to {maxSize}MB each
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <span className="text-xs text-default-500">{formatFileSize(file.size)}</span>
                </div>
                
                <Progress
                  value={Math.max(0, uploadProgress[file.name] || 0)}
                  color={
                    uploadProgress[file.name] === 100 
                      ? "success" 
                      : uploadProgress[file.name] === -1 
                        ? "danger" 
                        : "primary"
                  }
                  size="sm"
                  className="w-full"
                />
                
                {uploadProgress[file.name] === -1 && (
                  <p className="text-xs text-danger mt-1">Upload failed. Please try again.</p>
                )}
              </div>
              
              <Button
                isIconOnly
                variant="light"
                color="danger"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                aria-label="Remove file"
                isDisabled={uploadingFiles}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}