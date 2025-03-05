"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Note: initiative_conflict and team_initiative_conflict are kept for backward compatibility */}
          {(conflictType === "initiative_conflict" || conflictType === "team_initiative_conflict") && (
            <>
              <p>
                You are trying to apply to a team program while you are already in a team program.
              </p>
              <p>
                Current program: <strong>{details.conflictingInitiative || details.teamInitiative || "Current Program"}</strong><br />
                Program you're applying to: <strong>{details.currentInitiative || details.appliedProgram || "New Program"}</strong>
              </p>
              <p>
                Users can only participate in one team program at a time. If you want to apply to this
                program, you'll need to exit your current team program first.
              </p>
              <p className="text-sm text-muted-foreground">
                If you want to participate in this program without leaving your current program, 
                you may need to create a new team or join a different team.
              </p>
            </>
          )}

          {conflictType === "topic_mismatch" && (
            <>
              <p>
                This team is already participating in an Xperiment cohort with a different topic.
              </p>
              <p>
                Current team topic: <strong>{details.teamTopic}</strong><br />
                New cohort topic: <strong>{details.currentTopic}</strong>
              </p>
              <p>
                For Xperiment initiative, teams must work on the same topic across all cohorts.
              </p>
              <p className="text-sm text-muted-foreground">
                If you want to work on a different topic, you may need to create a new team.
              </p>
            </>
          )}
          
          {conflictType === "team_program_conflict" && (
            <>
              <p>
                You are trying to apply to a team program while you are already in a team program.
              </p>
              <p>
                Current program: <strong>{details.currentProgram}</strong><br />
                Program you're applying to: <strong>{details.appliedProgram}</strong>
              </p>
              <p>
                Users can only participate in one team program at a time. If you want to apply to this
                program, you'll need to exit your current team program first.
              </p>
              <p className="text-sm text-muted-foreground">
                If you want to participate in this program without leaving your current program, 
                you may need to create a new team or join a different team.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Go Back
          </Button>
          {conflictType === "team_initiative_conflict" && (
            <Button 
              variant="outline" 
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
  );
};

export default InitiativeConflictDialog;