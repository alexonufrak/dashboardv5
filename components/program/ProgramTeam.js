"use client"

import React from 'react'
import { PROGRAM_TYPES } from '@/lib/programComponents'
import { getProgramType } from '@/lib/programComponents'
import { TeamMembers, ActivityFeed, PointsSummary } from './common'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Users } from 'lucide-react'

export default function ProgramTeam({ 
  programData, 
  team, 
  bounties = [], 
  milestones = [], 
  onInviteMember 
}) {
  // Determine program type
  const programType = getProgramType({ name: programData?.initiativeName || '' })
  
  // Get team members with more context for detailed view
  const getDetailedMembers = () => {
    if (!team?.members) return []
    
    return team.members.map(member => {
      // For Xtrapreneurs, show bounty contributions
      if (programType === PROGRAM_TYPES.XTRAPRENEURS) {
        return {
          ...member,
          specializations: member.specializations || ['Team Member'],
          contributions: []  // Would be populated from bounty data
        }
      }
      
      // For other programs, show milestone contributions
      return {
        ...member,
        milestoneContributions: milestones.filter(m => 
          m.assignees?.includes(member.id) || m.submissions?.some(s => s.submittedBy === member.id)
        ).length
      }
    })
  }
  
  const detailedMembers = getDetailedMembers()
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">
            {team?.members?.length || 0} members in {programData?.initiativeName || 'program'} team
          </p>
        </div>
        
        <Button onClick={onInviteMember}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main members list */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
              <CardDescription>All members of your {programData?.initiativeName || 'program'} team</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMembers team={team} detailed={true} />
            </CardContent>
          </Card>
          
          {/* Recent team activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
              <CardDescription>Recent team member actions and contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed team={team} detailed={true} />
            </CardContent>
          </Card>
        </div>
        
        {/* Team sidebar */}
        <div className="space-y-6">
          {/* Team points */}
          <Card>
            <CardHeader>
              <CardTitle>Team Points</CardTitle>
              <CardDescription>Point contributions and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <PointsSummary team={team} />
            </CardContent>
          </Card>
          
          {/* Program-specific team info */}
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
              <CardDescription>{programData?.initiativeName || 'Program'} information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {team?.name && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Team Name</h4>
                  <p className="text-lg font-medium">{team.name}</p>
                </div>
              )}
              
              {team?.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p>{team.description}</p>
                </div>
              )}
              
              {programType === PROGRAM_TYPES.XTRAPRENEURS && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Bounty Participation</h4>
                  <p className="text-lg font-medium">{bounties?.filter(b => b.teamId === team?.id)?.length || 0} bounties</p>
                </div>
              )}
              
              {(programType === PROGRAM_TYPES.XPERIENCE || programType === PROGRAM_TYPES.HORIZONS) && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Milestone Progress</h4>
                  <p className="text-lg font-medium">
                    {milestones?.filter(m => m.status === 'completed')?.length || 0} / {milestones?.length || 0} completed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}