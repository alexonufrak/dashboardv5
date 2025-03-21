"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, BarChart3, Flag } from "lucide-react"

/**
 * Program card component with program information and milestone stats
 */
export function ProgramCard({ programCohort, programInitiativeName, milestones }) {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {programCohort?.initiativeDetails?.name || programInitiativeName}
          </Badge>
          
          {(programCohort?.['Current Cohort'] === true || 
            programCohort?.['Current Cohort'] === 'true' || 
            programCohort?.['Is Current'] === true ||
            programCohort?.['Is Current'] === 'true') && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Active Cohort
            </Badge>
          )}
        </div>
        <CardTitle>
          {programCohort?.initiativeDetails?.name || programInitiativeName || "Active Program"}
        </CardTitle>
        <CardDescription className="flex items-center">
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
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Program description would go here if available */}
        {programCohort?.description && (
          <p className="text-sm text-muted-foreground mb-4">{programCohort.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {/* Dynamic completion percentage based on actual milestones */}
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
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
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
            <Flag className="h-3.5 w-3.5 mr-1" />
            {(() => {
              // Same calculation but with different wording
              const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
              const totalCount = milestones?.length || 0;
              return `${completedCount} of ${totalCount} Milestones`;
            })()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}