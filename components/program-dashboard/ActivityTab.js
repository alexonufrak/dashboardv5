"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { ActivityFeed } from "@/components/program/common"

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
        <ActivityFeed team={team} detailed={true} />
      </CardContent>
    </Card>
  )
}