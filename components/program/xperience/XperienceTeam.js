import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import TeamMemberList from '../../teams/TeamMemberList';
import TeamPointsSummary from '../../teams/TeamPointsSummary';

export default function XperienceTeam({ programData, team, onInviteMember }) {
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
              Manage your Xperience internship team members.
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
      
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Team Roles</h3>
          <p className="text-muted-foreground">
            Assign and manage roles for your Xperience team.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder-user.jpg" alt="Team Lead" />
                <AvatarFallback>TL</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">Team Lead</h4>
                <p className="text-sm text-muted-foreground">Coordinates team activities and submission reviews</p>
                <p className="text-sm font-medium mt-2">{team?.members?.[0]?.name || 'Unassigned'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder-user.jpg" alt="Documentation" />
                <AvatarFallback>DC</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">Documentation Coordinator</h4>
                <p className="text-sm text-muted-foreground">Manages milestone documentation and submissions</p>
                <p className="text-sm font-medium mt-2">{team?.members?.[1]?.name || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Team Mentor</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4 p-4 border rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder-user.jpg" alt="Mentor" />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg">Jane Smith</h4>
              <p className="text-muted-foreground">Senior Product Manager</p>
              <p className="text-sm text-muted-foreground mt-2">Your industry mentor will guide your team through the Xperience program, providing professional advice and feedback on your work.</p>
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