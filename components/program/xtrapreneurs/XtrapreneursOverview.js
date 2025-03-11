import React from 'react';
import { Card, CardHeader, CardContent } from '../../ui/card';
import BountyCard from './BountyCard';
import TeamMemberList from '../../teams/TeamMemberList';
import TeamPointsSummary from '../../teams/TeamPointsSummary';

export default function XtrapreneursOverview({ programData, bounties, team, onViewBounties, onViewMembers }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div className="md:col-span-5 space-y-4">
        <MainXtrapreneursContent 
          bounties={bounties}
          onViewBounties={onViewBounties}
        />
      </div>
      <div className="md:col-span-2 space-y-4">
        <XtrapreneursSidebar 
          team={team}
          onViewMembers={onViewMembers}
        />
      </div>
    </div>
  );
}

function MainXtrapreneursContent({ bounties, onViewBounties }) {
  // Display only the 3 most recent bounties
  const recentBounties = bounties?.slice(0, 3) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Bounties</h3>
            <button 
              onClick={onViewBounties}
              className="text-sm text-primary hover:underline"
            >
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBounties.length > 0 ? (
              recentBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No active bounties available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Program Resources</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            <p>Access Xtrapreneurs-specific resources, documentation, and help guides.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Bounty Submission Guidelines</li>
              <li>Judging Criteria</li>
              <li>Workshop Recordings</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function XtrapreneursSidebar({ team, onViewMembers }) {
  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Team Points</h3>
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
    </>
  );
}