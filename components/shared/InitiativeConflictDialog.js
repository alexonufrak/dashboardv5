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
      
      // Show success toast
      // Get team name for the success message
      const teamNameForMessage = details.teamName || 
                                details.conflictingInitiative || 
                                "your team";
      
      toast({
        title: "Team Left Successfully",
        description: `You have left ${teamNameForMessage}.`,
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
        <DialogContent className="sm:max-w-md">
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
                  You are trying to apply to a team program while you are already in a team program.
                </p>
                
                <Alert variant="outline" className="border-amber-200 bg-amber-50">
                  <AlertDescription className="py-2">
                    <div className="mb-2"><span className="text-muted-foreground">Current program:</span> <strong>{details.conflictingInitiative || details.teamInitiative || "Current Program"}</strong></div>
                    <div><span className="text-muted-foreground">Program you're applying to:</span> <strong>{details.currentInitiative || details.appliedProgram || "New Program"}</strong></div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p>
                    Users can only participate in one team program at a time. If you want to apply to this
                    program, you'll need to exit your current team program first.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you want to participate in this program without leaving your current program, 
                    you may need to create a new team or join a different team.
                  </p>
                </div>
              </>
            )}

            {conflictType === "topic_mismatch" && (
              <>
                <p className="text-base">
                  This team is already participating in an Xperiment cohort with a different topic.
                </p>
                
                <Alert variant="outline" className="border-amber-200 bg-amber-50">
                  <AlertDescription className="py-2">
                    <div className="mb-2"><span className="text-muted-foreground">Current team topic:</span> <strong>{details.teamTopic}</strong></div>
                    <div><span className="text-muted-foreground">New cohort topic:</span> <strong>{details.currentTopic}</strong></div>
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
                  You are trying to apply to a team program while you are already in a team program.
                </p>
                
                <Alert variant="outline" className="border-amber-200 bg-amber-50">
                  <AlertDescription className="py-2">
                    <div className="mb-2"><span className="text-muted-foreground">Current program:</span> <strong>{details.currentProgram}</strong></div>
                    <div><span className="text-muted-foreground">Program you're applying to:</span> <strong>{details.appliedProgram}</strong></div>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p>
                    Users can only participate in one team program at a time. If you want to apply to this
                    program, you'll need to exit your current team program first.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you want to participate in this program without leaving your current program, 
                    you may need to create a new team or join a different team.
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
              Leave Team
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

      {/* Leave team confirmation dialog */}
      <Dialog open={showLeaveConfirmation} onOpenChange={() => setShowLeaveConfirmation(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Leave Team Confirmation
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to leave <strong>{teamName}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <Alert variant="destructive" className="bg-red-50">
              <AlertDescription className="py-2">
                <p className="font-medium">If you leave this team, you will lose access to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Team resources related to the initiative</li>
                  <li>Team communication channels</li>
                  <li>Team submissions and milestones</li>
                  <li>Any other team-specific data</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. You will need to be invited back to the team if you want to rejoin.
            </p>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowLeaveConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveTeam}>
              Yes, Leave Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InitiativeConflictDialog;