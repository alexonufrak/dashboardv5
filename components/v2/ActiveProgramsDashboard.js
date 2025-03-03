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
  ArrowUpRight
} from "lucide-react";
import { ProgramCard } from "./ProgramCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "../ui/collapsible";

/**
 * Active Programs Dashboard Component
 * Shows detailed view of all active program participation
 * Includes program progress, team responsibilities, and upcoming deliverables
 */
export function ActiveProgramsDashboard({ userProfile, initialTab = "all" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedProgram, setExpandedProgram] = useState(null);
  
  useEffect(() => {
    // Get the type from URL query parameter if present
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam && ['xperience', 'xperiment', 'xtrapreneurs', 'horizons'].includes(typeParam)) {
      setActiveTab(typeParam);
    }
  }, []);

  // Toggle program details expansion
  const toggleProgram = (programId) => {
    setExpandedProgram(expandedProgram === programId ? null : programId);
  };

  // Mock data for active programs
  const mockData = {
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
          team: 770,
          milestones: 275
        },
        icon: <Briefcase className="h-4 w-4" />,
        color: "text-blue-500 bg-blue-50",
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
          personal: 125,
          contribution: "xperience"
        },
        icon: <BookOpen className="h-4 w-4" />,
        color: "text-green-500 bg-green-50",
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
        color: "text-amber-500 bg-amber-50",
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
            team: "EcoInnovators",
            progress: 25
          }
        ]
      }
    ]
  };

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

  // Filter programs by type for tab filtering
  const filteredPrograms = activeTab === "all" 
    ? mockData.programs 
    : mockData.programs.filter(program => program.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Active Programs</h1>
        <p className="text-muted-foreground">
          Your current program participation and progress
        </p>
      </div>

      {/* Program Type Tabs */}
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-grid md:grid-cols-5">
          <TabsTrigger value="all">All Programs</TabsTrigger>
          <TabsTrigger value="xperience">Xperience</TabsTrigger>
          <TabsTrigger value="xperiment">Xperiment</TabsTrigger>
          <TabsTrigger value="xtrapreneurs">Xtrapreneurs</TabsTrigger>
          <TabsTrigger value="horizons">Horizons</TabsTrigger>
        </TabsList>
        
        {/* Programs List with Collapsible Details */}
        <TabsContent value={activeTab} className="space-y-6">
          {filteredPrograms.length > 0 ? (
            <div className="grid gap-6">
              {filteredPrograms.map((program) => (
                <Collapsible 
                  key={program.id}
                  open={expandedProgram === program.id}
                  onOpenChange={() => toggleProgram(program.id)}
                  className="border rounded-lg overflow-hidden"
                >
                  <Card className="border-0 shadow-none">
                    <CollapsibleTrigger className="w-full text-left [&[data-state=open]>div]:border-b">
                      <div className="p-4 hover:bg-accent/50 transition-colors flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-md ${program.color}`}>
                            {program.icon}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{program.name}</h3>
                              {getProgramBadge(program.type)}
                            </div>
                            <p className="text-sm text-muted-foreground">{program.term}</p>
                            
                            {/* Summary info - visible in collapsed state */}
                            <div className="flex flex-col md:flex-row md:items-center md:gap-6 pt-2">
                              {/* Progress */}
                              <div className="flex flex-col mb-2 md:mb-0">
                                <span className="text-xs text-muted-foreground mb-0.5">Progress</span>
                                <div className="w-48">{renderProgramProgress(program)}</div>
                              </div>
                              
                              {/* Team */}
                              {program.team && (
                                <div className="flex gap-1 items-center text-sm">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="whitespace-nowrap">Team: {program.team.name}</span>
                                </div>
                              )}
                              
                              {/* Next deadline */}
                              {program.nextDeadline && (
                                <div className="flex gap-1 items-center text-sm">
                                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                                  <span className="whitespace-nowrap text-amber-600">
                                    {program.nextDeadline.name} (in {program.nextDeadline.daysRemaining} days)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/dashboard/programs/${program.type}/${encodeURIComponent(program.name)}`}>
                              Details <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {expandedProgram === program.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="p-4 pt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="space-y-6">
                            {/* Program-specific panel based on type */}
                            {program.type === "xperience" && (
                              <>
                                {/* Milestone Progress */}
                                <div>
                                  <h4 className="text-sm font-medium mb-3">Milestone Progress</h4>
                                  <div className="space-y-3">
                                    {program.milestones.map((milestone) => (
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
                                </div>
                              </>
                            )}
                            
                            {program.type === "xperiment" && (
                              <>
                                {/* Class Information */}
                                <div>
                                  <h4 className="text-sm font-medium mb-3">Class Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                      <span className="text-muted-foreground">Instructor:</span>
                                      <span>{program.instructor}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-muted-foreground">Schedule:</span>
                                      <span>
                                        {program.schedule.days.join(" & ")}, {program.schedule.time}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <span className="text-muted-foreground">Location:</span>
                                      <span>{program.schedule.location}</span>
                                    </div>
                                    {program.officeHours && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground">Office Hours:</span>
                                        <span>{program.officeHours}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Assignments */}
                                <div>
                                  <h4 className="text-sm font-medium mb-3">Upcoming Assignments</h4>
                                  <div className="space-y-3">
                                    {program.assignments.map((assignment, index) => (
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
                              </>
                            )}
                            
                            {program.type === "xtrapreneurs" && (
                              <>
                                {/* Upcoming Events */}
                                <div>
                                  <h4 className="text-sm font-medium mb-3">Upcoming Events</h4>
                                  <div className="space-y-3">
                                    {program.events.map((event, index) => (
                                      <div key={index} className="border rounded-md p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="font-medium text-sm">{event.name}</div>
                                          {getAssignmentStatusBadge(event.status)}
                                        </div>
                                        <div className="text-xs text-muted-foreground mb-2">
                                          {event.date} • {event.time} • {event.location}
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                            +{event.points} points
                                          </Badge>
                                          <Button size="sm" variant="secondary">RSVP</Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Active Bounties */}
                                {program.bounties && program.bounties.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-3">Active Bounties</h4>
                                    <div className="space-y-3">
                                      {program.bounties.map((bounty, index) => (
                                        <div key={index} className="border rounded-md p-3">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="font-medium text-sm">{bounty.name}</div>
                                            <Badge>{bounty.status}</Badge>
                                          </div>
                                          <div className="space-y-2 text-xs text-muted-foreground">
                                            <div className="flex justify-between">
                                              <span>Due: {bounty.dueDate}</span>
                                              <span>Team: {bounty.team}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Prize: {bounty.prize}</span>
                                              <span>Team Size: {bounty.teamSize}</span>
                                            </div>
                                            <div className="space-y-1 pt-1">
                                              <div className="flex justify-between text-xs">
                                                <span>Progress</span>
                                                <span>{bounty.progress}%</span>
                                              </div>
                                              <Progress value={bounty.progress} className="h-1.5" />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Right Column */}
                          <div className="space-y-6">
                            {/* Team Information */}
                            {program.team && (
                              <div>
                                <h4 className="text-sm font-medium mb-3">Team: {program.team.name}</h4>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="space-y-4">
                                      {program.team.ranking && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-muted-foreground">Team Ranking</span>
                                          <Badge variant="outline">
                                            #{program.team.ranking} of {program.team.totalTeams}
                                          </Badge>
                                        </div>
                                      )}
                                      
                                      {program.points && program.points.team && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-muted-foreground">Team Points</span>
                                          <span className="font-medium">{program.points.team}</span>
                                        </div>
                                      )}
                                      
                                      {program.responsibilities && (
                                        <div>
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground">Your Role</span>
                                            <Badge variant="secondary">{program.responsibilities.role}</Badge>
                                          </div>
                                          <div className="space-y-2">
                                            {program.responsibilities.tasks.map((task, index) => (
                                              <div key={index} className="flex justify-between text-sm border-b pb-2">
                                                <span>{task.name}</span>
                                                {getAssignmentStatusBadge(task.status)}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="mt-4">
                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                          <Link href={`/dashboard/teams/${program.team.id}`}>
                                            Team Dashboard
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                            
                            {/* Upcoming Deliverables */}
                            <div>
                              <h4 className="text-sm font-medium mb-3">Upcoming Deliverables</h4>
                              <Card>
                                <CardContent className="p-4">
                                  {program.nextDeadline ? (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <div className="font-medium">{program.nextDeadline.name}</div>
                                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                            {program.nextDeadline.daysRemaining} days left
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Due: {program.nextDeadline.dueDate}
                                        </div>
                                        
                                        {/* Show progress if available */}
                                        {program.type === "xperience" && program.milestones.find(m => m.status === "in_progress")?.progress && (
                                          <div className="space-y-1 mt-2">
                                            <div className="flex justify-between text-xs">
                                              <span>Current Progress</span>
                                              <span>
                                                {program.milestones.find(m => m.status === "in_progress").progress}%
                                              </span>
                                            </div>
                                            <Progress 
                                              value={program.milestones.find(m => m.status === "in_progress").progress} 
                                              className="h-1.5" 
                                            />
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" className="flex-1" asChild>
                                          <Link href={`/dashboard/programs/${program.type}/${encodeURIComponent(program.name)}/requirements`}>
                                            View Requirements
                                          </Link>
                                        </Button>
                                        <Button size="sm" variant="default" className="flex-1" asChild>
                                          <Link href={`/dashboard/programs/${program.type}/${encodeURIComponent(program.name)}/workspace`}>
                                            Open Workspace
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground text-center py-6">
                                      No upcoming deliverables
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                            
                            {/* Points Information */}
                            <div>
                              <h4 className="text-sm font-medium mb-3">Points</h4>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="space-y-4">
                                    {program.points && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Your Points</span>
                                        <div className="text-xl font-bold">{program.points.personal}</div>
                                      </div>
                                    )}
                                    
                                    {program.points && program.points.contribution && (
                                      <div className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                                        Points earned in this {program.type} contribute to your {program.points.contribution} team total.
                                      </div>
                                    )}
                                    
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                      <Link href={`/dashboard/points?program=${program.type}`}>
                                        View Points History
                                      </Link>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0">
                        <div className="flex flex-col sm:flex-row w-full gap-2">
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/dashboard/programs/${program.type}/${encodeURIComponent(program.name)}`}>
                              Program Dashboard
                            </Link>
                          </Button>
                          <Button variant="default" size="sm" className="flex-1" asChild>
                            <Link href={`/dashboard/teams/${program.team?.id || ''}`}>
                              Team Dashboard
                            </Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          ) : (
            <Card className="py-8">
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="rounded-full p-3 bg-primary/10 mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Active Programs</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  You don't have any active programs in this category. Explore available programs to get started.
                </p>
                <Button asChild>
                  <Link href="/dashboard/opportunities">
                    Browse Programs <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}