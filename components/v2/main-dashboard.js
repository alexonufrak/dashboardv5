"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Briefcase, 
  BookOpen, 
  Clock, 
  Bell,
  Rocket,
  Award,
  Users,
  Lightbulb
} from "lucide-react";
import { ProgramCard } from "./ProgramCard";
import { ProgramShowcase } from "./ProgramShowcase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

/**
 * Main Dashboard Component
 * Central hub showing user's active programs, teams, and upcoming deliverables
 */
export function MainDashboard({ userProfile }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data for dashboard
  const mockData = {
    totalPoints: 330,
    programs: [
      {
        id: "xp-dt",
        type: "xperience",
        name: "Design Thinking",
        term: "Fall 2023",
        status: {
          state: "active",
          progressType: "milestone",
          current: 3,
          total: 5
        },
        team: {
          name: "Innovation Squad",
          id: "team123",
          members: 5,
          ranking: 3,
          totalTeams: 12
        },
        points: {
          personal: 120,
          team: 770
        },
        icon: <Briefcase className="h-4 w-4" />,
        color: "text-blue-500",
        nextDeadline: {
          name: "User Testing Report",
          dueDate: "2023-11-16",
          daysRemaining: 5
        }
      },
      {
        id: "xpm-dt",
        type: "xperiment",
        name: "Design Thinking 101",
        term: "Fall 2023",
        status: {
          state: "active",
          progressType: "week",
          current: 9,
          total: 15
        },
        team: {
          name: "Innovation Squad",
          id: "team123"
        },
        points: {
          personal: 125
        },
        icon: <BookOpen className="h-4 w-4" />,
        color: "text-green-500",
        nextDeadline: {
          name: "Reading Response 9",
          dueDate: "2023-11-14",
          daysRemaining: 3
        }
      },
      {
        id: "xpr-club",
        type: "xtrapreneurs",
        name: "Club Membership",
        term: "Fall 2023",
        status: {
          state: "active"
        },
        team: {
          name: "EcoInnovators",
          id: "team456",
          members: 3
        },
        points: {
          personal: 85
        },
        icon: <Lightbulb className="h-4 w-4" />,
        color: "text-amber-500",
        nextDeadline: {
          name: "Entrepreneurship Workshop",
          dueDate: "2023-11-18",
          daysRemaining: 7,
          type: "event"
        }
      }
    ],
    teams: [
      {
        id: "team123",
        name: "Innovation Squad",
        programType: "xperience",
        program: "Design Thinking",
        members: [
          { id: "user1", name: "Sarah Johnson", isCurrentUser: true, points: 120 },
          { id: "user2", name: "Michael Chen", points: 95 },
          { id: "user3", name: "Priya Patel", points: 105 },
          { id: "user4", name: "James Wilson", points: 85 },
          { id: "user5", name: "Emma Rodriguez", points: 90 }
        ],
        stats: {
          totalPoints: 770,
          ranking: 3,
          totalTeams: 12
        }
      },
      {
        id: "team456",
        name: "EcoInnovators",
        programType: "xtrapreneurs",
        program: "Campus Sustainability Challenge",
        members: [
          { id: "user1", name: "Sarah Johnson", isCurrentUser: true },
          { id: "user6", name: "Alex Thompson" },
          { id: "user7", name: "Jamie Lee" }
        ],
        dueDate: "2023-12-05"
      }
    ],
    deliverables: [
      {
        id: "del1",
        name: "Reading Response 9",
        program: "Design Thinking 101",
        programType: "xperiment",
        dueDate: "2023-11-14",
        daysRemaining: 3,
        status: "upcoming"
      },
      {
        id: "del2",
        name: "User Testing Report",
        program: "Design Thinking",
        programType: "xperience",
        dueDate: "2023-11-16",
        daysRemaining: 5,
        status: "in_progress",
        progress: 40,
        team: "Innovation Squad"
      },
      {
        id: "del3",
        name: "Entrepreneurship Workshop",
        program: "Club Membership",
        programType: "xtrapreneurs",
        dueDate: "2023-11-18",
        daysRemaining: 7,
        status: "rsvp_pending",
        type: "event"
      }
    ],
    opportunities: [
      {
        id: "opp1",
        type: "xperience",
        name: "Product Development",
        term: "Spring 2024",
        applicationOpen: "2023-12-01",
        compatible: true
      },
      {
        id: "opp2",
        type: "horizons",
        name: "AI for Good",
        term: "Winter 2023",
        applicationOpen: "Now",
        compatible: true
      }
    ]
  };

  // Helper function to render program status
  const renderProgramStatus = (program) => {
    if (program.status.progressType === "milestone") {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Milestone {program.status.current} of {program.status.total}</span>
            <span>{Math.round((program.status.current / program.status.total) * 100)}%</span>
          </div>
          <Progress value={(program.status.current / program.status.total) * 100} className="h-1.5" />
        </div>
      );
    } 
    
    if (program.status.progressType === "week") {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>Week {program.status.current} of {program.status.total}</span>
            <span>{Math.round((program.status.current / program.status.total) * 100)}%</span>
          </div>
          <Progress value={(program.status.current / program.status.total) * 100} className="h-1.5" />
        </div>
      );
    }
    
    return (
      <Badge variant="outline">Active</Badge>
    );
  };

  // Helper function to render program type badge
  const getProgramBadge = (type) => {
    const badges = {
      xperience: { label: "Xperience", variant: "default", className: "bg-blue-500" },
      xperiment: { label: "Xperiment", variant: "default", className: "bg-green-500" },
      xtrapreneurs: { label: "Xtrapreneurs", variant: "default", className: "bg-amber-500" },
      horizons: { label: "Horizons", variant: "default", className: "bg-purple-500" }
    };
    
    const badge = badges[type] || { label: type, variant: "outline" };
    
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  // Helper function to render deliverable status
  const getDeliverableStatus = (deliverable) => {
    if (deliverable.type === "event") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Event
        </Badge>
      );
    }
    
    const statusMap = {
      not_started: <Badge variant="outline">Upcoming</Badge>,
      upcoming: <Badge variant="outline">Upcoming</Badge>,
      in_progress: <Badge variant="secondary">In Progress</Badge>,
      completed: <Badge variant="success">Completed</Badge>,
      rsvp_pending: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">RSVP Pending</Badge>
    };
    
    return statusMap[deliverable.status] || <Badge variant="outline">Unknown</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {userProfile?.firstName || "Student"}!
        </h1>
        <p className="text-muted-foreground">
          You have {mockData.deliverables.length} upcoming deadlines and {mockData.totalPoints} total points.
        </p>
      </div>

      {/* Dashboard Tabs */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{mockData.totalPoints}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/points">View Breakdown</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{mockData.programs.length}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/programs">View Programs</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{mockData.teams.length}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/teams">View Teams</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{mockData.deliverables[0].daysRemaining} days</div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {mockData.deliverables[0].name}
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/deliverables">View All</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Active Programs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Active Programs</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard-v2/programs">
                  View All Programs <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockData.programs.map((program) => (
                <ProgramCard 
                  key={program.id}
                  {...program}
                  actions={["viewDetails"]}
                />
              ))}
            </div>
          </div>
          
          {/* Upcoming Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Upcoming Deliverables</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/deliverables">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mockData.deliverables.map((deliverable) => (
                    <div 
                      key={deliverable.id} 
                      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{deliverable.name}</h3>
                          {getDeliverableStatus(deliverable)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {deliverable.program} ({getProgramBadge(deliverable.programType)})
                          {deliverable.team && ` • Team: ${deliverable.team}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end text-sm">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{deliverable.daysRemaining} days remaining</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Due: {deliverable.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Program Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Program Opportunities</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/opportunities">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {mockData.opportunities.map((opportunity) => (
                <ProgramCard 
                  key={opportunity.id}
                  {...opportunity}
                  actions={["viewDetails", "apply"]}
                />
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockData.programs.map((program) => (
              <ProgramCard 
                key={program.id}
                {...program}
                actions={["viewTeam", "viewDetails"]}
              />
            ))}
            
            {/* Add More Programs Card */}
            <Card className="border-dashed h-full min-h-[232px] flex flex-col justify-center items-center text-center p-6">
              <Rocket className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Explore Programs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Discover new programs and opportunities to earn points and build your skills.
              </p>
              <Button asChild>
                <Link href="/dashboard/opportunities">Browse Programs</Link>
              </Button>
            </Card>
          </div>
        </TabsContent>
        
        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <div className="grid gap-6">
            {mockData.teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {team.name}
                    </CardTitle>
                    <CardDescription>
                      {team.program} ({getProgramBadge(team.programType)})
                    </CardDescription>
                  </div>
                  {team.stats?.ranking && (
                    <Badge variant="secondary" className="text-sm">
                      Rank #{team.stats.ranking} of {team.stats.totalTeams}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    {team.stats && (
                      <div className="text-sm">
                        <span className="font-medium">Team Points: </span>
                        <span>{team.stats.totalPoints}</span>
                      </div>
                    )}
                    
                    {team.dueDate && (
                      <div className="text-sm">
                        <span className="font-medium">Submission Due: </span>
                        <span>{team.dueDate}</span>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Team Members</h4>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((member) => (
                          <div 
                            key={member.id} 
                            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                              member.isCurrentUser 
                                ? "bg-primary/10 text-primary" 
                                : "bg-accent text-accent-foreground"
                            }`}
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {member.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.name}</span>
                            {member.points && (
                              <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                                {member.points} pts
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/teams/${team.id}/chat`}>
                      Team Chat
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/teams/${team.id}`}>
                      Team Dashboard
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {/* Create New Team Card */}
            <Card className="border-dashed flex flex-col justify-center items-center text-center p-6">
              <Users className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Create a New Team</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Form a new team for an upcoming program or challenge.
              </p>
              <Button asChild>
                <Link href="/dashboard/teams/create">Create Team</Link>
              </Button>
            </Card>
          </div>
        </TabsContent>
        
        {/* Deliverables Tab */}
        <TabsContent value="deliverables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deliverables</CardTitle>
              <CardDescription>Track your deadlines across all programs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {mockData.deliverables.map((deliverable) => (
                  <div 
                    key={deliverable.id} 
                    className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{deliverable.name}</h3>
                        {getDeliverableStatus(deliverable)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {deliverable.program} ({getProgramBadge(deliverable.programType)})
                        {deliverable.team && ` • Team: ${deliverable.team}`}
                      </p>
                      
                      {deliverable.progress !== undefined && (
                        <div className="w-48 space-y-1 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>{deliverable.progress}%</span>
                          </div>
                          <Progress value={deliverable.progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-sm">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{deliverable.daysRemaining} days remaining</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Due: {deliverable.dueDate}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="mt-1"
                      >
                        <Link 
                          href={deliverable.type === "event" 
                            ? `/dashboard/events/${deliverable.id}` 
                            : `/dashboard/deliverables/${deliverable.id}`
                          }
                        >
                          {deliverable.type === "event" ? "View Event" : "View Details"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Points Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Points Summary</CardTitle>
              <CardDescription>Your points across all programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Xperience: Design Thinking</div>
                      <div className="text-sm text-muted-foreground">Team: Innovation Squad</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">120</div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Xperiment: Design Thinking 101</div>
                      <div className="text-sm text-muted-foreground">Team: Innovation Squad</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">125</div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-medium">Xtrapreneurs: Club Membership</div>
                      <div className="text-sm text-muted-foreground">Individual points</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">85</div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center bg-accent/50 p-2 rounded-md">
                  <div className="font-medium">Total Points</div>
                  <div className="text-xl font-bold">{mockData.totalPoints}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/points">
                  View Detailed Breakdown
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}