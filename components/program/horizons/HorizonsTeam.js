import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import TeamMemberList from '../../teams/TeamMemberList';
import TeamPointsSummary from '../../teams/TeamPointsSummary';
import { Progress } from '../../ui/progress';

export default function HorizonsTeam({ programData, team, milestones, onInviteMember }) {
  // Calculate challenge completion for team
  const completedChallenges = milestones?.filter(m => m.completed)?.length || 0;
  const totalChallenges = milestones?.length || 0;
  const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;
  
  const teamLeaderboard = [
    { name: "Team Alpha", points: 850, rank: 1 },
    { name: "Your Team", points: team?.points || 720, rank: 2, isYourTeam: true },
    { name: "Team Omega", points: 680, rank: 3 }
  ];
  
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
              Manage your Horizons Challenge team members.
            </p>
          </CardHeader>
          <CardContent>
            <TeamMemberList team={team} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Challenge Progress</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Challenges Completed</span>
                  <span className="text-sm font-medium">{completedChallenges}/{totalChallenges}</span>
                </div>
                <Progress value={completionRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(completionRate)}% complete
                </p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold">{team?.points || 0}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold">Team Leaderboard</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamLeaderboard.map((leaderTeam) => (
                <div 
                  key={leaderTeam.rank}
                  className={`flex justify-between items-center pb-2 border-b ${
                    leaderTeam.isYourTeam ? "bg-muted/50 p-1 rounded" : ""
                  }`}
                >
                  <div className="font-semibold">{leaderTeam.rank}. {leaderTeam.name}</div>
                  <div className="text-sm font-medium">{leaderTeam.points} pts</div>
                </div>
              ))}
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
                  <h4 className="font-semibold">Team Lead</h4>
                  <p className="text-sm text-muted-foreground">Coordinates team solutions and submissions</p>
                  <p className="text-sm font-medium mt-2">{team?.members?.[0]?.name || 'Unassigned'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 border rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-user.jpg" alt="Innovation Lead" />
                  <AvatarFallback>IL</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">Innovation Lead</h4>
                  <p className="text-sm text-muted-foreground">Leads brainstorming and solution development</p>
                  <p className="text-sm font-medium mt-2">{team?.members?.[1]?.name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Challenge Mentor</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4 p-4 border rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder-user.jpg" alt="Mentor" />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg">Dr. Michael Brown</h4>
              <p className="text-muted-foreground">Innovation Director</p>
              <p className="text-sm text-muted-foreground mt-2">Your challenge mentor will provide guidance throughout the Horizons program, offering feedback and helping your team refine solutions.</p>
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