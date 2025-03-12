"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LogOut, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import InitiativeConflictDialog from "@/components/cohorts/InitiativeConflictDialog"

/**
 * Program Settings component that allows users to manage their program participation
 * and team membership
 */
const ProgramSettings = ({ 
  programData, 
  team, 
  isTeamProgram 
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false)

  // Prepare conflict details based on context
  const getConflictDetails = () => {
    return {
      // Team-related details
      teamId: team?.id || "unknown",
      teamName: team?.name || programData?.initiativeName || "your team",
      
      // Initiative-related details
      conflictingInitiative: programData?.initiativeName || "",
      currentProgram: programData?.initiativeName || "",
      
      // Callback for after leaving (handled by dialog itself)
      onLeaveTeam: () => {
        // Redirect happens automatically via page reload in dialog
        console.log("Left team/initiative via settings")
      }
    }
  }

  // Determine what the user can leave (team, initiative or both)
  const isInTeam = !!team?.id
  const isInInitiative = !!programData?.initiativeName
  
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Program Settings</h2>
        <p className="text-muted-foreground">
          Manage your participation in {programData?.initiativeName || "this program"}
        </p>
      </div>
      
      {/* Leave Program/Team Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <LogOut className="h-5 w-5" /> 
            Leave {isTeamProgram ? "Program & Team" : "Program"}
          </CardTitle>
          <CardDescription>
            Options for leaving this program or team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Initiative Participation */}
          {isInInitiative && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Leave {programData?.initiativeName}</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">
                  Leaving this initiative will remove your participation from {programData?.initiativeName}.
                  {isTeamProgram && isInTeam ? " You will also leave your team and lose access to all team resources." : ""}
                </p>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={() => setShowLeaveConfirmation(true)}
                >
                  <LogOut className="h-4 w-4" />
                  {isTeamProgram && isInTeam ? 
                    "Leave Initiative & Team" : 
                    "Leave Initiative"
                  }
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Team Membership (only shown if in team program but we want to offer leaving just the team) */}
          {isTeamProgram && isInTeam && !isInInitiative && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Leave {team?.name || "Team"}</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">
                  Leaving your team will remove you from {team?.name || "this team"}. 
                  You will lose access to all team resources, submissions, and milestones.
                </p>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={() => setShowLeaveConfirmation(true)}
                >
                  <LogOut className="h-4 w-4" />
                  Leave Team
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Leave Confirmation Dialog */}
      <InitiativeConflictDialog
        open={showLeaveConfirmation}
        onClose={() => setShowLeaveConfirmation(false)}
        details={getConflictDetails()}
        conflictType="team_program_conflict"
      />
    </div>
  )
}

export default ProgramSettings