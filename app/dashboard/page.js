'use client';

import { Suspense, useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BlurFade } from '@/components/magicui/blur-fade';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@auth0/nextjs-auth0';
import { 
  Home, 
  ExternalLink, 
  LogOut, 
  Command, 
  Compass, 
  User, 
  Users, 
  CalendarDays,
  Blocks,
  AlertTriangle,
  BookOpen,
  Award,
  Clock,
  Calendar,
  ArrowRight,
  Building2,
  BarChart2,
  ListTodo,
  Trophy,
  Milestone
} from 'lucide-react';

import { 
  getCurrentUserContact,
  getUserTeams, 
  getActivePrograms, 
  getUpcomingEvents,
  fetchParallelData 
} from '@/lib/app-router';

/**
 * Dashboard Page - Client Component to match Pages Router version
 * Main dashboard page showing user's programs, teams, and upcoming events
 * Uses React hooks for data fetching
 */
export default function DashboardPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [data, setData] = useState({
    profile: null,
    teams: [],
    programs: [],
    events: [],
    participationData: { participation: [] },
    applications: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!user && !isUserLoading) {
      redirect('/auth/login');
    }

    // Fetch dashboard data
    if (user && !isUserLoading) {
      const fetchDashboardData = async () => {
        try {
          // First get the contact
          const response = await fetch('/api/user/profile');
          const contactData = await response.json();
          
          if (!contactData || !contactData.contact) {
            throw new Error('Failed to load profile data');
          }

          const contact = contactData.contact;
          
          // Then fetch everything else in parallel
          const [teamsData, programsData, eventsData] = await Promise.all([
            fetch(`/api/teams/members/${contact.id}`).then(res => res.json()),
            fetch('/api/programs/details-v2').then(res => res.json()),
            fetch('/api/events/upcoming-v2').then(res => res.json())
          ]);

          // Set everything to state
          setData({
            profile: contact,
            teams: teamsData.teams || [],
            programs: programsData.programs || [],
            events: eventsData.events || [],
            participationData: { 
              participation: teamsData.teams?.map(team => ({ 
                team, 
                cohort: { 
                  milestones: [] 
                }
              })) || []
            },
            applications: [],
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to load dashboard data'
          }));
        }
      };

      fetchDashboardData();
    }
  }, [user, isUserLoading]);

  // Show loading screen while data is loading
  if (data.isLoading || isUserLoading) {
    return (
      <div className="flex flex-col gap-6 mt-10">
        <Skeleton className="h-[30px] w-[280px] rounded-sm" />
        
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[80px] w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[250px] rounded-lg" />
            <Skeleton className="h-[250px] rounded-lg" />
            <Skeleton className="h-[250px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Show error message if there's an error
  if (data.error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {data.error}. Please try refreshing the page or contact support if the issue persists.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate summary data
  const getSummaryData = () => {
    if (!data.profile || !data.participationData) return null;
    
    // Count active programs
    const activePrograms = data.participationData?.participation?.length || 0;
    
    // Count milestones
    const totalMilestones = data.participationData?.participation?.reduce((total, p) => {
      return total + (p.cohort?.milestones?.length || 0);
    }, 0) || 0;
    
    const completedMilestones = data.participationData?.participation?.reduce((total, p) => {
      const completedCount = p.cohort?.milestones?.filter(m => 
        m.submissions?.some(s => 
          s.teamId === (p.team?.id) && s.status === 'approved'
        )
      )?.length || 0;
      return total + completedCount;
    }, 0) || 0;
    
    // Team count
    const teamCount = data.teams?.length || 0;
    
    return {
      activePrograms,
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        percentage: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
      },
      teamCount
    };
  };
  
  // Get calculated summary data
  const summaryData = getSummaryData();
  
  return (
    <div className="dashboard-content space-y-6">
      {/* Page Header */}
      <BlurFade delay={0.1} direction="up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Hub</h1>
            <p className="text-muted-foreground">
              Welcome, {data.profile?.firstName || user?.name?.split(' ')[0] || 'Student'}
            </p>
          </div>
        </div>
      </BlurFade>
      
      {/* Main Content - Bento Grid */}
      <div className="hidden items-start justify-center gap-6 rounded-lg md:grid lg:grid-cols-2 xl:grid-cols-3">
        {/* Left Column - Programs Card & Teams Card */}
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          {/* Programs Card */}
          <BlurFade delay={0.2} direction="up">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span>Programs</span>
                  </CardTitle>
                  <CardDescription>
                    Available programs for your institution
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  asChild
                >
                  <Link href="/dashboard/programs">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.programs?.slice(0, 3).map((program, idx) => (
                  <BlurFade key={program.id || idx} delay={0.25 + (idx * 0.05)} direction="up">
                    <div 
                      className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                        <Blocks className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium truncate text-sm">{program.name || "Program"}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {program.shortDescription || "Current Program"}
                        </p>
                      </div>
                    </div>
                  </BlurFade>
                ))}
                {(!data.programs || data.programs.length === 0) && (
                  <BlurFade delay={0.3} direction="up">
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="mb-2">No programs available for your institution</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/programs">
                          Check Programs Page
                        </Link>
                      </Button>
                    </div>
                  </BlurFade>
                )}
              </CardContent>
            </Card>
          </BlurFade>

          {/* Teams Card */}
          <BlurFade delay={0.3} direction="up">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Your Teams</span>
                </CardTitle>
                <CardDescription>
                  Teams you&apos;re participating in
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.teams && data.teams.length > 0 ? (
                  <>
                    {data.teams.slice(0, 2).map((team, index) => (
                      <BlurFade key={team.id} delay={0.35 + (index * 0.05)} direction="up">
                        <div 
                          className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="font-medium">{team.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            asChild 
                          >
                            <Link href={`/dashboard/teams/${team.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </BlurFade>
                    ))}
                  </>
                ) : (
                  <BlurFade delay={0.35} direction="up">
                    <div className="text-center py-6 text-muted-foreground">
                      <p>You haven&apos;t joined any teams yet</p>
                      <p className="text-sm mt-1">Join or create a team to get started</p>
                    </div>
                  </BlurFade>
                )}
              </CardContent>
            </Card>
          </BlurFade>
        </div>

        {/* Middle Column - Upcoming Milestones & Progress Stats */}
        <div className="col-span-2 grid items-start gap-6 lg:col-span-1">
          {/* Upcoming Milestones Card */}
          <BlurFade delay={0.4} direction="up">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  <span>Upcoming Deadlines</span>
                </CardTitle>
                <CardDescription>
                  Your upcoming milestone deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <BlurFade delay={0.45} direction="up">
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No upcoming milestones</p>
                  </div>
                </BlurFade>
              </CardContent>
            </Card>
          </BlurFade>

          {/* Stats Card */}
          <BlurFade delay={0.5} direction="up">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <span>Your Progress</span>
                </CardTitle>
                <CardDescription>
                  Your participation overview
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Active Programs</span>
                    </div>
                    <span className="font-semibold">{summaryData?.activePrograms || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Teams</span>
                    </div>
                    <span className="font-semibold">{summaryData?.teamCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">Milestones Completed</span>
                    </div>
                    <span className="font-semibold">
                      {summaryData?.milestones?.completed || 0}/{summaryData?.milestones?.total || 0}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 pt-2">
                    <Progress value={summaryData?.milestones?.percentage || 0} className="h-2" />
                    <p className="text-xs text-right text-muted-foreground">
                      {summaryData?.milestones?.percentage || 0}% Complete
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
        
        {/* Join Requests Column (for larger screens) */}
        <div className="col-span-2 grid items-start gap-6 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          <BlurFade delay={0.6} direction="up">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Team Invitations</span>
                </CardTitle>
                <CardDescription>
                  Pending team join requests and invitations
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <BlurFade delay={0.65} direction="up">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No pending team requests</p>
                  </div>
                </BlurFade>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
      
      {/* Mobile-only Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {/* Programs Card - Mobile */}
        <BlurFade delay={0.2} direction="up">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Programs</span>
                </CardTitle>
                <CardDescription>
                  Available programs
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                asChild
              >
                <Link href="/dashboard/programs">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.programs?.slice(0, 2).map((program, idx) => (
                  <div 
                    key={program.id || idx}
                    className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                      <Blocks className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-medium truncate text-sm">{program.name || "Program"}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {program.shortDescription || "Current Program"}
                      </p>
                    </div>
                  </div>
                ))}
                {(!data.programs || data.programs.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="mb-2">No programs available</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/programs">
                        Check Programs Page
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </BlurFade>
        
        {/* Teams Card - Mobile */}
        <BlurFade delay={0.3} direction="up">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Your Teams</span>
              </CardTitle>
              <CardDescription>
                Teams you&apos;re participating in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.teams && data.teams.length > 0 ? (
                <div className="space-y-3">
                  {data.teams.slice(0, 1).map((team) => (
                    <div 
                      key={team.id}
                      className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium">{team.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild 
                      >
                        <Link href={`/dashboard/teams/${team.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No teams joined yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </BlurFade>
        
        {/* Stats Card - Mobile */}
        <BlurFade delay={0.4} direction="up">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Programs</span>
                  <span className="font-semibold">{summaryData?.activePrograms || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Teams</span>
                  <span className="font-semibold">{summaryData?.teamCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Milestones Completed</span>
                  <span className="font-semibold">
                    {summaryData?.milestones?.completed || 0}/{summaryData?.milestones?.total || 0}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Progress value={summaryData?.milestones?.percentage || 0} className="h-2" />
                  <p className="text-xs text-right text-muted-foreground">
                    {summaryData?.milestones?.percentage || 0}% Complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    </div>
  );
}