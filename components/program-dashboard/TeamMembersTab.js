"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import TeamMemberList from "@/components/teams/TeamMemberList"

/**
 * Team tab content component that displays team member list
 */
export function TeamMembersTab({ team }) {
  return (
    <Card className="w-full max-w-none">
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>All members of {team?.name || "your team"}</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <TeamMemberList team={team} detailed={true} />
      </CardContent>
    </Card>
  )
}