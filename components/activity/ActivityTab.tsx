"use client"

import { Card, CardHeader, CardBody } from "@heroui/react"
import { TeamActivityFeed } from "./index"
import { Team } from "@/types/dashboard"

interface ActivityTabProps {
  team?: Team;
}

/**
 * Activity tab content component that displays team activity feed
 */
export function ActivityTab({ team }: ActivityTabProps) {
  return (
    <Card className="w-full max-w-none">
      <CardHeader>
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold">Program Activity</h3>
          <p className="text-sm text-default-500">
            Recent activities, achievements, and updates
          </p>
        </div>
      </CardHeader>
      <CardBody className="w-full">
        <TeamActivityFeed team={team} detailed={true} />
      </CardBody>
    </Card>
  )
}