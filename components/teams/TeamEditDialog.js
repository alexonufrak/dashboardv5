"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dropzone } from "@/components/ui/dropzone"
import { AlertCircle, ImageIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateTeamData } from "@/lib/useDataFetching"
import { upload } from '@vercel/blob/client'
import { toast } from 'sonner'
import { FILE_UPLOAD, formatFileSize } from "@/lib/constants"

/**
 * Dialog component for editing team details
 * @param {Object} props - Component props
 * @param {Object} props.team - Team data object
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onTeamUpdated - Callback function when team is updated
 */
const TeamEditDialog = ({ team, open, onClose, onTeamUpdated }) => {
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [headerImage, setHeaderImage] = useState(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Reset form data when team changes
  useEffect(() => {
    if (team) {
      setTeamName(team.name || "")
      setTeamDescription(team.description || "")
      setHeaderImage(null) // Reset image selection when team changes
    }
  }, [team])

  // Handle header image upload to Vercel Blob
  const uploadHeaderImage = async () => {
    if (!headerImage) return null
    
    try {
      setIsUploading(true)
      const toastId = toast.loading(`Uploading team header image...`)
      
      // Create a unique folder path for the team header
      const timestamp = Date.now()
      const folderPath = `${FILE_UPLOAD.TEAM_IMAGE.FOLDER_PATH}/${timestamp}`
      
      // Clean up the file name
      const safeFilename = headerImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      
      // Create a payload with metadata
      const clientPayload = JSON.stringify({
        type: 'team-header',
        timestamp
      })
      
      // Upload the file to Vercel Blob
      const blob = await upload(`${folderPath}/${safeFilename}`, headerImage, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload,
        onUploadProgress: ({ percentage }) => {
          toast.loading(`Uploading team header image... ${Math.round(percentage)}%`, { id: toastId })
        }
      })
      
      toast.success('Team header image uploaded', { id: toastId })
      setIsUploading(false)
      
      // Return an object with the necessary file information for Airtable
      return {
        url: blob.url,
        filename: headerImage.name || safeFilename,
        contentType: headerImage.type,
        size: headerImage.size
      }
    } catch (error) {
      console.error('Error uploading team header:', error)
      toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`)
      setIsUploading(false)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!team?.id) {
      setError("Missing team ID")
      return
    }
    
    // Validate form data
    if (!teamName.trim()) {
      setError("Please enter a team name")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      // Upload header image if one is provided
      let fileInfo = null
      if (headerImage) {
        fileInfo = await uploadHeaderImage()
      }
      
      // Prepare update data
      const updateData = {
        name: teamName,
        description: teamDescription
      }
      
      // Add file info if available
      if (fileInfo) {
        updateData.fileInfo = fileInfo
      }
      
      // Create local copy of updated team data to use immediately
      // This makes UI updates immediate without waiting for refresh
      const updatedTeamLocal = {
        ...team,
        name: teamName,
        description: teamDescription
      }
      
      // If we uploaded an image, add it to the local copy
      if (fileInfo) {
        updatedTeamLocal.image = fileInfo.url
      }
      
      // Call the update function from our data fetching layer
      await updateTeamData(
        team.id, 
        updateData,
        queryClient
      )
      
      // Call the onTeamUpdated callback if provided, with local data for immediate UI update
      if (typeof onTeamUpdated === 'function') {
        onTeamUpdated(updatedTeamLocal)
      }
      
      // Close the dialog
      if (typeof onClose === 'function') {
        onClose()
      }
    } catch (error) {
      console.error("Error updating team:", error)
      setError(error.message || "Failed to update team")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle dialog open state changes
  const handleOpenChange = (isOpen) => {
    if (!isOpen && !isSubmitting && !isUploading) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update your team&apos;s details below
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="teamDescription">Description</Label>
              <Textarea
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Enter team description (optional)"
                rows={4}
              />
            </div>
            
            {/* Team Header Image Upload */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Team Header Image
              </Label>
              
              {team.image && !headerImage && (
                <div className="mb-2">
                  <div className="relative w-full h-24 overflow-hidden rounded-md">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${team.image})` }}
                    />
                    <div className="absolute inset-0 bg-black/5"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Current team image</p>
                </div>
              )}
              
              <Dropzone
                maxFiles={1}
                maxSize={FILE_UPLOAD.TEAM_IMAGE.MAX_SIZE}
                accept={FILE_UPLOAD.TEAM_IMAGE.ALLOWED_TYPES}
                prompt="Drag & drop a new header image, or click to browse"
                subPrompt={`Supported image formats up to ${formatFileSize(FILE_UPLOAD.TEAM_IMAGE.MAX_SIZE)}`}
                onDrop={(file) => setHeaderImage(file)}
                onFileRemove={() => setHeaderImage(null)}
                disabled={isSubmitting || isUploading}
                currentFiles={headerImage ? [headerImage] : []}
                variant={headerImage ? "success" : "default"}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isUploading ? "Uploading Image..." : isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TeamEditDialog