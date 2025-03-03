"use client"

import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Use dynamic import with SSR disabled to prevent context errors during build
const ProgramDashboardContent = dynamic(() => Promise.resolve(ProgramDashboardInner), { 
  ssr: false 
})
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Users, Award, BarChart3, Flag, ChevronRight, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import TeamMilestoneProgress from "@/components/TeamMilestoneProgress"
import TeamPointsSummary from "@/components/TeamPointsSummary"
import TeamMemberList from "@/components/TeamMemberList"
import TeamActivityFeed from "@/components/TeamActivityFeed"

// Inner component that uses dashboard context
function ProgramDashboardInner({ onNavigate }) {
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
  
  // Check if still loading
  if (programLoading) {
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
  const team = teamData
  
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
      status: "in_progress",
      dueDate: "2025-04-25",
      progress: 65
    },
    {
      id: "m4",
      name: "User Testing",
      status: "not_started",
      dueDate: "2025-05-15"
    },
    {
      id: "m5",
      name: "Final Presentation",
      status: "not_started",
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
                <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-800 border-blue-200">
                  {cohort?.initiativeDetails?.name || initiativeName}
                </Badge>
                <h2 className="text-xl font-semibold mb-1">
                  {cohort?.topicNames?.[0] || "Active Program"} 
                  {cohort?.Short_Name && ` - ${cohort.Short_Name}`}
                </h2>
                <div className="text-sm text-muted-foreground flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  <span>Active Program • {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 md:mt-0">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  60% Complete
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  <Flag className="h-3.5 w-3.5 mr-1" />
                  3 of 5 Milestones
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
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{team.members?.length || 0} members</span>
                  {team.points && (
                    <>
                      <span className="mx-2">•</span>
                      <Award className="h-4 w-4 mr-1" />
                      <span>{team.points} points</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
              <Button size="sm">
                <ChevronRight className="h-4 w-4 mr-2" />
                Manage Team
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
              {/* Current Milestone */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current Milestone Progress</CardTitle>
                  <CardDescription>Track your progress on active milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamMilestoneProgress milestones={milestones.length > 0 ? milestones : placeholderMilestones} />
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest updates and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamActivityFeed team={team} />
                </CardContent>
              </Card>
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
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
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
          <Card>
            <CardHeader>
              <CardTitle>Program Milestones</CardTitle>
              <CardDescription>Track your progress through program milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMilestoneProgress milestones={milestones.length > 0 ? milestones : placeholderMilestones} detailed={true} />
            </CardContent>
          </Card>
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
    </div>
  )
}

// Export the dynamic component that doesn't require context during build
export default function ProgramDashboard(props) {
  return <ProgramDashboardContent {...props} />
}