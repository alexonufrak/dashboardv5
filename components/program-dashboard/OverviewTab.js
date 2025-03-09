"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"
import MilestoneSummaryCard from "@/components/milestones/MilestoneSummaryCard"
import SubmissionSummaryCard from "@/components/submissions/SubmissionSummaryCard"
import TeamPointsSummary from "@/components/teams/TeamPointsSummary"
import TeamMemberList from "@/components/teams/TeamMemberList"

/**
 * Overview tab content component that displays program overview information
 */
export function OverviewTab({ 
  milestones, 
  isTeamProgram, 
  team, 
  teamData,
  onViewMilestones,
  onViewMembers
}) {
  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 w-full">
        {/* Main Overview Content */}
        <MainOverviewContent 
          milestones={milestones} 
          teamData={teamData}
          onViewMilestones={onViewMilestones}
        />
        
        {/* Sidebar */}
        <OverviewSidebar 
          isTeamProgram={isTeamProgram} 
          team={team}
          onViewMembers={onViewMembers}
        />
      </div>
    </div>
  )
}

/**
 * Main content area for the overview tab
 */
function MainOverviewContent({ milestones, teamData, onViewMilestones }) {
  const collectSubmissions = () => {
    // Skip lengthy processing if team data isn't available
    if (!teamData?.id) return [];
    
    // Start with an empty array for submissions
    let submissions = [];
    
    // APPROACH 1: Get submissions directly from team data (per Airtable schema)
    if (teamData.fields?.Submissions && Array.isArray(teamData.fields.Submissions)) {
      console.log(`Team has ${teamData.fields.Submissions.length} submission IDs in Airtable`);
      
      // Convert raw submission IDs to properly formatted submission objects
      submissions = teamData.fields.Submissions
        .filter(Boolean)
        .map(submissionId => ({
          id: submissionId,
          teamId: teamData.id,
          createdTime: new Date().toISOString()
        }));
    }
    
    // APPROACH 2: Get submissions from team members
    if (submissions.length === 0 && teamData.members && Array.isArray(teamData.members)) {
      // Collect member submission IDs
      const memberSubmissions = [];
      
      teamData.members.forEach(member => {
        if (member.submissions && Array.isArray(member.submissions)) {
          member.submissions.forEach(submissionId => {
            if (!memberSubmissions.includes(submissionId)) {
              memberSubmissions.push(submissionId);
            }
          });
        }
      });
      
      if (memberSubmissions.length > 0) {
        submissions = memberSubmissions.map(submissionId => ({
          id: submissionId,
          teamId: teamData.id,
          createdTime: new Date().toISOString()
        }));
      }
    }
    
    console.log(`Providing ${submissions.length} submissions to SubmissionSummaryCard`);
    return submissions;
  };

  return (
    <div className="md:col-span-5 space-y-4 w-full">
      {/* Milestone Summary Card */}
      <MilestoneSummaryCard 
        milestones={milestones || []}
        onViewMilestones={onViewMilestones}
      />

      {/* Submission Summary Card with enhanced submission data */}
      <SubmissionSummaryCard 
        milestones={milestones || []}
        submissions={collectSubmissions()}
      />
    </div>
  )
}

/**
 * Sidebar content for the overview tab
 */
function OverviewSidebar({ isTeamProgram, team, onViewMembers }) {
  return (
    <div className="md:col-span-2 space-y-4 w-full">
      {/* Points */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Points</CardTitle>
        </CardHeader>
        <CardContent>
          {isTeamProgram ? (
            <TeamPointsSummary team={team} />
          ) : (
            <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
              <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-xl text-muted-foreground font-medium">Individual Points</div>
              <div className="text-sm text-muted-foreground mt-1">
                Not enabled for this program
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Team Members (if team-based) */}
      {isTeamProgram && team && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Team Members</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={onViewMembers}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[250px]">
              <TeamMemberList team={team} truncated={true} />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}