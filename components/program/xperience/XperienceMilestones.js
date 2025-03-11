import React from 'react';
import MilestoneTable from '../../milestones/MilestoneTable';
import MilestoneTimeline from '../../milestones/MilestoneTimeline';
import { Card, CardHeader, CardContent } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

export default function XperienceMilestones({ programData, milestones, submissions, team }) {
  // Filter milestones by status
  const upcomingMilestones = milestones?.filter(m => !m.completed) || [];
  const completedMilestones = milestones?.filter(m => m.completed) || [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Xperience Program Milestones</h2>
          <p className="text-muted-foreground">
            Track your progress through the Xperience internship program.
          </p>
        </CardHeader>
        <CardContent>
          <MilestoneTimeline milestones={milestones} />
        </CardContent>
      </Card>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcomingMilestones.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedMilestones.length})</TabsTrigger>
          <TabsTrigger value="all">All Milestones ({milestones?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardContent className="p-4">
              <MilestoneTable 
                milestones={upcomingMilestones}
                submissions={submissions}
                showStatus={true}
                emptyMessage="No upcoming milestones."
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardContent className="p-4">
              <MilestoneTable 
                milestones={completedMilestones}
                submissions={submissions}
                showStatus={true}
                emptyMessage="No completed milestones yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all">
          <Card>
            <CardContent className="p-4">
              <MilestoneTable 
                milestones={milestones}
                submissions={submissions}
                showStatus={true}
                emptyMessage="No milestones available."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Xperience Program Resources</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Access helpful resources for completing your Xperience program milestones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Milestone Submission Guidelines</h4>
                  <p className="text-sm text-muted-foreground">Learn how to properly document and submit your milestone progress.</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Internship Best Practices</h4>
                  <p className="text-sm text-muted-foreground">Tips for making the most of your internship experience.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}