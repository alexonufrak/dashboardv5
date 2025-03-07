"use client"

import { useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Users, CheckCircle2 } from 'lucide-react'

const TeamSelector = ({ programId }) => {
  const { 
    getTeamsForProgram, 
    getActiveProgramData, 
    setActiveTeamForProgram,
    refreshData
  } = useDashboard()
  
  // Get all teams for this program
  const teams = getTeamsForProgram ? getTeamsForProgram(programId) : []
  const programData = getActiveProgramData ? getActiveProgramData(programId) : null
  
  // Get active team ID
  const activeTeamId = programData?.teamId
  
  // Handle team change
  const handleTeamChange = (teamId) => {
    if (setActiveTeamForProgram) {
      setActiveTeamForProgram(programId, teamId)
      
      // Refresh data to get updated team information
      if (refreshData) {
        refreshData('teams')
      }
    }
  }
  
  // Skip rendering if only one team
  if (!teams || teams.length <= 1) {
    return null
  }
  
  // Find the active team object
  const activeTeam = teams.find(team => team.id === activeTeamId) || teams[0]
  
  return (
    <Card className="bg-blue-50 border-blue-100">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Multiple Teams</span>
            <span className="text-sm text-muted-foreground">
              You belong to {teams.length} teams in this program
            </span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={activeTeamId || ''}
              onValueChange={handleTeamChange}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={team.image} alt={team.name} />
                        <AvatarFallback>
                          {team.name?.substring(0, 2).toUpperCase() || "TM"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{team.name}</span>
                      {team.id === activeTeamId && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Current Team Status */}
        <div className="mt-3 border-t border-blue-200 pt-3 flex items-center">
          <span className="text-sm">Currently viewing:</span>
          <div className="flex items-center ml-2">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={activeTeam?.image} alt={activeTeam?.name} />
              <AvatarFallback>
                {activeTeam?.name?.substring(0, 2).toUpperCase() || "TM"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{activeTeam?.name || "Unknown Team"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TeamSelector