"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import ProperDashboardLayout from "@/components/ProperDashboardLayout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function TeamDashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [team, setTeam] = useState(null)
  const [cohort, setCohort] = useState(null)
  const [milestones, setMilestones] = useState([])
  
  const router = useRouter()
  const { teamId } = router.query
  const { user, isLoading } = useUser()
  
  // Fetch user profile
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user || isLoading) return
      
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) throw new Error('Failed to fetch profile')
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError('Failed to load user profile')
      }
    }
    
    fetchUserProfile()
  }, [user, isLoading])
  
  // Fetch team and cohort data
  useEffect(() => {
    async function fetchTeamData() {
      if (!teamId || !user) return
      
      setLoading(true)
      try {
        // First get the team details
        const teamResponse = await fetch(`/api/teams/${teamId}`)
        if (!teamResponse.ok) throw new Error('Failed to fetch team data')
        
        const teamData = await teamResponse.json()
        setTeam(teamData)
        
        // Then fetch cohort information related to this team
        if (teamData && teamData.cohortIds && teamData.cohortIds.length > 0) {
          const cohortResponse = await fetch(`/api/teams/${teamId}/cohorts`)
          if (cohortResponse.ok) {
            const cohortData = await cohortResponse.json()
            if (cohortData && cohortData.cohorts && cohortData.cohorts.length > 0) {
              setCohort(cohortData.cohorts[0]) // For now, focus on the first cohort
              
              // Get milestones for this cohort if available
              if (cohortData.cohorts[0].id) {
                // This endpoint doesn't exist yet, but we'll create it
                const milestonesResponse = await fetch(`/api/cohorts/${cohortData.cohorts[0].id}/milestones`)
                if (milestonesResponse.ok) {
                  const milestonesData = await milestonesResponse.json()
                  setMilestones(milestonesData.milestones || [])
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching team data:', err)
        setError('Failed to load team information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTeamData()
  }, [teamId, user])
  
  // Handle profile edit
  const handleEditProfileClick = () => {
    router.push('/profile')
  }
  
  // Placeholder milestones data until we have the real API endpoint
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
  
  if (loading || isLoading) {
    return (
      <ProperDashboardLayout title="Team Dashboard" profile={profile} onEditClick={handleEditProfileClick}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-xl font-medium">Loading team information...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your team data</p>
          </div>
        </div>
      </ProperDashboardLayout>
    )
  }
  
  if (error) {
    return (
      <ProperDashboardLayout title="Team Dashboard" profile={profile} onEditClick={handleEditProfileClick}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
              <h3 className="text-lg font-medium">Error Loading Team</h3>
              <p>{error}</p>
            </div>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </div>
        </div>
      </ProperDashboardLayout>
    )
  }
  
  if (!team) {
    return (
      <ProperDashboardLayout title="Team Dashboard" profile={profile} onEditClick={handleEditProfileClick}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="bg-amber-100 text-amber-800 p-4 rounded-md mb-4">
              <h3 className="text-lg font-medium">Team Not Found</h3>
              <p>We couldn't find the team you're looking for.</p>
            </div>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </div>
        </div>
      </ProperDashboardLayout>
    )
  }
  
  return (
    <ProperDashboardLayout title={`${team.name} - Team Dashboard`} profile={profile} onEditClick={handleEditProfileClick}>
      {/* Team Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={team.image} alt={team.name} />
              <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
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
        
        {/* Program/Cohort Banner */}
        {cohort && (
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <Badge variant="outline" className="mb-2 bg-blue-100 text-blue-800 border-blue-200">
                    {cohort.initiativeDetails?.name || "Program"}
                  </Badge>
                  <h2 className="text-xl font-semibold mb-1">
                    {cohort.topicNames?.[0] || "Active Program"} 
                    {cohort.Short_Name && ` - ${cohort.Short_Name}`}
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
        )}
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
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
                  <CardDescription>Track your team's progress on active milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamMilestoneProgress milestones={milestones.length > 0 ? milestones : placeholderMilestones} />
                </CardContent>
              </Card>

              {/* Team Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest updates and achievements from your team</CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamActivityFeed team={team} />
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="md:col-span-2 space-y-4">
              {/* Team Points */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Team Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamPointsSummary team={team} />
                </CardContent>
              </Card>
              
              {/* Team Members */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Team Members</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => document.querySelector('[data-value="members"]').click()}>
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
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Program Milestones</CardTitle>
              <CardDescription>Track your team's progress through program milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMilestoneProgress milestones={milestones.length > 0 ? milestones : placeholderMilestones} detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>All members of {team.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMemberList team={team} detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
              <CardDescription>Recent activities, achievements, and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamActivityFeed team={team} detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ProperDashboardLayout>
  )
}