"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { LogOut, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Dialog component for confirming when a user wants to leave a program/initiative
 * Can also handle leaving an associated team if the user is part of one
 */
const LeaveProgramDialog = ({
  open,
  onClose,
  programName,
  programId,
  cohortId,
  teamId,
  teamName,
  isTeamProgram = false
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLeaving, setIsLeaving] = useState(false)
  
  // Determine what the user is leaving
  const isInTeam = !!teamId
  const isInProgram = !!programName
  const haveCohortId = !!cohortId
  
  // Handle the leave confirmation
  const handleLeave = async () => {
    try {
      setIsLeaving(true)
      
      // Use the team ID or "unknown" if not available
      const leaveTeamId = teamId || "unknown"
      console.log(`Attempting to leave team with ID: ${leaveTeamId}`)
      
      // Call the leave team API endpoint
      const response = await fetch(`/api/teams/${leaveTeamId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          cohortId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to leave program')
      }
      
      // Get the response data
      const data = await response.json()
      console.log('Leave program response:', data)
      
      // Close the dialog
      onClose()
      
      // Invalidate all relevant caches to ensure UI updates correctly
      try {
        await fetch('/api/cache-invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cacheKeys: ['teams', 'participation', 'initiativeConflicts']
          })
        })
        console.log('Cache invalidated successfully')
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError)
      }
      
      // Determine toast content based on what the user is leaving
      let toastTitle = ""
      let toastDescription = ""
      
      if (isInTeam && isInProgram) {
        toastTitle = "Program & Team Left Successfully"
        toastDescription = `You have left ${programName} and ${teamName || "your team"}.`
      } else if (isInTeam) {
        toastTitle = "Team Left Successfully"
        toastDescription = `You have left ${teamName || "your team"}.`
      } else {
        toastTitle = "Program Left Successfully"
        toastDescription = `You have left ${programName}.`
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "default",
      })
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error leaving program:', error)
      setIsLeaving(false)
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to leave program. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            {isInTeam && isInProgram ? 
              "Leave Program & Team" : 
              isInProgram ? "Leave Program" : "Leave Team"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isInTeam && isInProgram ? 
              `Are you sure you want to leave ${programName} and ${teamName || "your team"}?` :
              isInProgram ? 
              `Are you sure you want to leave ${programName}?` :
              `Are you sure you want to leave ${teamName || "your team"}?`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-medium">
                {isInTeam && isInProgram ?
                  "You will lose access to all program resources and team content." :
                  isInTeam ?
                  "You will lose access to all team resources and submissions." :
                  "You will lose access to all program resources."}
              </p>
              <p className="text-sm mt-1">This action cannot be undone.</p>
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLeaving}>
            Cancel
          </Button>
          
          <Button 
            variant="destructive" 
            className="flex items-center gap-2"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                {isInTeam && isInProgram ? "Leave Program & Team" :
                isInProgram ? "Leave Program" : "Leave Team"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LeaveProgramDialog