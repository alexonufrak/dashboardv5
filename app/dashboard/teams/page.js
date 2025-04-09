import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getCurrentUserContact,
  getUserTeams,
  getJoinableTeams,
  fetchParallelData 
} from '@/lib/app-router';
import { CreateTeamButton } from './components/CreateTeamButton';
import { JoinTeamButton } from './components/JoinTeamButton';

/**
 * Teams Listing Page - Server Component
 * Shows user's teams and teams available to join
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Teams - xFoundry',
    description: 'View your teams and find teams to join',
  };
}

export default async function TeamsPage() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  try {
    // Get user's contact record
    const contact = await getCurrentUserContact(user);
    const contactId = contact?.id;
    
    if (!contactId) {
      return (
        <div className="container mx-auto py-6 px-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
            <h2 className="text-yellow-800 dark:text-yellow-300 text-lg font-medium mb-2">Profile Not Found</h2>
            <p className="text-yellow-700 dark:text-yellow-200">
              We couldn't find your profile information. Please contact support.
            </p>
          </div>
        </div>
      );
    }
    
    // Fetch data in parallel
    const { userTeams, joinableTeams } = await fetchParallelData({
      userTeams: () => getUserTeams(contactId),
      joinableTeams: () => getJoinableTeams()
    });
    
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Teams</h1>
          <CreateTeamButton contactId={contactId} />
        </div>
        
        <Tabs defaultValue="my-teams" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="my-teams">My Teams</TabsTrigger>
            <TabsTrigger value="joinable-teams">Find Teams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-teams" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading your teams...</div>}>
              <MyTeamsSection teams={userTeams} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="joinable-teams" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading available teams...</div>}>
              <JoinableTeamsSection teams={joinableTeams} userTeams={userTeams} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error loading teams:', error);
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Teams</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}

// Server component for user's teams
function MyTeamsSection({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground mb-2">You are not currently a member of any teams.</p>
        <p className="text-sm text-muted-foreground">
          Join an existing team or create a new one to get started.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map(team => (
        <TeamCard 
          key={team.id}
          team={team}
          isMember={true}
        />
      ))}
    </div>
  );
}

// Server component for joinable teams
function JoinableTeamsSection({ teams, userTeams }) {
  // Get IDs of teams user is already a member of
  const userTeamIds = new Set((userTeams || []).map(team => team.id));
  
  // Filter out teams user is already a member of
  const filteredTeams = (teams || []).filter(team => !userTeamIds.has(team.id));
  
  if (filteredTeams.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground">
          There are no additional teams available to join at this time.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredTeams.map(team => (
        <TeamCard 
          key={team.id}
          team={team}
          isMember={false}
        />
      ))}
    </div>
  );
}

// Team card component
function TeamCard({ team, isMember }) {
  const memberCount = team.members?.length || 0;
  const cohortName = team.cohortName || 'Unknown Cohort';
  const programName = team.programName || 'Unknown Program';
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {/* Team Logo/Image */}
      <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {team.logo ? (
          <img 
            src={team.logo} 
            alt={team.name} 
            className="h-24 w-auto object-contain"
          />
        ) : (
          <div className="text-2xl font-bold px-4 text-center">
            {team.name}
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{team.name}</CardTitle>
          {isMember && (
            <Badge className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              Member
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{programName} • {cohortName}</p>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4">
          {team.description || 'No description available.'}
        </p>
        
        <div className="mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Members:</span>
            <span>{memberCount}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50 dark:bg-gray-900/50 pt-4">
        {isMember ? (
          <Button asChild className="w-full">
            <Link href={`/dashboard/teams/${team.id}`}>
              View Team
            </Link>
          </Button>
        ) : (
          <JoinTeamButtonWrapper team={team} />
        )}
      </CardFooter>
    </Card>
  );
}

// Client components wrapper for join team functionality
function JoinTeamButtonWrapper({ team }) {
  return (
    <div className="flex gap-2 w-full">
      <Button asChild variant="outline" className="flex-1">
        <Link href={`/dashboard/teams/${team.id}`}>
          View Details
        </Link>
      </Button>
      <JoinTeamButton team={team} />
    </div>
  );
}