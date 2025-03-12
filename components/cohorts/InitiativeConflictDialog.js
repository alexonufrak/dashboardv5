"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

/**
 * A dialog that explains initiative conflicts to users
 * Shows different content based on conflict type
 * 
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.onClose Callback when dialog is closed
 * @param {Object} props.details Conflict details: currentInitiative, conflictingInitiative, etc.
 * @param {string} props.conflictType Type of conflict: "initiative_conflict", "team_initiative_conflict", "topic_mismatch"
 */
const InitiativeConflictDialog = ({
  open,
  onClose,
  details,
  conflictType = "initiative_conflict"
}) => {
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const { toast } = useToast();
  
  if (!details) return null;

  // Determine title based on conflict type
  let title = "Initiative Conflict";
  if (conflictType === "team_initiative_conflict") {
    title = "Team Initiative Conflict";
  } else if (conflictType === "topic_mismatch") {
    title = "Topic Mismatch";
  } else if (conflictType === "team_program_conflict") {
    title = "Team Program Conflict";
  }
  
  // Determine the context of what user is leaving
  const isLeavingTeam = details.teamId && details.teamId !== 'unknown';
  const isLeavingInitiative = details.conflictingInitiative || details.currentProgram;
  const leavingContext = isLeavingTeam && isLeavingInitiative ? "team & initiative" : 
                        isLeavingTeam ? "team" : "initiative";

  // Handle leave team confirmation
  const handleLeaveTeam = async () => {
    try {
      // Use let instead of const so we can reassign if needed
      let teamId = details.teamId;
      
      if (!teamId) {
        console.error('No teamId found in details:', details);
        
        // Set teamId to 'unknown' to trigger the special case handling in the API
        teamId = 'unknown';
        console.warn('Using "unknown" as teamId to leave all teams');
      }
      
      console.log(`Attempting to leave team with ID: ${teamId}`);
      
      // Call the leave team API endpoint
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave team');
      }
      
      // Get the response data
      const data = await response.json();
      console.log('Leave team response:', data);
      
      // Close both dialogs
      setShowLeaveConfirmation(false);
      onClose();
      
      // If the component has an onLeaveTeam callback, call it
      if (typeof details.onLeaveTeam === 'function') {
        details.onLeaveTeam(teamId);
      }
      
      // Invalidate all relevant caches to ensure UI updates correctly
      try {
        // Invalidate the participation data cache
        await fetch('/api/cache-invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cacheKeys: ['teams', 'participation']
          })
        });
        console.log('Cache invalidated successfully');
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
        // Non-blocking error - we'll still proceed with page reload
      }
      
      // Show contextual success toast
      // Get team name for the success message
      const teamNameForMessage = details.teamName || 
                                details.conflictingInitiative || 
                                "your team";
      
      const initiativeNameForMessage = details.conflictingInitiative || 
                                      details.currentProgram || 
                                      "the initiative";
      
      // Determine toast content based on what the user is leaving
      let toastTitle = "";
      let toastDescription = "";
      
      if (isLeavingTeam && isLeavingInitiative) {
        toastTitle = "Team & Initiative Left Successfully";
        toastDescription = `You have left ${teamNameForMessage} and ${initiativeNameForMessage}.`;
      } else if (isLeavingTeam) {
        toastTitle = "Team Left Successfully";
        toastDescription = `You have left ${teamNameForMessage}.`;
      } else {
        toastTitle = "Initiative Left Successfully";
        toastDescription = `You have left ${initiativeNameForMessage}.`;
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "default",
      });
      
      // Refresh the page after a short delay to update the UI
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error leaving team:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to leave team. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get team name from details
  const teamName = details.teamName || 
                   details.conflictingInitiative || 
                   details.teamInitiative || 
                   details.currentProgram || 
                   "your current team";

  return (
    <>
      {/* Main conflict dialog */}
      <Dialog open={open && !showLeaveConfirmation} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md z-[200]">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Note: initiative_conflict and team_initiative_conflict are kept for backward compatibility */}
            {(conflictType === "initiative_conflict" || conflictType === "team_initiative_conflict") && (
              <>
                <p className="text-base">
                  You are currently an active member of the <strong>{details.conflictingInitiative || details.teamInitiative || "Current Program"}</strong> initiative.
                </p>
                
                <Alert variant="outline" className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
                  <AlertDescription className="py-2">
                    <div className="mb-2"><span className="text-muted-foreground">Your active initiative:</span> <strong className="text-foreground">{details.conflictingInitiative || details.teamInitiative || "Current Program"}</strong></div>
                    <div><span className="text-muted-foreground">Initiative you're applying to:</span> <strong className="text-foreground">{details.currentInitiative || details.appliedProgram || "New Program"}</strong></div>
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/50">
                      <span className="font-medium text-amber-800 dark:text-amber-500">Initiative Conflict</span>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p>
                    You can only participate in one team-based initiative at a time. To join <strong className="text-foreground">{details.currentInitiative || details.appliedProgram || "this new initiative"}</strong>, 
                    you must leave your current initiative first.
                  </p>
                  <div className="p-3 rounded-md bg-secondary/50 border border-border">
                    <p className="font-medium text-foreground">
                      {isLeavingTeam && isLeavingInitiative ?
                        "This means you will leave your current team and initiative, no longer having access to their resources." :
                       isLeavingTeam ?
                        "This means you will leave your current team and no longer have access to team resources." :
                        "This means you will leave your current initiative and no longer have access to initiative resources."}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If you prefer not to leave your current initiative, you would need to use a different account.
                  </p>
                </div>
              </>
            )}

            {conflictType === "topic_mismatch" && (
              <>
                <p className="text-base">
                  This team is already participating in an Xperiment cohort with a different topic.
                </p>
                
                <Alert variant="outline" className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
                  <AlertDescription className="py-2">
                    <div className="mb-2"><span className="text-muted-foreground">Current team topic:</span> <strong className="text-foreground">{details.teamTopic}</strong></div>
                    <div><span className="text-muted-foreground">New cohort topic:</span> <strong className="text-foreground">{details.currentTopic}</strong></div>
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/50">
                      <span className="font-medium text-amber-800 dark:text-amber-500">Topic Mismatch</span>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p>
                    For Xperiment initiative, teams must work on the same topic across all cohorts.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you want to work on a different topic, you may need to create a new team.
                  </p>
                </div>
              </>
            )}
            
            {conflictType === "team_program_conflict" && (
              <>
                <p className="text-base">
                  You are currently an active member of the <strong>{details.currentProgram || "Current Program"}</strong> initiative.
                </p>
                
                <Alert variant="outline" className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
                  <AlertDescription className="py-2">
                    <div className="mb-2"><span className="text-muted-foreground">Your active initiative:</span> <strong className="text-foreground">{details.currentProgram}</strong></div>
                    <div><span className="text-muted-foreground">Initiative you're applying to:</span> <strong className="text-foreground">{details.appliedProgram}</strong></div>
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/50">
                      <span className="font-medium text-amber-800 dark:text-amber-500">Initiative Conflict</span>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p>
                    You can only participate in one team-based initiative at a time. To join <strong className="text-foreground">{details.appliedProgram || "this new initiative"}</strong>, 
                    you must leave your current initiative first.
                  </p>
                  <div className="p-3 rounded-md bg-secondary/50 border border-border">
                    <p className="font-medium text-foreground">
                      {isLeavingTeam && isLeavingInitiative ?
                        "This means you will leave your current team and initiative, no longer having access to their resources." :
                       isLeavingTeam ?
                        "This means you will leave your current team and no longer have access to team resources." :
                        "This means you will leave your current initiative and no longer have access to initiative resources."}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If you prefer not to leave your current initiative, you would need to use a different account.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Go Back
            </Button>
            
            <Button 
              variant="destructive" 
              className="flex items-center gap-2"
              onClick={() => setShowLeaveConfirmation(true)}
            >
              <LogOut className="h-4 w-4" />
              {isLeavingTeam && isLeavingInitiative ? "Leave Team & Initiative" :
               isLeavingTeam ? "Leave Team" : "Leave Initiative"}
            </Button>
            
            {conflictType === "team_initiative_conflict" && (
              <Button 
                variant="default" 
                onClick={() => {
                  onClose();
                  // This would typically call onCreateTeam or similar
                  if (details.onCreateTeam) {
                    details.onCreateTeam();
                  }
                }}
              >
                Create New Team
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave confirmation dialog */}
      <Dialog open={showLeaveConfirmation} onOpenChange={() => setShowLeaveConfirmation(false)}>
        <DialogContent className="sm:max-w-md z-[200]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive dark:text-red-400">
              <LogOut className="h-5 w-5" />
              {isLeavingTeam && isLeavingInitiative ? "Leave Team & Initiative Confirmation" :
               isLeavingTeam ? "Leave Team Confirmation" : "Leave Initiative Confirmation"}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {isLeavingTeam && isLeavingInitiative ? 
                `Are you sure you want to leave ${teamName} and the ${details.conflictingInitiative || details.currentProgram || "current"} initiative?` :
               isLeavingTeam ? 
                `Are you sure you want to leave ${teamName}?` :
                `Are you sure you want to leave the ${details.conflictingInitiative || details.currentProgram || "current"} initiative?`}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900">
              <AlertDescription className="py-2">
                <p className="font-medium text-foreground">If you leave, you will lose access to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {isLeavingTeam && (
                    <>
                      <li>Team resources related to the initiative</li>
                      <li>Team communication channels</li>
                      <li>Team submissions and milestones</li>
                    </>
                  )}
                  {isLeavingInitiative && (
                    <>
                      <li>Initiative-specific resources and benefits</li>
                      <li>Initiative progress and achievements</li>
                    </>
                  )}
                  <li>Any other {isLeavingTeam ? "team" : "initiative"}-specific data</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground">
              {isLeavingTeam ? 
               "This action cannot be undone. You will need to be invited back to the team if you want to rejoin." :
               "This action cannot be undone. You will need to apply again if you want to rejoin this initiative."}
            </p>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowLeaveConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveTeam}>
              {isLeavingTeam && isLeavingInitiative ? "Yes, Leave Team & Initiative" :
               isLeavingTeam ? "Yes, Leave Team" : "Yes, Leave Initiative"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InitiativeConflictDialog;