"use client";

import { useEffect, useState } from "react";
import { 
  Award, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Calendar,
  Briefcase,
  BookOpen,
  Lightbulb,
  Rocket
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PointsOverviewCard } from "./PointsOverviewCard";
import { PointsBreakdownCard } from "./PointsBreakdownCard";
import { MilestoneProgressCard } from "./MilestoneProgressCard";
import { PointsTrendCard } from "./PointsTrendCard";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

/**
 * PointsDashboard Component
 * Comprehensive dashboard for points tracking and visualization
 */
export function PointsDashboard({ userProfile }) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data for points dashboard
  const mockData = {
    totalPoints: 330,
    programPoints: [
      {
        program: "Xperience: Design Thinking",
        type: "xperience",
        points: 120,
        teamContribution: {
          team: "Innovation Squad",
          totalTeamPoints: 770
        },
        sources: [
          { name: "Workshop Attendance", points: 15, date: "2023-10-05" },
          { name: "Mentor Session", points: 20, date: "2023-10-12" },
          { name: "Project Milestone", points: 40, date: "2023-10-15" },
          { name: "Team Participation", points: 45, date: "ongoing" }
        ]
      },
      {
        program: "Xperiment: Design Thinking 101",
        type: "xperiment",
        points: 125,
        teamContribution: {
          team: "Innovation Squad",
          totalTeamPoints: 770
        },
        sources: [
          { name: "Attendance", points: 40, date: "ongoing" },
          { name: "Assignments", points: 55, date: "various" },
          { name: "Midterm", points: 30, date: "2023-10-25" }
        ]
      },
      {
        program: "Xtrapreneurs: Club Membership",
        type: "xtrapreneurs",
        points: 85,
        sources: [
          { name: "Event Attendance", points: 35, date: "various" },
          { name: "Completed Bounties", points: 50, date: "2023-10-30" }
        ]
      }
    ],
    xperienceMilestones: [
      {
        name: "Problem Definition",
        status: "completed",
        dueDate: "2023-10-05",
        completedDate: "2023-10-05",
        score: 92
      },
      {
        name: "Ideation Process",
        status: "completed",
        dueDate: "2023-10-19",
        completedDate: "2023-10-19",
        score: 88
      },
      {
        name: "Prototype Development",
        status: "completed",
        dueDate: "2023-11-02",
        completedDate: "2023-11-02",
        score: 95
      },
      {
        name: "User Testing",
        status: "in_progress",
        dueDate: "2023-11-16",
        progress: 40
      },
      {
        name: "Final Presentation",
        status: "not_started",
        dueDate: "2023-12-07"
      }
    ],
    horizonsMilestones: [
      {
        name: "Problem Analysis",
        status: "completed",
        dueDate: "2023-10-12",
        completedDate: "2023-10-12",
        score: 85
      },
      {
        name: "Solution Concept",
        status: "completed",
        dueDate: "2023-11-02",
        completedDate: "2023-11-02",
        score: 92
      },
      {
        name: "Prototype & Testing",
        status: "in_progress",
        dueDate: "2023-11-23",
        progress: 30
      },
      {
        name: "Final Presentation",
        status: "not_started",
        dueDate: "2023-12-14"
      }
    ]
  };

  // Summary metrics
  const metrics = [
    {
      title: "Total Points",
      value: mockData.totalPoints,
      icon: <Award className="h-8 w-8 text-primary" />,
      change: "+55 in last week"
    },
    {
      title: "Team Contribution",
      value: "120",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      change: "16% of team total"
    },
    {
      title: "Milestones Completed",
      value: "6",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      change: "2 upcoming"
    },
    {
      title: "Active Programs",
      value: "3",
      icon: <Calendar className="h-8 w-8 text-amber-500" />,
      change: "2 new opportunities"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Points & Progress
        </h1>
        <p className="text-muted-foreground">
          Track your points, view progress, and see your contributions across all programs.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content tabs */}
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PointsOverviewCard 
              totalPoints={mockData.totalPoints}
              programPoints={mockData.programPoints}
            />
            
            <MilestoneProgressCard 
              programName="Design Thinking"
              programType="xperience"
              programId="xp-dt"
              milestones={mockData.xperienceMilestones}
            />
          </div>
          
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>Points Milestone Reached!</AlertTitle>
            <AlertDescription>
              Congratulations! You've earned over 300 points across all programs, 
              unlocking the "Rising Star" achievement.
            </AlertDescription>
          </Alert>
          
          <PointsTrendCard />
        </TabsContent>
        
        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <PointsOverviewCard 
                totalPoints={mockData.totalPoints}
                programPoints={mockData.programPoints}
                showDetails={false}
              />
            </div>
            
            <div className="md:col-span-2">
              <PointsBreakdownCard 
                programPoints={mockData.programPoints}
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MilestoneProgressCard 
              programName="Design Thinking"
              programType="xperience"
              programId="xp-dt"
              milestones={mockData.xperienceMilestones}
            />
            
            <MilestoneProgressCard 
              programName="Sustainable Cities"
              programType="horizons"
              programId="hz-sc"
              milestones={mockData.horizonsMilestones}
            />
          </div>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <PointsTrendCard className="w-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}