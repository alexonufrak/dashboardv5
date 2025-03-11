import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import MilestoneSummaryCard from '../../milestones/MilestoneSummaryCard';
import SubmissionSummaryCard from '../../submissions/SubmissionSummaryCard';
import TeamMemberList from '../../teams/TeamMemberList';
import TeamPointsSummary from '../../teams/TeamPointsSummary';

export default function XperienceOverview({ programData, milestones, submissions, team, onViewMilestones, onViewMembers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-5 space-y-4">
        <MainXperienceContent 
          milestones={milestones}
          submissions={submissions}
          onViewMilestones={onViewMilestones}
        />
      </div>
      <div className="md:col-span-2 space-y-4">
        <XperienceSidebar 
          team={team}
          onViewMembers={onViewMembers}
        />
      </div>
    </div>
  );
}

function MainXperienceContent({ milestones, submissions, onViewMilestones }) {
  // Filter for up to 3 active or upcoming milestones
  const activeMilestones = milestones
    ?.filter(m => !m.completed)
    ?.slice(0, 3) || [];
  
  // Get recent submissions (up to 2)
  const recentSubmissions = submissions?.slice(0, 2) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Xperience Milestones</h3>
            <button 
              onClick={onViewMilestones}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeMilestones.length > 0 ? (
              activeMilestones.map((milestone) => (
                <MilestoneSummaryCard key={milestone.id} milestone={milestone} />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No active milestones available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Submissions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <SubmissionSummaryCard key={submission.id} submission={submission} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Xperience Resources</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            <p>Access Xperience-specific resources, internship guides, and learning materials.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Internship Best Practices</li>
              <li>Mentor Meeting Templates</li>
              <li>Career Development Resources</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function XperienceSidebar({ team, onViewMembers }) {
  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Experience Points</h3>
        </CardHeader>
        <CardContent>
          <TeamPointsSummary team={team} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <button 
              onClick={onViewMembers}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <TeamMemberList team={team} maxMembers={3} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="pb-2 border-b">
              <p className="font-semibold">Mid-internship Check-in</p>
              <p className="text-sm text-muted-foreground">June 15, 2025</p>
            </li>
            <li>
              <p className="font-semibold">Final Presentation</p>
              <p className="text-sm text-muted-foreground">August 10, 2025</p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}