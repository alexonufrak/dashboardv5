"use client"

import React from 'react'
import { ProgramCard } from './ProgramCard'
import { TeamCard } from './TeamCard'

/**
 * Program header component that displays program information and team details
 * in a side-by-side layout with program info taking 2/3 and team info 1/3
 */
export function ProgramHeader({
  programCohort,
  programInitiativeName,
  isTeamProgram,
  team,
  milestones,
  onInviteClick,
  onEditTeamClick,
}) {
  return (
    <div className="mb-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Program Card - Takes 2/3 of the space on larger screens */}
        <div className="md:col-span-2">
          <ProgramCard 
            programCohort={programCohort}
            programInitiativeName={programInitiativeName} 
            milestones={milestones}
          />
        </div>
        
        {/* Team Card - Takes 1/3 of the space on larger screens */}
        {isTeamProgram && team && (
          <div className="md:col-span-1">
            <TeamCard 
              team={team} 
              onInviteClick={onInviteClick}
              onEditTeamClick={onEditTeamClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}