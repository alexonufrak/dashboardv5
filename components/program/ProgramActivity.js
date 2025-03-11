"use client"

import React from 'react'
import { ActivityFeed } from './common'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'

export default function ProgramActivity({ team }) {
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