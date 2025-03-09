"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import TeamActivityFeed from "@/components/teams/TeamActivityFeed"

/**
 * Activity tab content component that displays team activity feed
 */
export function ActivityTab({ team }) {
  return (
    <Card className="w-full max-w-none">
      <CardHeader>
        <CardTitle>Program Activity</CardTitle>
        <CardDescription>Recent activities, achievements, and updates</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <TeamActivityFeed team={team} detailed={true} />
      </CardContent>
    </Card>
  )
}