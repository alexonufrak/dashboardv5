"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Edit } from "lucide-react"
import TeamMemberList from "@/components/teams/TeamMemberList"

/**
 * Team tab content component that displays team member list with action buttons
 */
export function TeamMembersTab({ team, onInviteClick, onEditTeamClick }) {
  return (
    <Card className="w-full max-w-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team</CardTitle>
          <CardDescription>All members of {team?.name || "your team"}</CardDescription>
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
      </CardHeader>
      <CardContent className="w-full">
        <TeamMemberList team={team} detailed={true} />
      </CardContent>
    </Card>
  )
}