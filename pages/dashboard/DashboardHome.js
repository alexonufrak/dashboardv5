"use client"

import { useState, useEffect, useRef } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { toast } from "sonner"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ROUTES, navigateToPrograms } from "@/lib/routing"
import { useRouter } from "next/router"

// Use dynamic import with SSR disabled to prevent context errors during build
const DashboardHomeContent = dynamic(() => Promise.resolve(DashboardHomeInner), { 
  ssr: false 
})

// Import components
import TeamCard from "@/components/teams/TeamCard"
import TeamJoinRequests from "@/components/teams/TeamJoinRequests"
import EmailMismatchAlert from "@/components/auth/EmailMismatchAlert"
import TeamInviteSuccessAlert from "@/components/teams/TeamInviteSuccessAlert"
// ProfileEditModal is now included in MainDashboardLayout

// Import UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { BlurFade } from "@/components/magicui/blur-fade"

// Import icons
import { 
  Blocks,
  Users,
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
} from "lucide-react"

// Inner component that uses dashboard context
function DashboardHomeInner({ onNavigate }) {
  // Get data from dashboard context
  const { 
    user, 
    profile, 
    isLoading, 
    error, 
    teamsData, 
    isTeamLoading, 
    applications, 
    isLoadingApplications,
    isEditModalOpen, 
    setIsEditModalOpen,
    handleProfileUpdate,
    participationData,
    isProgramLoading
  } = useDashboard()

  const router = useRouter()
  
  // Get onboarding functions from onboarding context
  const { checkOnboardingStatus } = useOnboarding()
  
  // Initialize onboarding on component mount - use a ref to prevent infinite loop
  const onboardingInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only run this once all data is available and not yet initialized
    if (profile && !onboardingInitializedRef.current && !isProgramLoading) {
      console.log("Checking onboarding status with all data loaded", {
        "Onboarding status": profile.Onboarding || "Not set",
        "Has applications": applications?.length > 0,
        "Has participation": profile.hasActiveParticipation || false,
        "Has participation records": participationData?.participation?.length > 0,
        "Profile ID": profile?.contactId,
        "Program data loaded": !isProgramLoading && !!participationData
      });
      
      // Wait for everything to be fully loaded
      setTimeout(() => {
        // Pass ALL available data for most accurate onboarding check
        checkOnboardingStatus({
          ...profile,
          applications: applications,
          participationData: participationData,
          // Add explicit participation property to match what's expected in Airtable
          Participation: participationData?.participation || [],
          // Extract nested values to match the enhanced profile format
          hasActiveParticipation: participationData?.participation?.length > 0 || 
                            profile.hasActiveParticipation || false
        });
        
        // Mark as initialized to prevent unnecessary rechecks
        onboardingInitializedRef.current = true;
      }, 500); 
    }
  }, [profile, applications, participationData, isProgramLoading, checkOnboardingStatus])
  
  // Handler functions
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };
  
  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  // Navigate to programs page
  const handleViewAllPrograms = () => {
    navigateToPrograms(router);
  };

  // Calculate summary data
  const getSummaryData = () => {
    if (!profile || !participationData) return null;
    
    // Count active programs
    const activePrograms = participationData?.participation?.length || 0;
    
    // Count milestones
    const totalMilestones = participationData?.participation?.reduce((total, p) => {
      return total + (p.cohort?.milestones?.length || 0);
    }, 0) || 0;
    
    const completedMilestones = participationData?.participation?.reduce((total, p) => {
      const completedCount = p.cohort?.milestones?.filter(m => 
        m.submissions?.some(s => 
          s.teamId === (p.team?.id) && s.status === 'approved'
        )
      )?.length || 0;
      return total + completedCount;
    }, 0) || 0;
    
    // Team count
    const teamCount = teamsData?.length || 0;
    
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

  // Show loading screen while data is loading
  if (isLoading) {
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
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page or contact support if the issue persists.
        </AlertDescription>
      </Alert>
    )
  }
  
  // Main JSX content
  return (
    <div className="dashboard-content space-y-6">
      {/* Alerts and notifications */}
      {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
      <TeamInviteSuccessAlert />
      
      {/* Page Header */}
      <BlurFade delay={0.1} direction="up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Hub</h1>
            <p className="text-muted-foreground">
              Welcome, {profile?.firstName || user?.name?.split(' ')[0] || 'Student'}
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
                  onClick={handleViewAllPrograms}
                  className="h-8"
                >
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3">
                {profile?.cohorts?.slice(0, 3).map((cohort, idx) => (
                  <BlurFade key={cohort.id || idx} delay={0.25 + (idx * 0.05)} direction="up">
                    <div 
                      className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                        <Blocks className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium truncate text-sm">{cohort.initiativeDetails?.name || "Program"}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {cohort.name || "Current Cohort"}
                        </p>
                      </div>
                    </div>
                  </BlurFade>
                ))}
                {(!profile?.cohorts || profile.cohorts.length === 0) && (
                  <BlurFade delay={0.3} direction="up">
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="mb-2">No programs available for your institution</p>
                      <Button variant="outline" size="sm" onClick={handleViewAllPrograms}>
                        Check Programs Page
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
                {isTeamLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : teamsData && teamsData.length > 0 ? (
                  <>
                    {teamsData.slice(0, 2).map((team, index) => (
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
                            <Link href={`/program/${team.cohortInitiativeId}`}>
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
                {participationData?.participation?.length > 0 ? (
                  <>
                    {participationData.participation.flatMap(p => 
                      (p.cohort?.milestones || [])
                        .filter(m => 
                          !m.submissions?.some(s => 
                            s.teamId === (p.team?.id) && s.status === 'approved'
                          )
                        )
                        .map(m => ({
                          ...m,
                          initiative: p.cohort?.initiativeDetails?.name,
                          teamId: p.team?.id
                        }))
                    )
                    .slice(0, 3)
                    .map((milestone, idx) => (
                      <BlurFade key={idx} delay={0.45 + (idx * 0.05)} direction="up">
                        <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 rounded-md bg-primary/10 p-2 mt-1">
                            <Milestone className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">{milestone.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {milestone.initiative}
                            </p>
                            {milestone.dueDate && (
                              <div className="flex items-center mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                                <span className="text-xs text-muted-foreground">
                                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </BlurFade>
                    ))}

                    {participationData.participation.flatMap(p => 
                      (p.cohort?.milestones || [])
                        .filter(m => 
                          !m.submissions?.some(s => 
                            s.teamId === (p.team?.id) && s.status === 'approved'
                          )
                        )
                    ).length === 0 && (
                      <BlurFade delay={0.45} direction="up">
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">No upcoming milestones</p>
                        </div>
                      </BlurFade>
                    )}
                  </>
                ) : (
                  <BlurFade delay={0.45} direction="up">
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No active programs with milestones</p>
                    </div>
                  </BlurFade>
                )}
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
                {isLoadingApplications ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : applications && applications.filter(app => app.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {applications
                      .filter(app => app.status === 'pending')
                      .slice(0, 3)
                      .map((app, idx) => (
                        <BlurFade key={app.id} delay={0.65 + (idx * 0.05)} direction="up">
                          <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex-shrink-0 rounded-md bg-primary/10 p-2 mt-1">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-grow">
                              <h3 className="text-sm font-medium">{app.teamName || "Team Request"}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {app.cohortName || app.programName || "Program"}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="default" className="h-7 px-2 text-xs">
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </div>
                        </BlurFade>
                      ))}
                  </div>
                ) : (
                  <BlurFade delay={0.65} direction="up">
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No pending team requests</p>
                    </div>
                  </BlurFade>
                )}
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
                onClick={handleViewAllPrograms}
                className="h-8"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile?.cohorts?.slice(0, 2).map((cohort, idx) => (
                  <div 
                    key={cohort.id || idx}
                    className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
                      <Blocks className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-medium truncate text-sm">{cohort.initiativeDetails?.name || "Program"}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {cohort.name || "Current Cohort"}
                      </p>
                    </div>
                  </div>
                ))}
                {(!profile?.cohorts || profile.cohorts.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="mb-2">No programs available</p>
                    <Button variant="outline" size="sm" onClick={handleViewAllPrograms}>
                      Check Programs Page
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
              {isTeamLoading ? (
                <Skeleton className="h-16 w-full rounded-lg" />
              ) : teamsData && teamsData.length > 0 ? (
                <div className="space-y-3">
                  {teamsData.slice(0, 1).map((team) => (
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
                        <Link href={`/program/${team.cohortInitiativeId}`}>
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
      
      {/* Team Join Requests Section */}
      <BlurFade delay={0.7} direction="up">
        <TeamJoinRequests 
          applications={applications} 
          isLoading={isLoadingApplications}
          teams={teamsData?.reduce((acc, team) => {
            acc[team.id] = team;
            return acc;
          }, {})}
        />
      </BlurFade>
      
      {/* Modal is now handled by MainDashboardLayout */}
    </div>
  )
}

// Export the dynamic component that doesn't require context during build
export default function DashboardHome(props) {
  return <DashboardHomeContent {...props} />
}