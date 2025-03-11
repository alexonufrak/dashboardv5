"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useDashboard } from "@/contexts/DashboardContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const ProgramDashboardContent = dynamic(() => Promise.resolve(ProgramDashboardInner), { 
  ssr: false 
})

function ProgramDashboardInner({ onNavigate, programId }) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localTeamData, setLocalTeamData] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  
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
  
  const currentProgramId = programId || activeProgramId
  
  const activeProgramData = getActiveProgramData(currentProgramId)
  const programCohort = activeProgramData?.cohort || cohort
  const programInitiativeName = activeProgramData?.initiativeName || initiativeName
  const programParticipationType = activeProgramData?.participationType || participationType
  
  const programTeamId = activeProgramData?.teamId
  const programTeamData = programTeamId ? 
    teamsData.find(t => t.id === programTeamId) || teamData : 
    teamData
  
  useEffect(() => {
    if (programTeamData) {
      setLocalTeamData(programTeamData)
    }
  }, [programTeamData, currentProgramId])
  
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
  
  if (!programCohort && !programTeamData) {
    return <NoProgramDataPlaceholder onNavigateToDashboard={() => onNavigate('dashboard')} />
  }
  
  const isTeamProgram = isTeamBasedProgram(
    activeProgramData, 
    programParticipationType, 
    programTeamData
  )
  
  const baseTeamData = localTeamData || teamData
  const team = cleanTeamData(baseTeamData)
  
  const handleTabChange = (value) => {
    setActiveTab(value)
  }
  
  const handleViewMilestones = () => {
    setActiveTab("milestones")
  }
  
  const handleViewMembers = () => {
    setActiveTab("members")
  }
  
  const handleTeamUpdated = (updatedTeam, source) => {
    setLocalTeamData(updatedTeam)
    refreshData("teams")
  }
  
  return (
    <div className="space-y-6 h-full flex flex-col">
      <ProgramHeader
        programCohort={programCohort}
        programInitiativeName={programInitiativeName}
        isTeamProgram={isTeamProgram}
        team={team}
        milestones={milestones}
        onInviteClick={() => setIsInviteDialogOpen(true)}
        onEditTeamClick={() => setIsEditDialogOpen(true)}
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 flex-1 flex flex-col">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          {isTeamProgram && <TabsTrigger value="members">Team Members</TabsTrigger>}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-h-0">
          <TabsContent value="overview" className="h-full">
            <OverviewTab
              milestones={milestones || []}
              isTeamProgram={isTeamProgram}
              team={team}
              teamData={teamData}
              onViewMilestones={handleViewMilestones}
              onViewMembers={handleViewMembers}
            />
          </TabsContent>
          
          <TabsContent value="milestones" className="h-full">
            <MilestonesTab milestones={milestones || []} />
          </TabsContent>
          
          {isTeamProgram && (
            <TabsContent value="members" className="h-full">
              <TeamMembersTab team={team} />
            </TabsContent>
          )}
          
          <TabsContent value="activity" className="h-full">
            <ActivityTab team={team} />
          </TabsContent>
        </div>
      </Tabs>
      
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

export default function ProgramDashboard(props) {
  return <ProgramDashboardContent {...props} />
}