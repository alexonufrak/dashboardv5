import React, { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Progress, Chip } from "@heroui/react";

interface FileUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxSize?: number; // in MB
  maxFiles?: number;
  accept?: string;
  error?: string;
}

export function FileUpload({
  value,
  onChange,
  maxSize = 5,
  maxFiles = 10,
  accept,
  error
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    const validFiles = validateFiles(newFiles);
    
    if (validFiles.length > 0) {
      // Simulate upload progress
      simulateUploadProgress(validFiles);
      
      // Add new files to existing ones
      onChange([...value, ...validFiles]);
    }
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
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
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(newFiles);
      
      if (validFiles.length > 0) {
        // Simulate upload progress
        simulateUploadProgress(validFiles);
        
        // Add new files to existing ones
        onChange([...value, ...validFiles]);
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
  
  // Simulate upload progress
  const simulateUploadProgress = (files: File[]) => {
    files.forEach(file => {
      // Start with 0 progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));
      
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
      }, 200);
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
                  Drag & drop files here or{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={handleButtonClick}
                  >
                    browse
                  </button>
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
                  value={uploadProgress[file.name] || 0}
                  color={uploadProgress[file.name] === 100 ? "success" : "primary"}
                  size="sm"
                  className="w-full"
                />
              </div>
              
              <Button
                isIconOnly
                variant="light"
                color="danger"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                aria-label="Remove file"
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