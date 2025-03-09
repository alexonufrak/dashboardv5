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
import TeamInviteDialog from "@/components/teams/TeamInviteDialog"
import TeamEditDialog from "@/components/teams/TeamEditDialog"
import TeamMilestoneProgress from "@/components/teams/TeamMilestoneProgress"
import TeamPointsSummary from "@/components/teams/TeamPointsSummary"
import TeamMemberList from "@/components/teams/TeamMemberList"
import TeamActivityFeed from "@/components/teams/TeamActivityFeed"
import MilestoneSummaryCard from "@/components/milestones/MilestoneSummaryCard"
import SubmissionSummaryCard from "@/components/submissions/SubmissionSummaryCard"

// Use dynamic import with SSR disabled to prevent context errors during build
const ProgramDashboardContent = dynamic(() => Promise.resolve(ProgramDashboardInner), { 
  ssr: false 
})

// Inner component that uses dashboard context
function ProgramDashboardInner({ onNavigate, programId }) {
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
    teamsData,
    cohort, 
    milestones, 
    initiativeName, 
    participationType, 
    programLoading, 
    programError,
    refreshData,
    activeProgramId,
    getActiveProgramData
  } = useDashboard()
  
  // Use the programId prop if provided, otherwise use the context's activeProgramId
  const currentProgramId = programId || activeProgramId;
  
  // Get the active program data
  const activeProgramData = getActiveProgramData(currentProgramId)
  
  // Use the program-specific data if available
  const programCohort = activeProgramData?.cohort || cohort
  const programInitiativeName = activeProgramData?.initiativeName || initiativeName
  const programParticipationType = activeProgramData?.participationType || participationType
  
  // Get team data for this specific program
  const programTeamId = activeProgramData?.teamId
  const programTeamData = programTeamId ? 
    teamsData.find(t => t.id === programTeamId) || teamData : 
    teamData
  
  // Update local team data when program-specific team data changes
  useEffect(() => {
    if (programTeamData) {
      setLocalTeamData(programTeamData);
    }
  }, [programTeamData, activeProgramId]);
  
  // Don't show a loading indicator at this level - we'll let the parent DashboardShell handle it
  // This prevents duplicate loading states and allows for a single consistent loader
  // We use !programCohort && !programTeamData to check if data is loaded, but don't return a loading UI
  
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
  
  // Handle case where we don't have cohort or team data for the selected program
  if (!programCohort && !programTeamData) {
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
  const isTeamProgram = activeProgramData?.isTeamBased || 
                       programParticipationType === "Team" || 
                       programTeamData !== null
  
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
  
  // No placeholder milestones - use real data only
  
  return (
    <div className="program-dashboard space-y-6 w-full overflow-x-hidden">
      {/* Program Header */}
      <div className="mb-6">
        {/* Program Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 mb-4 w-full">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {programCohort?.initiativeDetails?.name || programInitiativeName}
                  </Badge>
                  
                  {(programCohort?.['Current Cohort'] === true || 
                   programCohort?.['Current Cohort'] === 'true' || 
                   programCohort?.['Is Current'] === true ||
                   programCohort?.['Is Current'] === 'true') && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      Active Cohort
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-1">
                  {programCohort?.topicNames?.[0] || "Active Program"} 
                  {programCohort?.Short_Name && ` - ${programCohort.Short_Name}`}
                </h2>
                <div className="text-sm text-muted-foreground flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  {programCohort?.['Start Date'] && programCohort?.['End Date'] ? (
                    <span>
                      {new Date(programCohort['Start Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                      {' - '}
                      {new Date(programCohort['End Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                    </span>
                  ) : programCohort?.['Start_Date'] && programCohort?.['End_Date'] ? (
                    <span>
                      {new Date(programCohort['Start_Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                      {' - '}
                      {new Date(programCohort['End_Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
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
                    const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
                    const totalCount = milestones?.length || 0;
                    const progressPercentage = totalCount > 0 
                      ? Math.round((completedCount) / totalCount * 100) 
                      : 0;
                    return `${progressPercentage}% Complete`;
                  })()}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  {(() => {
                    const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
                    const totalCount = milestones?.length || 0;
                    return `${completedCount} of ${totalCount} Milestones`;
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
      <Tabs defaultValue="overview" className="space-y-4 w-full">
        <TabsList className="w-full md:w-auto">
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
                milestones={milestones || []}
                onViewMilestones={() => {
                  // Find the milestones tab element and click it programmatically
                  const milestonesTab = document.querySelector('[value="milestones"]')
                  if (milestonesTab) milestonesTab.click()
                }}
              />

              {/* Submission Summary Card with enhanced submission data */}
              <SubmissionSummaryCard 
                milestones={milestones || []}
                submissions={(() => {
                  // Skip lengthy processing if team data isn't available
                  if (!teamData?.id) return [];
                  
                  // Start with an empty array for submissions
                  let submissions = [];
                  
                  // APPROACH 1: Get submissions directly from team data (per Airtable schema)
                  if (teamData.fields?.Submissions && Array.isArray(teamData.fields.Submissions)) {
                    console.log(`Team has ${teamData.fields.Submissions.length} submission IDs in Airtable`);
                    
                    // Convert raw submission IDs to properly formatted submission objects
                    submissions = teamData.fields.Submissions
                      .filter(Boolean)
                      .map(submissionId => ({
                        id: submissionId,
                        teamId: teamData.id,
                        createdTime: new Date().toISOString()
                      }));
                  }
                  
                  // APPROACH 2: Get submissions from team members
                  if (submissions.length === 0 && teamData.members && Array.isArray(teamData.members)) {
                    // Collect member submission IDs
                    const memberSubmissions = [];
                    
                    teamData.members.forEach(member => {
                      if (member.submissions && Array.isArray(member.submissions)) {
                        member.submissions.forEach(submissionId => {
                          if (!memberSubmissions.includes(submissionId)) {
                            memberSubmissions.push(submissionId);
                          }
                        });
                      }
                    });
                    
                    if (memberSubmissions.length > 0) {
                      submissions = memberSubmissions.map(submissionId => ({
                        id: submissionId,
                        teamId: teamData.id,
                        createdTime: new Date().toISOString()
                      }));
                    }
                  }
                  
                  console.log(`Providing ${submissions.length} submissions to SubmissionSummaryCard`);
                  return submissions;
                })()}
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
                    <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-xl text-muted-foreground font-medium">Individual Points</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Not enabled for this program
                      </div>
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
                        // Use MilestoneSubmissionChecker's logic for more accurate status
                        // Count milestones that are actually completed based on submission data
                        const completedCount = milestones?.filter(m => 
                          m.status === "completed" || m.hasSubmission
                        ).length || 0;
                        
                        // Check if milestones are late based on due date
                        const lateCount = milestones?.filter(m => {
                          // If already marked as late or has a past due date without submission
                          if (m.status === "late") return true;
                          if (m.status === "completed" || m.hasSubmission) return false;
                          
                          // Check if past due date
                          if (m.dueDate) {
                            try {
                              const dueDate = new Date(m.dueDate);
                              const now = new Date();
                              return dueDate < now;
                            } catch (e) {
                              console.warn(`Invalid due date for milestone: ${m.dueDate}`);
                              return false;
                            }
                          }
                          return false;
                        }).length || 0;
                        
                        // Anything not completed or late is upcoming
                        const upcomingCount = milestones?.length - completedCount - lateCount || 0;
                        
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
                          // Calculate percentage based on completed milestones with submissions
                          const completedCount = milestones?.filter(m => 
                            m.status === "completed" || m.hasSubmission
                          ).length || 0;
                          const totalCount = milestones?.length || 0;
                          return totalCount > 0 ? `${Math.round((completedCount) / totalCount * 100)}%` : '0%';
                        })()}
                      </Badge>
                    </div>
                    <Progress 
                      value={(() => {
                        // Ensure progress matches the badge percentage
                        const completedCount = milestones?.filter(m => 
                          m.status === "completed" || m.hasSubmission
                        ).length || 0;
                        const totalCount = milestones?.length || 0;
                        return totalCount > 0 ? Math.round((completedCount) / totalCount * 100) : 0;
                      })()} 
                      className="h-2 w-[200px]" 
                    />
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
                  milestones={milestones || []} 
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