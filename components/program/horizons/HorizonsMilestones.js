import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import MilestoneTable from '../../milestones/MilestoneTable';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';

export default function HorizonsMilestones({ programData, milestones, submissions, team }) {
  // Count completed and upcoming milestones
  const completedMilestones = milestones?.filter(m => m.completed) || [];
  const upcomingMilestones = milestones?.filter(m => !m.completed) || [];
  const totalMilestones = milestones?.length || 0;
  
  // Calculate progress
  const progressPercentage = totalMilestones > 0 
    ? (completedMilestones.length / totalMilestones) * 100 
    : 0;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Horizons Challenges</h2>
          <p className="text-muted-foreground">
            Track your progress through the Horizons Challenge program.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {completedMilestones.length} of {totalMilestones} challenges completed
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <h3 className="text-3xl font-bold">{totalMilestones}</h3>
                  <p className="text-sm text-muted-foreground">Total Challenges</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <h3 className="text-3xl font-bold">{completedMilestones.length}</h3>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <h3 className="text-3xl font-bold">{upcomingMilestones.length}</h3>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">All Challenges</h3>
        </CardHeader>
        <CardContent>
          <MilestoneTable 
            milestones={milestones || []}
            submissions={submissions}
            showStatus={true}
            emptyMessage="No challenges available."
            customColumns={[
              {
                header: "Difficulty",
                cell: (milestone) => {
                  const difficulty = milestone.difficulty || "Medium";
                  const colorMap = {
                    Easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                    Medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                    Hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  };
                  
                  return (
                    <Badge className={colorMap[difficulty] || "bg-gray-100 text-gray-800"}>
                      {difficulty}
                    </Badge>
                  );
                }
              }
            ]}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Challenge Resources</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Access resources to help you complete the Horizons challenges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Design Thinking Guidelines</h4>
                  <p className="text-sm text-muted-foreground">Learn the design thinking process used in Horizons challenges.</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Expert Feedback Sessions</h4>
                  <p className="text-sm text-muted-foreground">Schedule time with industry experts to review your work.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}