"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import our refactored components
import {
  ProgramHeader,
  NotParticipatingError,
  GeneralProgramError,
  NoProgramDataPlaceholder,
  OverviewTab,
  MilestonesTab,
  TeamMembersTab,
  ActivityTab,
  TeamDialogs,
  cleanTeamData,
  isNotParticipatingError,
  isTeamBasedProgram
} from "@/components/program-dashboard"

// Use dynamic import with SSR disabled to prevent context errors during build
const ProgramDashboardContent = dynamic(() => Promise.resolve(ProgramDashboardInner), { 
  ssr: false 
})

// Inner component that uses dashboard context
function ProgramDashboardInner({ onNavigate, programId }) {
  // Add state for dialog control and local team data
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localTeamData, setLocalTeamData] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Get data from dashboard context
  const { 
    teamData, 
    teamsData,
    cohort, 
    milestones, 
    initiativeName, 
    participationType, 
    programError,
    refreshData,
    activeProgramId,
    getActiveProgramData
  } = useDashboard()
  
  // Use the programId prop if provided, otherwise use the context's activeProgramId
  const currentProgramId = programId || activeProgramId
  
  // Get the active program data and program-specific data
  const activeProgramData = getActiveProgramData(currentProgramId)
  const programCohort = activeProgramData?.cohort || cohort
  const programInitiativeName = activeProgramData?.initiativeName || initiativeName
  const programParticipationType = activeProgramData?.participationType || participationType
  
  // Get team data for this specific program
  const programTeamId = activeProgramData?.teamId
  const programTeamData = programTeamId ? 
    teamsData.find(t => t.id === programTeamId) || teamData : 
    teamData
  
  // Keep local team data in sync with program team data
  useEffect(() => {
    if (programTeamData) {
      setLocalTeamData(programTeamData)
    }
  }, [programTeamData, currentProgramId])
  
  // Handle errors
  if (programError) {
    if (isNotParticipatingError(programError)) {
      return <NotParticipatingError onNavigateToDashboard={() => onNavigate('dashboard')} />
    }
    
    return (
      <GeneralProgramError 
        error={programError} 
        onRetry={() => refreshData('program')}
        onNavigateToDashboard={() => onNavigate('dashboard')} 
      />
    )
  }
  
  // Handle missing data case
  if (!programCohort && !programTeamData) {
    return <NoProgramDataPlaceholder onNavigateToDashboard={() => onNavigate('dashboard')} />
  }
  
  // Use utility functions to set up component props
  const isTeamProgram = isTeamBasedProgram(
    activeProgramData, 
    programParticipationType, 
    programTeamData
  )
  
  // Clean team data using utility function
  const baseTeamData = localTeamData || teamData
  const team = cleanTeamData(baseTeamData)
  
  // Event handlers for tab navigation
  const handleTabChange = (value) => {
    setActiveTab(value)
  }
  
  const handleViewMilestones = () => {
    setActiveTab("milestones")
  }
  
  const handleViewMembers = () => {
    setActiveTab("members")
  }
  
  // Handle team update from dialogs
  const handleTeamUpdated = (updatedTeam, source) => {
    console.log(`Team updated from ${source} dialog:`, updatedTeam)
    
    // Update local state for immediate UI feedback
    setLocalTeamData(updatedTeam)
    
    // Refresh data from server in the background
    refreshData('teams')
  }
  
  return (
    <div className="program-dashboard space-y-6 w-full overflow-x-hidden max-w-none min-w-full">
      {/* Program Header */}
      <ProgramHeader
        programCohort={programCohort}
        programInitiativeName={programInitiativeName}
        isTeamProgram={isTeamProgram}
        team={team}
        milestones={milestones}
        onInviteClick={() => setIsInviteDialogOpen(true)}
        onEditTeamClick={() => setIsEditDialogOpen(true)}
      />
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 w-full max-w-none">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          {isTeamProgram && <TabsTrigger value="members">Team Members</TabsTrigger>}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewTab
            milestones={milestones || []}
            isTeamProgram={isTeamProgram}
            team={team}
            teamData={teamData}
            onViewMilestones={handleViewMilestones}
            onViewMembers={handleViewMembers}
          />
        </TabsContent>
        
        <TabsContent value="milestones">
          <MilestonesTab milestones={milestones || []} />
        </TabsContent>
        
        {isTeamProgram && (
          <TabsContent value="members">
            <TeamMembersTab team={team} />
          </TabsContent>
        )}
        
        <TabsContent value="activity">
          <ActivityTab team={team} />
        </TabsContent>
      </Tabs>
      
      {/* Team dialogs */}
      {isTeamProgram && team && (
        <TeamDialogs
          isInviteDialogOpen={isInviteDialogOpen}
          isEditDialogOpen={isEditDialogOpen}
          onInviteDialogClose={() => setIsInviteDialogOpen(false)}
          onEditDialogClose={() => setIsEditDialogOpen(false)}
          team={team}
          onTeamUpdated={handleTeamUpdated}
        />
      )}
    </div>
  )
}

// Export the dynamic component that doesn't require context during build
export default function ProgramDashboard(props) {
  return <ProgramDashboardContent {...props} />
}