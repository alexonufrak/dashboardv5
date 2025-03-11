"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useDashboard } from "@/contexts/DashboardContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ProgramHeader,
  NotParticipatingError,
  GeneralProgramError,
  NoProgramDataPlaceholder,
  TeamDialogs,
  cleanTeamData,
  isNotParticipatingError,
  isTeamBasedProgram
} from "@/components/program-dashboard"
import { getProgramType, programComponentMap, getTabLabels, PROGRAM_TYPES } from "@/lib/programComponents"

const ProgramDashboardContent = dynamic(() => Promise.resolve(ProgramDashboardInner), { 
  ssr: false 
})

function ProgramDashboardInner({ onNavigate, programId }) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localTeamData, setLocalTeamData] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [activeComponents, setActiveComponents] = useState({})
  
  const { 
    teamData, 
    teamsData,
    cohort, 
    milestones,
    submissions,
    bounties,
    initiativeName, 
    participationType, 
    programError,
    refreshData,
    activeProgramId,
    getActiveProgramData
  } = useDashboard()
  
  const currentProgramId = programId || activeProgramId
  
  // Fetch latest data for the current program whenever the programId changes
  useEffect(() => {
    if (currentProgramId) {
      console.log(`ProgramDashboardInner: Refreshing data for program ${currentProgramId}`);
      refreshData('program');  // Refresh all program-related data
    }
  }, [currentProgramId, refreshData]);
  
  const activeProgramData = getActiveProgramData(currentProgramId)
  const programCohort = activeProgramData?.cohort || cohort
  const programInitiativeName = activeProgramData?.initiativeName || initiativeName
  const programParticipationType = activeProgramData?.participationType || participationType
  
  // Determine program type using helper function
  const programType = getProgramType({
    name: programInitiativeName
  })
  
  const programTeamId = activeProgramData?.teamId
  const programTeamData = programTeamId ? 
    teamsData.find(t => t.id === programTeamId) || teamData : 
    teamData
  
  // Get tab labels based on program type
  const tabLabels = getTabLabels(programType)
  
  // Set up dynamic components
  useEffect(() => {
    const loadComponents = async () => {
      // Load components based on program type
      try {
        const OverviewComponent = await programComponentMap[programType].overview()
        const MilestonesComponent = await programComponentMap[programType].milestones()
        const TeamComponent = await programComponentMap[programType].team()
        const ActivityComponent = await programComponentMap[programType].activity()
        
        setActiveComponents({
          overview: OverviewComponent.default,
          milestones: MilestonesComponent.default,
          team: TeamComponent.default,
          activity: ActivityComponent.default
        })
      } catch (error) {
        console.error("Error loading program components:", error)
      }
    }
    
    loadComponents()
  }, [programType])
  
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
    setActiveTab(programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones")
  }
  
  const handleViewMembers = () => {
    setActiveTab("team")
  }
  
  const handleTeamUpdated = (updatedTeam, source) => {
    setLocalTeamData(updatedTeam)
    refreshData("teams")
  }
  
  // Render components with fallbacks
  const OverviewComponent = activeComponents.overview || (() => <div>Loading overview...</div>)
  const MilestonesComponent = activeComponents.milestones || (() => <div>Loading milestones...</div>)
  const TeamComponent = activeComponents.team || (() => <div>Loading team...</div>)
  const ActivityComponent = activeComponents.activity || (() => <div>Loading activity...</div>)
  
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
          <TabsTrigger value="overview">{tabLabels.overview}</TabsTrigger>
          <TabsTrigger value={programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones"}>
            {tabLabels.milestones}
          </TabsTrigger>
          {isTeamProgram && <TabsTrigger value="team">{tabLabels.team}</TabsTrigger>}
          <TabsTrigger value="activity">{tabLabels.activity}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Suspense fallback={<div>Loading overview...</div>}>
            <OverviewComponent
              programData={activeProgramData}
              milestones={milestones || []}
              submissions={submissions || []}
              bounties={bounties || []}
              team={team}
              onViewMilestones={handleViewMilestones}
              onViewMembers={handleViewMembers}
            />
          </Suspense>
        </TabsContent>
        
        <TabsContent value={programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones"}>
          <Suspense fallback={<div>Loading milestones...</div>}>
            <MilestonesComponent
              programData={activeProgramData}
              milestones={milestones || []}
              submissions={submissions || []}
              bounties={bounties || []}
              team={team}
              programId={currentProgramId}
            />
          </Suspense>
        </TabsContent>
        
        {isTeamProgram && (
          <TabsContent value="team">
            <Suspense fallback={<div>Loading team...</div>}>
              <TeamComponent
                programData={activeProgramData}
                team={team}
                bounties={bounties || []}
                milestones={milestones || []}
                onInviteMember={() => setIsInviteDialogOpen(true)}
              />
            </Suspense>
          </TabsContent>
        )}
        
        <TabsContent value="activity">
          <Suspense fallback={<div>Loading activity...</div>}>
            <ActivityComponent team={team} />
          </Suspense>
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