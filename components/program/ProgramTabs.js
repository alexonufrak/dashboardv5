"use client"

import React, { useState, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PROGRAM_TYPES, getProgramType } from '@/lib/programComponents'
import { ProgramOverview, ProgramTeam, ProgramMilestones, ProgramActivity } from './index'

export default function ProgramTabs({
  programData,
  team,
  milestones = [],
  submissions = [],
  bounties = [],
  programId,
  isTeamProgram,
  initialTab = "overview"
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  
  // Determine program type
  const programType = getProgramType({
    name: programData?.initiativeName || ''
  })
  
  // Get appropriate tab labels based on program type
  const getTabLabels = () => {
    return {
      milestones: programType === PROGRAM_TYPES.XTRAPRENEURS ? 'Bounties' : 'Milestones',
      team: 'Team Members',
      overview: 'Overview',
      activity: 'Activity'
    }
  }
  
  const tabLabels = getTabLabels()
  
  // Handler for tab changes
  const handleTabChange = (value) => {
    setActiveTab(value)
  }
  
  // Handler for navigation between tabs
  const handleViewMilestones = () => {
    setActiveTab(programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones")
  }
  
  const handleViewMembers = () => {
    setActiveTab("team")
  }
  
  return (
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
          <ProgramOverview
            programData={programData}
            milestones={milestones}
            submissions={submissions}
            bounties={bounties}
            team={team}
            onViewMilestones={handleViewMilestones}
            onViewMembers={handleViewMembers}
          />
        </Suspense>
      </TabsContent>
      
      <TabsContent value={programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones"}>
        <Suspense fallback={<div>Loading milestones...</div>}>
          <ProgramMilestones
            programData={programData}
            milestones={milestones}
            submissions={submissions}
            bounties={bounties}
            team={team}
            programId={programId}
          />
        </Suspense>
      </TabsContent>
      
      {isTeamProgram && (
        <TabsContent value="team">
          <Suspense fallback={<div>Loading team...</div>}>
            <ProgramTeam
              programData={programData}
              team={team}
              bounties={bounties}
              milestones={milestones}
              onInviteMember={() => console.log('Invite member')} // Replace with actual handler
            />
          </Suspense>
        </TabsContent>
      )}
      
      <TabsContent value="activity">
        <Suspense fallback={<div>Loading activity...</div>}>
          <ProgramActivity team={team} />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}