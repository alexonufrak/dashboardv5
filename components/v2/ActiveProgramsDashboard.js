"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase, 
  BookOpen,
  Clock, 
  Users, 
  Lightbulb,
  Rocket,
  ArrowUpRight,
  Award,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { ProgramCard } from "./ProgramCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "../ui/collapsible";

/**
 * Active Programs Dashboard Component
 * Shows the user's single active program (or Xperience+Xperiment combo)
 * Includes program progress, team responsibilities, and upcoming deliverables
 * Note: Users can only be enrolled in one program at a time, with the exception
 * that Xperience and Xperiment can be taken together.
 */
export function ActiveProgramsDashboard({ userProfile }) {
  const [expandedSection, setExpandedSection] = useState(null);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Mock data for the user's active program enrollment
  // This example shows the XPerience + XPeriment combo scenario
  const mockActiveProgram = {
    // Primary program type (xperience, xtrapreneurs, or horizons)
    programType: "xperience",
    
    // XPerience program data
    xperience: {
      id: "xp-dt",
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
        members: [
          { id: "user1", name: "Sarah Johnson (You)", isCurrentUser: true, points: 120 },
          { id: "user2", name: "Michael Chen", points: 95 },
          { id: "user3", name: "Priya Patel", points: 105 },
          { id: "user4", name: "James Wilson", points: 85 },
          { id: "user5", name: "Emma Rodriguez", points: 90 }
        ],
        ranking: 3,
        totalTeams: 12
      },
      points: {
        personal: 120,
        team: 770,
        milestones: 275
      },
      nextDeadline: {
        name: "User Testing Report",
        dueDate: "2023-11-16",
        daysRemaining: 5
      },
      milestones: [
        {
          id: "m1",
          name: "Problem Definition",
          status: "completed",
          dueDate: "2023-10-05",
          completedDate: "2023-10-05",
          score: 92
        },
        {
          id: "m2",
          name: "Ideation Process",
          status: "completed",
          dueDate: "2023-10-19",
          completedDate: "2023-10-19",
          score: 88
        },
        {
          id: "m3",
          name: "Prototype Development",
          status: "completed",
          dueDate: "2023-11-02",
          completedDate: "2023-11-02",
          score: 95
        },
        {
          id: "m4",
          name: "User Testing",
          status: "in_progress",
          dueDate: "2023-11-16",
          progress: 40
        },
        {
          id: "m5",
          name: "Final Presentation",
          status: "not_started",
          dueDate: "2023-12-07"
        }
      ],
      responsibilities: {
        role: "UX Designer",
        tasks: [
          { name: "User Testing Protocol", status: "completed", dueDate: "2023-11-10" },
          { name: "User Interview Sessions", status: "in_progress", dueDate: "2023-11-14" },
          { name: "Testing Analysis", status: "not_started", dueDate: "2023-11-16" }
        ]
      }
    },
    
    // XPeriment program data - paired with XPerience
    // This would be null if the user is not taking XPeriment with XPerience
    xperiment: {
      id: "xpm-dt",
      name: "Design Thinking 101",
      term: "Fall 2023",
      status: {
        state: "active",
        progressType: "week",
        current: 9,
        total: 15
      },
      // Uses the same team as XPerience
      team: {
        name: "Innovation Squad",
        id: "team123"
      },
      points: {
        personal: 125,
        contribution: "xperience"
      },
      nextDeadline: {
        name: "Reading Response 9",
        dueDate: "2023-11-14",
        daysRemaining: 3
      },
      schedule: {
        days: ["Monday", "Wednesday"],
        time: "2:00-3:15pm",
        location: "Innovation Hall 302"
      },
      instructor: "Prof. Emily Rodriguez",
      officeHours: "Thursdays, 1:00-3:00pm",
      assignments: [
        { 
          name: "Reading Response 9", 
          status: "not_started", 
          dueDate: "2023-11-14",
          type: "individual"
        },
        { 
          name: "Group Discussion", 
          status: "upcoming", 
          dueDate: "2023-11-15",
          type: "in-class"
        },
        { 
          name: "Final Project", 
          status: "not_started", 
          dueDate: "2023-12-12",
          type: "team"
        }
      ]
    },
    
    // Example of compatible program opportunities
    opportunities: [
      {
        id: "op1",
        type: "horizons",
        name: "AI for Good Challenge",
        term: "Winter 2023",
        status: {
          state: "applications_open",
          deadline: "2023-12-15"
        },
        description: "Apply your skills to create AI solutions for social impact.",
        teamRequirement: true,
        compatibility: {
          compatible: true,
          message: "Compatible with your current Xperience program"
        }
      }
    ]
  };
  
  // Alternative mock data if the user is in the Xtrapreneurs program
  /*
  const mockActiveProgram = {
    programType: "xtrapreneurs",
    xtrapreneurs: {
      id: "xpr-club",
      name: "Club Membership",
      term: "Fall 2023",
      status: {
        state: "active"
      },
      points: {
        personal: 85
      },
      nextDeadline: {
        name: "Entrepreneurship Workshop",
        dueDate: "2023-11-18",
        daysRemaining: 7,
        type: "event"
      },
      events: [
        {
          name: "Entrepreneurship Workshop",
          date: "2023-11-18",
          time: "5:00-7:00pm",
          location: "Innovation Hub",
          points: 15,
          status: "rsvp_pending"
        },
        {
          name: "Pitch Competition Info Session",
          date: "2023-11-22",
          time: "6:00-7:00pm",
          location: "Virtual",
          points: 10,
          status: "upcoming"
        }
      ],
      bounties: [
        {
          name: "Campus Sustainability Challenge",
          dueDate: "2023-12-05",
          prize: "$500 + 100 points",
          teamSize: "1-3 members",
          status: "participating",
          team: {
            name: "EcoInnovators", 
            id: "team456",
            members: [
              { id: "user1", name: "Sarah Johnson (You)", isCurrentUser: true },
              { id: "user6", name: "Alex Thompson" },
              { id: "user7", name: "Jamie Lee" }
            ]
          },
          progress: 25
        }
      ]
    }
  };
  */

  // Helper function for milestone status icon
  const getMilestoneStatusIcon = (status) => {
    const statusIcons = {
      completed: <Badge variant="success" className="rounded-full w-5 h-5 p-0.5">✓</Badge>,
      in_progress: <Badge variant="secondary" className="rounded-full w-5 h-5 p-0.5">⟳</Badge>,
      not_started: <Badge variant="outline" className="rounded-full w-5 h-5 p-0.5" />
    };
    return statusIcons[status] || statusIcons.not_started;
  };

  // Helper function to render progress indicators
  const renderProgramProgress = (program) => {
    if (program.status.progressType === "milestone") {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>
              Milestone {program.status.current} of {program.status.total}
            </span>
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
            <span>
              Week {program.status.current} of {program.status.total}
            </span>
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

  // Helper function to get program badge style based on type
  const getProgramBadge = (type) => {
    const badges = {
      xperience: { label: "Xperience", variant: "default", className: "bg-blue-500", icon: <Briefcase className="h-4 w-4 mr-1" /> },
      xperiment: { label: "Xperiment", variant: "default", className: "bg-green-500", icon: <BookOpen className="h-4 w-4 mr-1" /> },
      xtrapreneurs: { label: "Xtrapreneurs", variant: "default", className: "bg-amber-500", icon: <Lightbulb className="h-4 w-4 mr-1" /> },
      horizons: { label: "Horizons", variant: "default", className: "bg-purple-500", icon: <Rocket className="h-4 w-4 mr-1" /> }
    };
    
    const badge = badges[type] || { label: type, variant: "outline" };
    
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.icon}
        {badge.label}
      </Badge>
    );
  };

  // Helper function to get assignment status badge
  const getAssignmentStatusBadge = (status) => {
    const statusMap = {
      completed: <Badge variant="success">Completed</Badge>,
      in_progress: <Badge variant="secondary">In Progress</Badge>,
      not_started: <Badge variant="outline">Not Started</Badge>,
      upcoming: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>,
      rsvp_pending: <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">RSVP Pending</Badge>
    };
    
    return statusMap[status] || <Badge variant="outline">Unknown</Badge>;
  };
  
  // Get the upcoming deliverables from all programs
  const getUpcomingDeliverables = () => {
    const deliverables = [];
    
    if (mockActiveProgram.xperience?.nextDeadline) {
      deliverables.push({
        ...mockActiveProgram.xperience.nextDeadline,
        program: mockActiveProgram.xperience.name,
        programType: "xperience"
      });
    }
    
    if (mockActiveProgram.xperiment?.nextDeadline) {
      deliverables.push({
        ...mockActiveProgram.xperiment.nextDeadline,
        program: mockActiveProgram.xperiment.name,
        programType: "xperiment"
      });
    }
    
    if (mockActiveProgram.xtrapreneurs?.nextDeadline) {
      deliverables.push({
        ...mockActiveProgram.xtrapreneurs.nextDeadline,
        program: mockActiveProgram.xtrapreneurs.name,
        programType: "xtrapreneurs"
      });
    }
    
    if (mockActiveProgram.horizons?.nextDeadline) {
      deliverables.push({
        ...mockActiveProgram.horizons.nextDeadline,
        program: mockActiveProgram.horizons.name,
        programType: "horizons"
      });
    }
    
    // Sort by days remaining (ascending)
    return deliverables.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };
  
  // Calculate the total points from all programs
  const getTotalPoints = () => {
    let totalPoints = 0;
    
    if (mockActiveProgram.xperience?.points?.personal) {
      totalPoints += mockActiveProgram.xperience.points.personal;
    }
    
    if (mockActiveProgram.xperiment?.points?.personal) {
      totalPoints += mockActiveProgram.xperiment.points.personal;
    }
    
    if (mockActiveProgram.xtrapreneurs?.points?.personal) {
      totalPoints += mockActiveProgram.xtrapreneurs.points.personal;
    }
    
    if (mockActiveProgram.horizons?.points?.personal) {
      totalPoints += mockActiveProgram.horizons.points.personal;
    }
    
    return totalPoints;
  };
  
  const upcomingDeliverables = getUpcomingDeliverables();
  const totalPoints = getTotalPoints();
  
  return (
    <div className="space-y-8">
      {/* Header with information about exclusivity */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Active Program</h1>
        <p className="text-muted-foreground">
          Your current program enrollment and progress
        </p>
      </div>
      
      {mockActiveProgram.programType ? (
        <div className="space-y-8">
          {/* Program Overview Card - Always visible at the top */}
          <Card className="p-5">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  {/* Show main program type badge */}
                  {getProgramBadge(mockActiveProgram.programType)}
                  
                  {/* Main program name and term */}
                  <div className="flex items-center gap-2 mt-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {mockActiveProgram[mockActiveProgram.programType]?.name}
                    </h2>
                  </div>
                  <p className="text-muted-foreground">
                    {mockActiveProgram[mockActiveProgram.programType]?.term}
                  </p>
                  
                  {/* If Xperience+Xperiment combo, show Xperiment badge too */}
                  {mockActiveProgram.programType === "xperience" && mockActiveProgram.xperiment && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground mr-2">Also enrolled in:</span>
                      <Badge variant="outline" className="bg-green-50 border-green-200">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-green-600" />
                        <span className="text-green-600">Xperiment: {mockActiveProgram.xperiment.name}</span>
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard-v2/programs/${mockActiveProgram.programType}/${encodeURIComponent(mockActiveProgram[mockActiveProgram.programType].name)}`}>
                      Program Details <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  
                  {mockActiveProgram[mockActiveProgram.programType]?.team && (
                    <Button variant="default" asChild>
                      <Link href={`/dashboard-v2/teams/${mockActiveProgram[mockActiveProgram.programType].team.id}`}>
                        Team Dashboard
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Program Progress */}
              {mockActiveProgram.xperience?.status && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Milestone Progress</span>
                    <span>{Math.round((mockActiveProgram.xperience.status.current / mockActiveProgram.xperience.status.total) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(mockActiveProgram.xperience.status.current / mockActiveProgram.xperience.status.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {mockActiveProgram.xperience.status.current} of {mockActiveProgram.xperience.status.total} Milestones Completed
                  </p>
                </div>
              )}
              
              {mockActiveProgram.xperiment?.status && (
                <div className="space-y-1 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Class Progress</span>
                    <span>{Math.round((mockActiveProgram.xperiment.status.current / mockActiveProgram.xperiment.status.total) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(mockActiveProgram.xperiment.status.current / mockActiveProgram.xperiment.status.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Week {mockActiveProgram.xperiment.status.current} of {mockActiveProgram.xperiment.status.total}
                  </p>
                </div>
              )}
              
              {/* Team Information Brief */}
              {mockActiveProgram.xperience?.team && (
                <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Team:</span>
                    <span>{mockActiveProgram.xperience.team.name}</span>
                  </div>
                  
                  {mockActiveProgram.xperience.team.ranking && (
                    <div className="flex items-center gap-1">
                      <span>Ranking:</span>
                      <Badge variant="outline">
                        #{mockActiveProgram.xperience.team.ranking} of {mockActiveProgram.xperience.team.totalTeams}
                      </Badge>
                    </div>
                  )}
                  
                  {mockActiveProgram.xperience.points && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Points:</span>
                      <span>{totalPoints} personal / {mockActiveProgram.xperience.points.team} team</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Next Deadline Alert */}
              {upcomingDeliverables.length > 0 && (
                <Alert className="mt-4 bg-amber-50 border-amber-200">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-800">Upcoming Deadline</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    {upcomingDeliverables[0].name} due in {upcomingDeliverables[0].daysRemaining} days ({upcomingDeliverables[0].dueDate})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
          
          {/* Collapsible Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Xperience Milestone Progress Section */}
              {mockActiveProgram.xperience && (
                <Collapsible 
                  open={expandedSection === "milestones" || expandedSection === null} 
                  onOpenChange={() => toggleSection("milestones")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">
                          Milestone Progress
                        </CardTitle>
                        {expandedSection === "milestones" ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {mockActiveProgram.xperience.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-start gap-2">
                              {getMilestoneStatusIcon(milestone.status)}
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">{milestone.name}</div>
                                  {milestone.score && (
                                    <Badge variant="outline">Score: {milestone.score}/100</Badge>
                                  )}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    {milestone.status === "completed" 
                                      ? `Completed: ${milestone.completedDate}` 
                                      : `Due: ${milestone.dueDate}`}
                                  </span>
                                  {milestone.status === "in_progress" && milestone.progress && (
                                    <span>{milestone.progress}% complete</span>
                                  )}
                                </div>
                                {milestone.status === "in_progress" && milestone.progress && (
                                  <Progress value={milestone.progress} className="h-1 mt-1" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
              
              {/* Xperiment Class Information */}
              {mockActiveProgram.xperiment && (
                <Collapsible 
                  open={expandedSection === "class" || expandedSection === null} 
                  onOpenChange={() => toggleSection("class")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">
                          Class Information
                        </CardTitle>
                        {expandedSection === "class" ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24">Instructor:</span>
                              <span>{mockActiveProgram.xperiment.instructor}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24">Schedule:</span>
                              <span>
                                {mockActiveProgram.xperiment.schedule.days.join(" & ")}, {mockActiveProgram.xperiment.schedule.time}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground w-24">Location:</span>
                              <span>{mockActiveProgram.xperiment.schedule.location}</span>
                            </div>
                            {mockActiveProgram.xperiment.officeHours && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground w-24">Office Hours:</span>
                                <span>{mockActiveProgram.xperiment.officeHours}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="pt-2">
                            <h4 className="text-sm font-medium mb-3">Upcoming Assignments</h4>
                            <div className="space-y-3">
                              {mockActiveProgram.xperiment.assignments.map((assignment, index) => (
                                <div key={index} className="border rounded-md p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-medium text-sm">{assignment.name}</div>
                                    {getAssignmentStatusBadge(assignment.status)}
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Due: {assignment.dueDate}</span>
                                    <Badge variant="outline">{assignment.type}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-2 flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard-v2/programs/xperiment/${encodeURIComponent(mockActiveProgram.xperiment.name)}/syllabus`}>
                                View Syllabus
                              </Link>
                            </Button>
                            <Button variant="default" size="sm" asChild>
                              <Link href={`/dashboard-v2/programs/xperiment/${encodeURIComponent(mockActiveProgram.xperiment.name)}`}>
                                Class Dashboard
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
              
              {/* Team Responsibilities Section */}
              {mockActiveProgram[mockActiveProgram.programType]?.responsibilities && (
                <Collapsible 
                  open={expandedSection === "responsibilities" || expandedSection === null} 
                  onOpenChange={() => toggleSection("responsibilities")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">
                          Your Responsibilities
                        </CardTitle>
                        {expandedSection === "responsibilities" ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Your Role</span>
                            <Badge variant="secondary">
                              {mockActiveProgram[mockActiveProgram.programType].responsibilities.role}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {mockActiveProgram[mockActiveProgram.programType].responsibilities.tasks.map((task, index) => (
                              <div key={index} className="flex justify-between text-sm border-b pb-2">
                                <span>{task.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                                  {getAssignmentStatusBadge(task.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-2 flex justify-end">
                            <Button size="sm" asChild>
                              <Link href={`/dashboard-v2/programs/${mockActiveProgram.programType}/${encodeURIComponent(mockActiveProgram[mockActiveProgram.programType].name)}/workspace`}>
                                Open Workspace
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Team Information */}
              {mockActiveProgram[mockActiveProgram.programType]?.team && (
                <Collapsible 
                  open={expandedSection === "team" || expandedSection === null} 
                  onOpenChange={() => toggleSection("team")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">
                          Team: {mockActiveProgram[mockActiveProgram.programType].team.name}
                        </CardTitle>
                        {expandedSection === "team" ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {mockActiveProgram[mockActiveProgram.programType].team.members && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Team Members</h4>
                              <div className="space-y-2">
                                {mockActiveProgram[mockActiveProgram.programType].team.members.map((member) => (
                                  <div 
                                    key={member.id} 
                                    className={`flex items-center justify-between p-2 rounded-md ${
                                      member.isCurrentUser ? "bg-primary/10" : "bg-accent/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                          {member.name.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className={member.isCurrentUser ? "font-medium" : ""}>
                                        {member.name}
                                      </span>
                                    </div>
                                    {member.points && (
                                      <Badge variant="outline">
                                        {member.points} pts
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="pt-2 flex justify-end gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard-v2/teams/${mockActiveProgram[mockActiveProgram.programType].team.id}/chat`}>
                                  Team Chat
                                </Link>
                              </Button>
                              <Button variant="default" size="sm" asChild>
                                <Link href={`/dashboard-v2/teams/${mockActiveProgram[mockActiveProgram.programType].team.id}`}>
                                  Team Dashboard
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
              
              {/* Upcoming Deliverables Section */}
              <Collapsible 
                open={expandedSection === "deliverables" || expandedSection === null} 
                onOpenChange={() => toggleSection("deliverables")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">
                        Upcoming Deliverables
                      </CardTitle>
                      {expandedSection === "deliverables" ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {upcomingDeliverables.length > 0 ? (
                        <div className="space-y-4">
                          {upcomingDeliverables.map((deliverable, index) => (
                            <div key={index} className="border rounded-md p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium">{deliverable.name}</div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                  {deliverable.daysRemaining} days left
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <span>Due: {deliverable.dueDate}</span>
                                  <span className="mx-1">•</span>
                                  <span>Program: </span>
                                  {getProgramBadge(deliverable.programType)}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="pt-1 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/dashboard-v2/deliverables">
                                View All Deliverables
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No upcoming deliverables
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
              {/* Points Section */}
              <Collapsible 
                open={expandedSection === "points" || expandedSection === null} 
                onOpenChange={() => toggleSection("points")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base">
                        Points Summary
                      </CardTitle>
                      {expandedSection === "points" ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {mockActiveProgram.xperience?.points && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500">
                                <Briefcase className="h-3.5 w-3.5 mr-1" />
                                Xperience
                              </Badge>
                              <span className="text-muted-foreground">Points</span>
                            </div>
                            <div className="font-bold">{mockActiveProgram.xperience.points.personal}</div>
                          </div>
                        )}
                        
                        {mockActiveProgram.xperiment?.points && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500">
                                <BookOpen className="h-3.5 w-3.5 mr-1" />
                                Xperiment
                              </Badge>
                              <span className="text-muted-foreground">Points</span>
                            </div>
                            <div className="font-bold">{mockActiveProgram.xperiment.points.personal}</div>
                          </div>
                        )}
                        
                        {mockActiveProgram.xtrapreneurs?.points && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-500">
                                <Lightbulb className="h-3.5 w-3.5 mr-1" />
                                Xtrapreneurs
                              </Badge>
                              <span className="text-muted-foreground">Points</span>
                            </div>
                            <div className="font-bold">{mockActiveProgram.xtrapreneurs.points.personal}</div>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center bg-accent/50 p-2 rounded-md">
                          <span className="font-medium">Total Points</span>
                          <span className="text-xl font-bold">{totalPoints}</span>
                        </div>
                        
                        <div className="pt-1 flex justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard-v2/points">
                              Points Dashboard
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </div>
          
          {/* Program Opportunities */}
          {mockActiveProgram.opportunities && mockActiveProgram.opportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Compatible Program Opportunities</CardTitle>
                <CardDescription>
                  Programs you can apply to that are compatible with your current enrollment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockActiveProgram.opportunities.map((opportunity) => (
                    <Card key={opportunity.id} className="overflow-hidden border">
                      <CardHeader className="p-4 pb-2 space-y-0 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            {getProgramBadge(opportunity.type)}
                            <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                              Applications Open
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{opportunity.name}</CardTitle>
                          <CardDescription>{opportunity.term}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 pb-0">
                        <p className="text-sm">{opportunity.description}</p>
                        {opportunity.compatibility && (
                          <p className="mt-2 text-xs bg-green-50 text-green-700 p-2 rounded border border-green-200 flex items-center">
                            <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
                            {opportunity.compatibility.message}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard-v2/programs/${opportunity.type}/${encodeURIComponent(opportunity.name)}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button variant="default" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard-v2/programs/${opportunity.type}/${encodeURIComponent(opportunity.name)}/apply`}>
                            Apply Now
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard-v2/opportunities">Browse All Opportunities</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      ) : (
        <Card className="py-12">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="rounded-full p-3 bg-primary/10 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Active Program</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You're not currently enrolled in any programs. Browse available programs to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard-v2/opportunities">
                Browse Programs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}