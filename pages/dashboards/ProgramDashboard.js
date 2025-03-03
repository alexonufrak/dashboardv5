"use client"

import { useState, useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, Award, BarChart3, Flag, ChevronRight, Loader2, CheckCircle, Clock, Circle, AlertCircle, Edit } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import TeamInviteDialog from "@/components/TeamInviteDialog"
import TeamEditDialog from "@/components/TeamEditDialog"
import TeamMilestoneProgress from "@/components/TeamMilestoneProgress"
import TeamPointsSummary from "@/components/TeamPointsSummary"
import TeamMemberList from "@/components/TeamMemberList"
import TeamActivityFeed from "@/components/TeamActivityFeed"
import MilestoneSummaryCard from "@/components/MilestoneSummaryCard"
import SubmissionSummaryCard from "@/components/SubmissionSummaryCard"

// Use dynamic import with SSR disabled to prevent context errors during build
const ProgramDashboardContent = dynamic(() => Promise.resolve(ProgramDashboardInner), { 
  ssr: false 
})

// Inner component that uses dashboard context
function ProgramDashboardInner({ onNavigate }) {
  // Get query client for cache access
  const queryClient = useQueryClient();
  
  // Add state for dialog control
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Local state for team data to allow immediate UI updates
  const [localTeamData, setLocalTeamData] = useState(null);
  
  // Get data from dashboard context
  const { 
    profile, 
    teamData, 
    cohort, 
    milestones, 
    initiativeName, 
    participationType, 
    programLoading, 
    programError,
    refreshData 
  } = useDashboard()
  
  // Update local team data when context teamData changes
  useEffect(() => {
    if (teamData) {
      setLocalTeamData(teamData);
    }
  }, [teamData]);
  
  // Only show loading indicator if this is first load, not navigation
  if (programLoading && !cohort && !teamData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-xl font-medium">Loading program information...</h3>
          <p className="text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }
  
  // Handle error case, but specifically handle "not participating" errors differently
  if (programError) {
    // Check if this is a "not participating" error
    const isNotParticipatingError = programError.includes("not currently participating") ||
                                   programError.includes("No active program");
    
    if (isNotParticipatingError) {
      // Just show the "no active program" UI instead of an error
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="bg-amber-100 text-amber-800 p-4 rounded-md mb-4">
              <h3 className="text-lg font-medium">No Active Program</h3>
              <p>You are not currently participating in any program.</p>
            </div>
            
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-4">
              <h4 className="font-medium mb-2">Looking for Programs?</h4>
              <p className="mb-3">Check out available programs on the dashboard page.</p>
              <Button onClick={() => onNavigate('dashboard')}>
                Browse Programs
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // For other errors, show the regular error UI
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium">Error Loading Program</h3>
            <p>{programError}</p>
          </div>
          <Button onClick={() => refreshData('program')}>Retry</Button>
          <Button variant="outline" className="ml-2" onClick={() => onNavigate('dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  
  // Handle case where we don't have cohort or team data
  if (!cohort && !teamData) {
    console.log("No cohort or team data available, showing placeholder screen");
    return (
      <div className="program-dashboard space-y-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-xl mx-auto">
            <div className="bg-amber-100 text-amber-800 p-4 rounded-md mb-4">
              <h3 className="text-lg font-medium">No Active Program</h3>
              <p>You are not currently participating in any program.</p>
            </div>
            
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-4">
              <h4 className="font-medium mb-2">Looking for Programs?</h4>
              <p className="mb-3">Check out available programs on the dashboard page.</p>
              <Button onClick={() => onNavigate('dashboard')}>
                Browse Programs
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Handle if this is a team-based or individual program
  const isTeamProgram = participationType === "Team" || teamData !== null
  
  // Add debugging to inspect team data structure
  console.log("Original Team Data:", teamData);
  console.log("Local Team Data:", localTeamData);
  
  // Use local team data if available, otherwise fall back to context team data
  const baseTeamData = localTeamData || teamData;
  
  // Clean team data to ensure proper structure
  const team = baseTeamData ? {
    ...baseTeamData,
    // Ensure members is an array
    members: Array.isArray(baseTeamData.members) ? baseTeamData.members : [],
    // Clean points - convert to number and remove any trailing characters
    points: baseTeamData.points ? parseInt(String(baseTeamData.points).replace(/[^0-9]/g, ''), 10) || 0 : 0
  } : null
  
  console.log("Cleaned Team Data:", team);
  
  // Placeholder milestones data if we don't have real data
  const placeholderMilestones = [
    {
      id: "m1",
      name: "Problem Definition",
      status: "completed",
      dueDate: "2025-03-20",
      completedDate: "2025-03-15",
      score: 92
    },
    {
      id: "m2",
      name: "Ideation Process",
      status: "completed",
      dueDate: "2025-04-10",
      completedDate: "2025-04-08",
      score: 88
    },
    {
      id: "m3",
      name: "Prototype Development",
      status: "upcoming",
      dueDate: "2025-04-25"
    },
    {
      id: "m4",
      name: "User Testing",
      status: "upcoming",
      dueDate: "2025-05-15"
    },
    {
      id: "m5",
      name: "Final Presentation",
      status: "upcoming",
      dueDate: "2025-06-07"
    }
  ]
  
  return (
    <div className="program-dashboard space-y-6">
      {/* Program Header */}
      <div className="mb-6">
        {/* Program Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {cohort?.initiativeDetails?.name || initiativeName}
                  </Badge>
                  
                  {(cohort?.['Current Cohort'] === true || 
                   cohort?.['Current Cohort'] === 'true' || 
                   cohort?.['Is Current'] === true ||
                   cohort?.['Is Current'] === 'true') && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      Active Cohort
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-1">
                  {cohort?.topicNames?.[0] || "Active Program"} 
                  {cohort?.Short_Name && ` - ${cohort.Short_Name}`}
                </h2>
                <div className="text-sm text-muted-foreground flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  {cohort?.['Start Date'] && cohort?.['End Date'] ? (
                    <span>
                      {new Date(cohort['Start Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                      {' - '}
                      {new Date(cohort['End Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                    </span>
                  ) : cohort?.['Start_Date'] && cohort?.['End_Date'] ? (
                    <span>
                      {new Date(cohort['Start_Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                      {' - '}
                      {new Date(cohort['End_Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                    </span>
                  ) : (
                    <span>Active Program • {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3 md:mt-0">
                {/* Dynamic completion percentage based on actual milestones */}
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  {(() => {
                    // Calculate progress using the same function as TeamMilestoneProgress
                    const milestonesData = milestones.length > 0 ? milestones : placeholderMilestones;
                    const completedCount = milestonesData.filter(m => m.status === "completed").length;
                    const progressPercentage = milestonesData.length > 0 
                      ? Math.round((completedCount) / milestonesData.length * 100) 
                      : 0;
                    return `${progressPercentage}% Complete`;
                  })()}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  {(() => {
                    const milestonesData = milestones.length > 0 ? milestones : placeholderMilestones;
                    const completedCount = milestonesData.filter(m => m.status === "completed").length;
                    return `${completedCount} of ${milestonesData.length} Milestones`;
                  })()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Team Info (if team-based program) */}
        {isTeamProgram && team && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={team.image} alt={team.name} />
                <AvatarFallback>{team.name?.substring(0, 2).toUpperCase() || "TM"}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{team.name || "Your Team"}</h1>
                
                {/* Team Description */}
                {team.description && (
                  <p className="text-sm text-muted-foreground mt-1 mb-2 line-clamp-2">
                    {team.description}
                  </p>
                )}
                
                {/* Team stats */}
                <div className="flex items-center text-muted-foreground">
                  {/* Member count with very basic output - zero JS operations */}
                  <Users className="h-4 w-4 mr-1" />
                  <span data-testid="member-count">
                    {team.members?.length} member{team.members?.length !== 1 ? 's' : ''}
                  </span>
                  
                  {team.points > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <Award className="h-4 w-4 mr-1" />
                      <span data-testid="team-points">
                        {team.points} point{team.points !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsInviteDialogOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
              <Button 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          {isTeamProgram && <TabsTrigger value="members">Team Members</TabsTrigger>}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {/* Main Overview Content */}
            <div className="md:col-span-5 space-y-4">
              {/* Milestone Summary Card */}
              <MilestoneSummaryCard 
                milestones={milestones.length > 0 ? milestones : placeholderMilestones}
                onViewMilestones={() => {
                  // Find the milestones tab element and click it programmatically
                  const milestonesTab = document.querySelector('[value="milestones"]')
                  if (milestonesTab) milestonesTab.click()
                }}
              />

              {/* Submission Summary Card with enhanced submission data */}
              <SubmissionSummaryCard 
                milestones={milestones.length > 0 ? milestones : placeholderMilestones}
                submissions={[]}
              />
            </div>
            
            {/* Sidebar */}
            <div className="md:col-span-2 space-y-4">
              {/* Points */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Points</CardTitle>
                </CardHeader>
                <CardContent>
                  {isTeamProgram ? (
                    <TeamPointsSummary team={team} />
                  ) : (
                    <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-800">125</div>
                      <div className="text-sm text-blue-600">Your Total Points</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Team Members (if team-based) */}
              {isTeamProgram && team && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Team Members</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          // Find the members tab element and click it programmatically
                          const membersTab = document.querySelector('[value="members"]')
                          if (membersTab) membersTab.click()
                        }}
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[250px]">
                      <TeamMemberList team={team} truncated={true} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="milestones">
          <div className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Program Milestones</h2>
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const milestonesData = milestones.length > 0 ? milestones : placeholderMilestones;
                        const completedCount = milestonesData.filter(m => m.status === "completed").length;
                        const lateCount = milestonesData.filter(m => m.status === "late").length;
                        const upcomingCount = milestonesData.filter(m => m.status !== "completed" && m.status !== "late").length;
                        
                        return (
                          <>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span><strong>{completedCount}</strong> Completed</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Circle className="h-4 w-4 text-gray-400" />
                                <span><strong>{upcomingCount}</strong> Upcoming</span>
                              </span>
                              {lateCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <span><strong>{lateCount}</strong> Late</span>
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Overall Progress:</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                        {(() => {
                          const milestonesData = milestones.length > 0 ? milestones : placeholderMilestones;
                          const completedCount = milestonesData.filter(m => m.status === "completed").length;
                          return `${Math.round((completedCount) / milestonesData.length * 100)}%`;
                        })()}
                      </Badge>
                    </div>
                    <Progress value={(() => {
                      const milestonesData = milestones.length > 0 ? milestones : placeholderMilestones;
                      const completedCount = milestonesData.filter(m => m.status === "completed").length;
                      return milestonesData.length > 0 
                        ? Math.round((completedCount) / milestonesData.length * 100) 
                        : 0;
                    })()} className="h-2 w-[200px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Detailed Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Milestone Details</CardTitle>
                <CardDescription>Complete timeline of program milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamMilestoneProgress 
                  milestones={milestones.length > 0 ? milestones : placeholderMilestones} 
                  detailed={true}
                  programName="Program Milestones"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {isTeamProgram && (
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>All members of {team?.name || "your team"}</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamMemberList team={team} detailed={true} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Program Activity</CardTitle>
              <CardDescription>Recent activities, achievements, and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamActivityFeed team={team} detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Team dialogs */}
      {isTeamProgram && team && (
        <>
          {/* Invite Dialog */}
          <TeamInviteDialog 
            open={isInviteDialogOpen} 
            onClose={() => setIsInviteDialogOpen(false)}
            team={team}
            onTeamUpdated={(updatedTeam) => {
              // Update the local team state with the updated team data immediately
              // This makes the UI respond instantly without waiting for a full refresh
              console.log("Team updated from invite dialog:", updatedTeam);
              
              // Update local state to reflect changes immediately
              setLocalTeamData(updatedTeam);
              
              // Refresh team data from server (happens in background)
              refreshData('teams');
            }}
          />
          
          {/* Edit Team Dialog */}
          <TeamEditDialog
            open={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            team={team}
            onTeamUpdated={(updatedTeam) => {
              // Immediately update local team data for instant UI feedback
              console.log("Team updated from edit dialog:", updatedTeam);
              
              // Update local state to reflect changes immediately
              setLocalTeamData(updatedTeam);
              
              // Refresh team data from server (happens in background) 
              refreshData('teams');
            }}
          />
        </>
      )}
    </div>
  )
}

// Export the dynamic component that doesn't require context during build
export default function ProgramDashboard(props) {
  return <ProgramDashboardContent {...props} />
}