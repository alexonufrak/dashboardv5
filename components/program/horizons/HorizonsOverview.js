import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import MilestoneSummaryCard from '../../milestones/MilestoneSummaryCard';
import TeamMemberList from '../../teams/TeamMemberList';
import TeamPointsSummary from '../../teams/TeamPointsSummary';
import { Progress } from '../../ui/progress';

export default function HorizonsOverview({ programData, milestones, team, onViewMilestones, onViewMembers }) {
  // Calculate challenge progress
  const completedMilestones = milestones?.filter(m => m.completed)?.length || 0;
  const totalMilestones = milestones?.length || 0;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-5 space-y-4">
        <MainHorizonsContent 
          milestones={milestones}
          progressPercentage={progressPercentage}
          completedMilestones={completedMilestones}
          totalMilestones={totalMilestones}
          onViewMilestones={onViewMilestones}
        />
      </div>
      <div className="md:col-span-2 space-y-4">
        <HorizonsSidebar 
          team={team}
          onViewMembers={onViewMembers}
        />
      </div>
    </div>
  );
}

function MainHorizonsContent({ milestones, progressPercentage, completedMilestones, totalMilestones, onViewMilestones }) {
  // Get next 3 uncompleted milestones
  const upcomingMilestones = milestones
    ?.filter(m => !m.completed)
    ?.slice(0, 3) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Horizons Challenge Progress</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {completedMilestones} of {totalMilestones} challenges completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upcoming Challenges</h3>
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
            {upcomingMilestones.length > 0 ? (
              upcomingMilestones.map((milestone) => (
                <MilestoneSummaryCard key={milestone.id} milestone={milestone} />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                All challenges completed!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Horizons Resources</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            <p>Access Horizons Challenge resources, guides, and learning materials.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Challenge Submission Templates</li>
              <li>Design Thinking Resources</li>
              <li>Expert Feedback Sessions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function HorizonsSidebar({ team, onViewMembers }) {
  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Team Leaderboard</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-semibold">1. Team Alpha</div>
              <div className="text-sm font-medium">850 pts</div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b bg-muted/50 p-1 rounded">
              <div className="font-semibold">2. Your Team</div>
              <div className="text-sm font-medium">720 pts</div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="font-semibold">3. Team Omega</div>
              <div className="text-sm font-medium">680 pts</div>
            </div>
          </div>
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
          <h3 className="text-lg font-semibold">Team Points</h3>
        </CardHeader>
        <CardContent>
          <TeamPointsSummary team={team} />
        </CardContent>
      </Card>
    </>
  );
}