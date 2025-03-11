"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, Award, BarChart3, Flag, Edit } from "lucide-react"

/**
 * Program header component that displays program information and team details
 */
export function ProgramHeader({
  programCohort,
  programInitiativeName,
  isTeamProgram,
  team,
  milestones,
  onInviteClick,
  onEditTeamClick,
}) {
  return (
    <div className="mb-6 w-full">
      {/* Program Banner */}
      <ProgramBanner 
        programCohort={programCohort}
        programInitiativeName={programInitiativeName} 
        milestones={milestones}
      />
      
      {/* Team Info (if team-based program) */}
      {isTeamProgram && team && (
        <TeamInfoSection 
          team={team} 
          onInviteClick={onInviteClick}
          onEditTeamClick={onEditTeamClick}
        />
      )}
    </div>
  )
}

/**
 * Program banner component with program information and milestone stats
 */
function ProgramBanner({ programCohort, programInitiativeName, milestones }) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 mb-4 w-full max-w-none">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 w-full">
          <div>
            <div className="flex gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                {programCohort?.initiativeDetails?.name || programInitiativeName}
              </Badge>
              
              {(programCohort?.['Current Cohort'] === true || 
                programCohort?.['Current Cohort'] === 'true' || 
                programCohort?.['Is Current'] === true ||
                programCohort?.['Is Current'] === 'true') && (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                  Active Cohort
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-1">
              {programCohort?.initiativeDetails?.name || programInitiativeName || "Active Program"}
            </h2>
            <div className="text-sm text-muted-foreground flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              {programCohort?.['Start Date'] && programCohort?.['End Date'] ? (
                <span>
                  {new Date(programCohort['Start Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                  {' - '}
                  {new Date(programCohort['End Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                </span>
              ) : programCohort?.['Start_Date'] && programCohort?.['End_Date'] ? (
                <span>
                  {new Date(programCohort['Start_Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                  {' - '}
                  {new Date(programCohort['End_Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                </span>
              ) : (
                <span>Active Program • {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3 md:mt-0">
            {/* Dynamic completion percentage based on actual milestones */}
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              {(() => {
                // Use a key to force re-render when milestones change
                const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
                const totalCount = milestones?.length || 0;
                const progressPercentage = totalCount > 0 
                  ? Math.round((completedCount) / totalCount * 100) 
                  : 0;
                
                // Include key values in output for easier debugging
                return `${progressPercentage}% Complete (${completedCount}/${totalCount})`;
              })()}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
              <Flag className="h-3.5 w-3.5 mr-1" />
              {(() => {
                // Same calculation but with different wording
                const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
                const totalCount = milestones?.length || 0;
                return `${completedCount} of ${totalCount} Milestones`;
              })()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Team information section with team details and actions
 */
function TeamInfoSection({ team, onInviteClick, onEditTeamClick }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={team.image} alt={team.name} />
          <AvatarFallback>{team.name?.substring(0, 2).toUpperCase() || "TM"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{team.name || "Your Team"}</h1>
          
          {/* Team Description */}
          {team.description && (
            <p className="text-sm text-muted-foreground mt-1 mb-2 line-clamp-2">
              {team.description}
            </p>
          )}
          
          {/* Team stats */}
          <div className="flex items-center text-muted-foreground">
            {/* Member count with very basic output - zero JS operations */}
            <Users className="h-4 w-4 mr-1" />
            <span data-testid="member-count">
              {team.members?.length} member{team.members?.length !== 1 ? 's' : ''}
            </span>
            
            {team.points > 0 && (
              <>
                <span className="mx-2">•</span>
                <Award className="h-4 w-4 mr-1" />
                <span data-testid="team-points">
                  {team.points} point{team.points !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
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
  )
}