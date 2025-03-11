"use client"

import React from 'react'
import { PROGRAM_TYPES } from '@/lib/programComponents'
import { getProgramType } from '@/lib/programComponents'
import { 
  PointsSummary, 
  TeamMembers, 
  MilestoneStatus, 
  BountyCard, 
  Resources,
  UpcomingEvents
} from './common'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import SubmissionSummaryCard from '@/components/submissions/SubmissionSummaryCard'

export default function ProgramOverview({ 
  programData, 
  milestones = [], 
  submissions = [], 
  bounties = [], 
  team, 
  onViewMilestones, 
  onViewMembers 
}) {
  // Determine program type
  const programType = getProgramType({ name: programData?.initiativeName || '' })
  
  // Determine if this is a team-based program
  const isTeamProgram = !!team?.id
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {/* Main content area */}
      <div className="md:col-span-5 space-y-4">
        {/* Conditional rendering based on program type */}
        {programType === PROGRAM_TYPES.XTRAPRENEURS ? (
          <XtrapreneursMainContent 
            bounties={bounties} 
            onViewBounties={onViewMilestones} 
          />
        ) : (
          <DefaultMainContent 
            milestones={milestones}
            submissions={submissions}
            team={team}
            onViewMilestones={onViewMilestones}
          />
        )}
        
        {/* Resources - common for all program types */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Program Resources</h3>
          </CardHeader>
          <CardContent>
            <Resources resources={programData?.resources || []} />
          </CardContent>
        </Card>
        
        {/* Upcoming Events - common for all program types */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
          </CardHeader>
          <CardContent>
            <UpcomingEvents events={programData?.events || []} />
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar */}
      <div className="md:col-span-2 space-y-4">
        {/* Points */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Team Points</h3>
          </CardHeader>
          <CardContent>
            <PointsSummary team={team} />
          </CardContent>
        </Card>
        
        {/* Team Members */}
        {isTeamProgram && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <button 
                  onClick={onViewMembers}
                  className="text-sm text-primary hover:underline"
                >
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <TeamMembers team={team} truncated={true} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// XtrapreneursMainContent - Specific to Xtrapreneurs program
function XtrapreneursMainContent({ bounties, onViewBounties }) {
  // Display only the 3 most recent bounties
  const recentBounties = bounties?.slice(0, 3) || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Active Bounties</h3>
          <button 
            onClick={onViewBounties}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBounties.length > 0 ? (
            recentBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No active bounties available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// DefaultMainContent - For Xperience, Horizons, and other programs
function DefaultMainContent({ milestones, submissions, team, onViewMilestones }) {
  return (
    <>
      {/* Milestone Summary Card */}
      <MilestoneStatus 
        milestones={milestones || []}
        team={team}
        onViewMilestones={onViewMilestones}
      />

      {/* Submission Summary Card */}
      <SubmissionSummaryCard 
        milestones={milestones || []}
        submissions={submissions || []}
      />
    </>
  )
}