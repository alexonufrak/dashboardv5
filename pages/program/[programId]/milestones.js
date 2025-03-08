"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Toaster } from "sonner"
import ProgramLayout from "@/components/program/ProgramLayout"
import ProfileEditModal from "@/components/ProfileEditModal"
import TeamMilestoneProgress from "@/components/TeamMilestoneProgress"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, AlertCircle } from "lucide-react"

function MilestonesPage() {
  const router = useRouter()
  const { programId } = router.query
  
  return (
    <>
      <MilestonesPageContent />
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
function MilestonesPageContent() {
  const router = useRouter()
  const { programId } = router.query
  const { setActiveProgram, getActiveProgramData, milestones } = useDashboard()
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      setActiveProgram(programId)
    }
  }, [programId, setActiveProgram])
  
  const programData = getActiveProgramData(programId)
  
  // Calculate milestone statistics
  const completedCount = milestones?.filter(m => 
    m.status === "completed" || m.hasSubmission
  ).length || 0
  
  const lateCount = milestones?.filter(m => {
    // If already marked as late or has a past due date without submission
    if (m.status === "late") return true
    if (m.status === "completed" || m.hasSubmission) return false
    
    // Check if past due date
    if (m.dueDate) {
      try {
        const dueDate = new Date(m.dueDate)
        const now = new Date()
        return dueDate < now
      } catch (e) {
        console.warn(`Invalid due date for milestone: ${m.dueDate}`)
        return false
      }
    }
    return false
  }).length || 0
  
  const upcomingCount = milestones?.length - completedCount - lateCount || 0
  const progressPercentage = milestones?.length > 0 
    ? Math.round((completedCount) / milestones.length * 100) 
    : 0
  
  if (!programId) {
    return <div>Loading...</div>
  }
  
  return (
    <>
      <ProgramLayout programId={programId} activeTab="milestones">
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Program Milestones</h2>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span><strong>{completedCount}</strong> Completed</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Circle className="h-4 w-4 text-gray-400" />
                        <span><strong>{upcomingCount}</strong> Upcoming</span>
                      </span>
                      {lateCount > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span><strong>{lateCount}</strong> Late</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Overall Progress:</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {`${progressPercentage}%`}
                    </Badge>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className="h-2 w-[200px]" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detailed Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Details</CardTitle>
              <CardDescription>Complete timeline of program milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {milestones && milestones.length > 0 ? (
                <TeamMilestoneProgress 
                  milestones={milestones} 
                  detailed={true}
                  programName={`${programData?.initiativeName || 'Program'} Milestones`}
                />
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-muted-foreground">No milestones available for this program.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProgramLayout>
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default MilestonesPage