import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import TeamMemberList from '../../teams/TeamMemberList';
import TeamPointsSummary from '../../teams/TeamPointsSummary';
import { Progress } from '../../ui/progress';

export default function XtrapreneursTeam({ programData, team, bounties, onInviteMember }) {
  // Calculate bounty completion rate
  const completedBounties = bounties?.filter(b => b.completed)?.length || 0;
  const totalBounties = bounties?.length || 0;
  const bountyCompletionRate = totalBounties > 0 ? (completedBounties / totalBounties) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Team Members</h2>
              <Button size="sm" onClick={onInviteMember}>
                Invite Member
              </Button>
            </div>
            <p className="text-muted-foreground">
              Manage your Xtrapreneurs venture team members.
            </p>
          </CardHeader>
          <CardContent>
            <TeamMemberList team={team} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Team Points</h3>
          </CardHeader>
          <CardContent>
            <TeamPointsSummary team={team} />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Team Stats</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Bounty Completion</span>
                  <span className="text-sm font-medium">{completedBounties}/{totalBounties}</span>
                </div>
                <Progress value={bountyCompletionRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(bountyCompletionRate)}% of bounties completed
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold">{team?.points || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold">{team?.members?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Team Size</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Team Roles</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 border rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-user.jpg" alt="Team Lead" />
                  <AvatarFallback>TL</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">Venture Lead</h4>
                  <p className="text-sm text-muted-foreground">Leads the venture team and coordinates activities</p>
                  <p className="text-sm font-medium mt-2">{team?.members?.[0]?.name || 'Unassigned'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 border rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-user.jpg" alt="Tech Lead" />
                  <AvatarFallback>TL</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">Technical Lead</h4>
                  <p className="text-sm text-muted-foreground">Manages technical implementation of bounties</p>
                  <p className="text-sm font-medium mt-2">{team?.members?.[1]?.name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Venture Advisor</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4 p-4 border rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder-user.jpg" alt="Advisor" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg">John Doe</h4>
              <p className="text-muted-foreground">Entrepreneur & Angel Investor</p>
              <p className="text-sm text-muted-foreground mt-2">Your venture advisor will help guide your team through the startup journey, providing industry insights and feedback on your work.</p>
              <Button size="sm" variant="outline" className="mt-4">
                Schedule Meeting
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}