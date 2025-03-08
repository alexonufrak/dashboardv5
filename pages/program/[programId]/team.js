"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Toaster } from "sonner"
import ProgramLayout from "@/components/program/ProgramLayout"
import ProfileEditModal from "@/components/ProfileEditModal"
import TeamMemberList from "@/components/TeamMemberList"
import TeamInviteDialog from "@/components/TeamInviteDialog"
import TeamEditDialog from "@/components/TeamEditDialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Edit, UserPlus } from "lucide-react"

function TeamPage() {
  const router = useRouter()
  const { programId } = router.query
  
  return (
    <>
      <TeamPageContent />
      <ProfileModalWrapper />
    </>
  )
}

// Helper component to render ProfileEditModal with the right context
function ProfileModalWrapper() {
  const { profile, isEditModalOpen, setIsEditModalOpen, handleProfileUpdate } = useDashboard()
  
  return (
    profile && (
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />
    )
  )
}

// Separate the content to ensure context is available
function TeamPageContent() {
  const router = useRouter()
  const { programId } = router.query
  const { setActiveProgram, getActiveProgramData, refreshData } = useDashboard()
  
  // Local state for team dialogs
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localTeamData, setLocalTeamData] = useState(null)
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      setActiveProgram(programId)
    }
  }, [programId, setActiveProgram])
  
  const programData = getActiveProgramData(programId)
  const teamData = programData?.teamData || null
  
  // Update local team data when program team data changes
  useEffect(() => {
    if (teamData) {
      setLocalTeamData(teamData)
    }
  }, [teamData])
  
  // Handle team updates
  const handleTeamUpdated = (updatedTeam) => {
    // Update local state for immediate UI feedback
    setLocalTeamData(updatedTeam)
    
    // Refresh team data from server (happens in background)
    refreshData('teams')
  }
  
  if (!programId) {
    return <div>Loading...</div>
  }
  
  // Handle case where team data is not available
  if (!localTeamData) {
    return (
      <ProgramLayout programId={programId} activeTab="team">
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Team Found</h3>
            <p className="text-muted-foreground mb-4">
              {programData?.isTeamBased ? 
                "You don't have a team for this program yet." :
                "This is an individual program that doesn't use teams."}
            </p>
            {programData?.isTeamBased && (
              <Button 
                onClick={() => setIsEditDialogOpen(true)}
              >
                Create a Team
              </Button>
            )}
          </CardContent>
        </Card>
      </ProgramLayout>
    )
  }
  
  return (
    <>
      <ProgramLayout programId={programId} activeTab="team">
        <div className="space-y-6">
          {/* Team Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
              <CardDescription>
                Information about your team for this program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{localTeamData.name || "Your Team"}</h3>
                  <p className="text-muted-foreground mt-1">
                    {localTeamData.description || "No description available."}
                  </p>
                </div>
                
                {localTeamData.image && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Team Image</p>
                    <img 
                      src={localTeamData.image}
                      alt={`${localTeamData.name} logo`}
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </Button>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </CardFooter>
          </Card>
          
          {/* Team Members Card */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {localTeamData.members?.length || 0} members in your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMemberList 
                team={localTeamData} 
                detailed={true}
              />
            </CardContent>
          </Card>
        </div>
      </ProgramLayout>
      
      {/* Team dialogs */}
      <TeamInviteDialog 
        open={isInviteDialogOpen} 
        onClose={() => setIsInviteDialogOpen(false)}
        team={localTeamData}
        onTeamUpdated={handleTeamUpdated}
      />
      
      <TeamEditDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        team={localTeamData}
        onTeamUpdated={handleTeamUpdated}
      />
      
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default TeamPage