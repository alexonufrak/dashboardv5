import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Tab } from '@headlessui/react';
import { 
  useProgram, 
  useCohortsByProgram,
  useUserParticipation,
  useTeamMembers,
  useAllRelevantEvents,
  useAllAvailableResources,
  useUserPointsSummary
} from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Calendar, 
  Trophy,
  Activity, 
  Users, 
  FileText,
  Award
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import ErrorDisplay from '@/components/common/ErrorDisplay';

// Import the refactored components
import PointsSummary from './common/PointsSummary.refactored';
import Resources from './common/Resources.refactored';
import UpcomingEvents from './common/UpcomingEvents.refactored';

/**
 * ProgramDashboard Component - Refactored to use the new Airtable hooks
 * A comprehensive dashboard for a specific program/initiative
 */
export default function ProgramDashboard() {
  const router = useRouter();
  const { programId } = router.query;
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch program details
  const { 
    data: program, 
    isLoading: programLoading, 
    error: programError 
  } = useProgram(programId);
  
  // Fetch cohorts for this program
  const { 
    data: cohorts, 
    isLoading: cohortsLoading 
  } = useCohortsByProgram(programId);
  
  // Fetch user's participation in this program
  const { 
    data: participation, 
    isLoading: participationLoading 
  } = useUserParticipation(user?.sub, programId);
  
  // Get the user's team in this program
  const teamId = participation?.teamId;
  
  // Fetch team members if user is in a team
  const { 
    data: teamMembers, 
    isLoading: teamMembersLoading 
  } = useTeamMembers(teamId, {
    enabled: !!teamId
  });
  
  // Determine if all essential data is loading
  const isLoading = programLoading || cohortsLoading || participationLoading;
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-[70%]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="mt-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (programError) {
    return (
      <ErrorDisplay 
        error={programError} 
        message="Could not load program dashboard" 
      />
    );
  }
  
  // Handle missing data
  if (!program) {
    return (
      <div className="p-8 bg-red-50 text-red-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
        <p>We couldn&apos;t find the program you&apos;re looking for. It may have been removed or you don&apos;t have access.</p>
      </div>
    );
  }
  
  // Get active cohort if any
  const activeCohort = cohorts?.find(cohort => 
    cohort.status === 'Active' || cohort.status === 'Open'
  );
  
  // Get cohort ID if user is in a cohort
  const cohortId = participation?.cohortId || activeCohort?.id;

  return (
    <div className="space-y-8">
      {/* Program Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{program.name}</h1>
          <Badge className="text-xs">
            {program.status || 'Active'}
          </Badge>
        </div>
        {program.description && (
          <p className="text-muted-foreground max-w-3xl">
            {program.description}
          </p>
        )}
        {program.institution && (
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Offered by: {program.institution.name}
            </span>
          </div>
        )}
      </div>
      
      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-6 gap-2">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Activities</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span className="hidden md:inline">Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span className="hidden md:inline">Points</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="pt-6">
          <ProgramOverviewTab 
            program={program} 
            cohorts={cohorts} 
            activeCohort={activeCohort}
            participation={participation}
            teamId={teamId}
            programId={programId}
            cohortId={cohortId}
          />
        </TabsContent>
        
        {/* Activities Tab Content */}
        <TabsContent value="activities" className="pt-6">
          <ActivitiesTab 
            programId={programId}
            cohortId={cohortId} 
          />
        </TabsContent>
        
        {/* Team Tab Content */}
        <TabsContent value="team" className="pt-6">
          <TeamTab 
            teamId={teamId} 
            teamMembers={teamMembers} 
            participation={participation}
            programId={programId}
            cohortId={cohortId}
          />
        </TabsContent>
        
        {/* Milestones Tab Content */}
        <TabsContent value="milestones" className="pt-6">
          <MilestonesTab 
            programId={programId}
            cohortId={cohortId}
            teamId={teamId} 
          />
        </TabsContent>
        
        {/* Resources Tab Content */}
        <TabsContent value="resources" className="pt-6">
          <ResourcesTab 
            programId={programId} 
            cohortId={cohortId} 
          />
        </TabsContent>
        
        {/* Points Tab Content */}
        <TabsContent value="points" className="pt-6">
          <PointsTab userId={user?.sub} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function ProgramOverviewTab({ 
  program, 
  cohorts, 
  activeCohort, 
  participation,
  teamId,
  programId,
  cohortId
}) {
  const hasTeam = !!teamId;
  const isParticipating = !!participation;
  
  return (
    <div className="space-y-8">
      {/* Program Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Participation Status</CardTitle>
          <CardDescription>
            {isParticipating 
              ? 'You are currently participating in this program' 
              : 'You are not currently participating in this program'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium mb-1">Cohort</h3>
              {participation?.cohortName ? (
                <p>{participation.cohortName}</p>
              ) : activeCohort ? (
                <div>
                  <p className="text-muted-foreground">Not enrolled</p>
                  <p className="text-sm mt-1">
                    Active cohort: {activeCohort.name}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No active cohorts</p>
              )}
            </div>
            
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium mb-1">Team</h3>
              {hasTeam ? (
                <p>{participation.teamName}</p>
              ) : isParticipating ? (
                <p className="text-muted-foreground">
                  You haven&apos;t joined a team yet
                </p>
              ) : (
                <p className="text-muted-foreground">Join the program to create or join a team</p>
              )}
            </div>
            
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-medium mb-1">Status</h3>
              <p>
                {participation?.status || (isParticipating ? 'Active' : 'Not Participating')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Overview Widgets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Events Widget */}
        <UpcomingEvents 
          programId={programId}
          cohortId={cohortId}
        />
        
        {/* Points Summary Widget */}
        <PointsSummary />
      </div>
    </div>
  );
}

// Activities Tab Component
function ActivitiesTab({ programId, cohortId }) {
  const { user } = useUser();
  
  // Use the all relevant events hook
  const { 
    data: events, 
    isLoading, 
    error 
  } = useAllRelevantEvents(user?.sub, programId, cohortId);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        message="Could not load activities" 
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Program Activities
          </CardTitle>
          <CardDescription>
            All activities and events for this program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{event.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="flex items-center mt-2">
                        <Badge variant="outline">{event.type}</Badge>
                        {event.startDateTime && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(event.startDateTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
              <p className="text-muted-foreground">No activities available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Team Tab Component
function TeamTab({ 
  teamId, 
  teamMembers, 
  participation,
  programId,
  cohortId
}) {
  if (!teamId) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
        <h3 className="text-lg font-medium mb-2">No Team Found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {participation 
            ? "You haven't joined a team for this program yet. Create or join a team to get started on your journey."
            : "You need to join this program before you can create or join a team."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{participation?.teamName || 'Your Team'}</CardTitle>
          <CardDescription>
            Members of your team in this program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers && teamMembers.length > 0 ? (
            <div className="space-y-4">
              {teamMembers.map(member => (
                <div key={member.id} className="p-4 rounded-lg border flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <Badge>
                    {member.role || 'Member'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
              <p className="text-muted-foreground">No team members found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Milestones Tab Component
function MilestonesTab({ programId, cohortId, teamId }) {
  // This would typically use the milestones hooks once implemented
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Program Milestones
          </CardTitle>
          <CardDescription>
            Track your progress through program milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
            <p className="text-muted-foreground">Milestone tracking is currently being implemented</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Resources Tab Component 
function ResourcesTab({ programId, cohortId }) {
  return (
    <div className="space-y-6">
      <Resources 
        programId={programId}
        cohortId={cohortId}
      />
    </div>
  );
}

// Points Tab Component
function PointsTab({ userId }) {
  // Use the points hooks
  const { 
    data: pointsSummary, 
    isLoading, 
    error 
  } = useUserPointsSummary(userId);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        message="Could not load points information" 
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Points
          </CardTitle>
          <CardDescription>
            Track your points and rewards in this program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-lg border bg-primary/5 text-center">
              <h3 className="text-lg font-medium mb-1">Available Points</h3>
              <p className="text-3xl font-bold">{pointsSummary?.available || 0}</p>
            </div>
            
            <div className="p-6 rounded-lg border bg-primary/5 text-center">
              <h3 className="text-lg font-medium mb-1">Total Earned</h3>
              <p className="text-3xl font-bold">{pointsSummary?.total || 0}</p>
            </div>
            
            <div className="p-6 rounded-lg border bg-primary/5 text-center">
              <h3 className="text-lg font-medium mb-1">Points Spent</h3>
              <p className="text-3xl font-bold">{pointsSummary?.spent || 0}</p>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
          {pointsSummary?.transactions && pointsSummary.transactions.length > 0 ? (
            <div className="space-y-3">
              {pointsSummary.transactions.slice(0, 5).map(transaction => (
                <div 
                  key={transaction.id}
                  className="p-3 rounded-lg border flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium">{transaction.description || transaction.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {transaction.createdTime 
                        ? new Date(transaction.createdTime).toLocaleDateString() 
                        : 'Unknown date'}
                    </p>
                  </div>
                  <Badge className={transaction.points >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {transaction.points >= 0 ? '+' : ''}{transaction.points}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}