"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Edit } from "lucide-react"
import TeamMemberList from "@/components/teams/TeamMemberList"
import PointsSummary from "@/components/program/common/PointsSummary"

/**
 * Team tab content component that displays team member list with action buttons
 */
export function TeamMembersTab({ team, onInviteClick, onEditTeamClick, onTeamUpdated }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team</h2>
          <p className="text-muted-foreground">
            {team?.members?.length || 0} members in {team?.name || "your team"}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onInviteClick}
          >
            <Users className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
          <Button 
            size="sm"
            onClick={onEditTeamClick}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main members list */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>All members of {team?.name || "your team"}</CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <TeamMemberList 
                team={team} 
                detailed={true} 
                onTeamUpdated={onTeamUpdated} 
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Team Points Summary */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Team Points</CardTitle>
              <CardDescription>Point contributions and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <PointsSummary team={team} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}