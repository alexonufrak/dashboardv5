"use client"

import React, { useState } from 'react'
import { ProgramTabs } from './index'
import { ProgramHeader, TeamDialogs, cleanTeamData, isNotParticipatingError, isTeamBasedProgram } from '@/components/program-dashboard'
import { NotParticipatingError, GeneralProgramError, NoProgramDataPlaceholder } from '@/components/program-dashboard/ErrorStates'

export default function ProgramDashboard({ 
  programId,
  programData,
  teamData,
  cohort,
  milestones = [],
  submissions = [],
  bounties = [],
  programError,
  refreshData,
  onNavigate
}) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localTeamData, setLocalTeamData] = useState(teamData)
  
  // Error handling
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
  
  if (!cohort && !teamData) {
    return <NoProgramDataPlaceholder onNavigateToDashboard={() => onNavigate('dashboard')} />
  }
  
  // Determine if this is a team-based program
  const isTeamProgram = isTeamBasedProgram(
    programData, 
    programData?.participationType, 
    teamData
  )
  
  // Clean the team data for consistent use
  const team = cleanTeamData(localTeamData || teamData)
  
  const handleTeamUpdated = (updatedTeam) => {
    setLocalTeamData(updatedTeam)
    refreshData("teams")
  }
  
  return (
    <div className="space-y-6">
      {/* Program Header */}
      <ProgramHeader
        programCohort={cohort}
        programInitiativeName={programData?.initiativeName}
        isTeamProgram={isTeamProgram}
        team={team}
        milestones={milestones}
        onInviteClick={() => setIsInviteDialogOpen(true)}
        onEditTeamClick={() => setIsEditDialogOpen(true)}
      />
      
      {/* Program Tabs */}
      <ProgramTabs 
        programData={programData}
        team={team}
        milestones={milestones}
        submissions={submissions}
        bounties={bounties}
        programId={programId}
        isTeamProgram={isTeamProgram}
        onInviteClick={() => setIsInviteDialogOpen(true)}
        onEditTeamClick={() => setIsEditDialogOpen(true)}
        onTeamUpdated={handleTeamUpdated}
      />
      
      {/* Team Dialogs */}
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