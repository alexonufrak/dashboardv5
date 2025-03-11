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
  BountiesTab,
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
  const isXtrapreneurs = programInitiativeName?.toLowerCase().includes("xtrapreneurs")
  
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
    <div className="space-y-6">
      <ProgramHeader
        programCohort={programCohort}
        programInitiativeName={programInitiativeName}
        isTeamProgram={isTeamProgram}
        team={team}
        milestones={milestones}
        onInviteClick={() => setIsInviteDialogOpen(true)}
        onEditTeamClick={() => setIsEditDialogOpen(true)}
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isXtrapreneurs ? (
            <TabsTrigger value="bounties">Bounties</TabsTrigger>
          ) : (
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          )}
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
        
        {!isXtrapreneurs && (
          <TabsContent value="milestones">
            <MilestonesTab milestones={milestones || []} />
          </TabsContent>
        )}
        
        {isXtrapreneurs && (
          <TabsContent value="bounties">
            <BountiesTab programId={currentProgramId} />
          </TabsContent>
        )}
        
        {isTeamProgram && (
          <TabsContent value="members">
            <TeamMembersTab team={team} />
          </TabsContent>
        )}
        
        <TabsContent value="activity">
          <ActivityTab team={team} />
        </TabsContent>
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