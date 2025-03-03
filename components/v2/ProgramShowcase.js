"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ProgramCard } from "./ProgramCard";

/**
 * ProgramShowcase Component
 * Demonstrates the different variations of the ProgramCard component
 * Useful for testing and as a visual reference
 */
export function ProgramShowcase() {
  const [activeTab, setActiveTab] = useState("active");

  // Example programs - Active Programs
  const activePrograms = [
    {
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
      nextDeadline: {
        name: "User Testing Report",
        dueDate: "2023-11-16",
        daysRemaining: 5
      }
    },
    {
      type: "xperiment",
      name: "Design Thinking 101",
      term: "Fall 2023",
      status: {
        state: "active",
        progressType: "week",
        current: 9,
        total: 15
      },
      schedule: {
        days: ["Monday", "Wednesday"],
        time: "2:00-3:15pm",
        location: "Innovation Hall 302"
      },
      team: {
        name: "Innovation Squad",
        id: "team123"
      },
      points: {
        personal: 125,
        contribution: "Xperience"
      },
      instructors: [
        "Prof. Emily Rodriguez"
      ],
      location: "Innovation Hall 302",
      nextDeadline: {
        name: "Reading Response 9",
        dueDate: "2023-11-14",
        daysRemaining: 3
      }
    },
    {
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
      nextDeadline: {
        name: "Entrepreneurship Workshop",
        dueDate: "2023-11-18",
        daysRemaining: 7
      }
    },
    {
      type: "horizons",
      name: "Sustainable Cities",
      term: "Fall 2023",
      status: {
        state: "active",
        progressType: "milestone",
        current: 2,
        total: 4
      },
      team: {
        name: "Urban Innovators",
        id: "team789",
        members: 4,
        ranking: 5,
        totalTeams: 15
      },
      points: {
        personal: 95,
        team: 277
      },
      nextDeadline: {
        name: "Prototype & Testing",
        dueDate: "2023-11-23",
        daysRemaining: 12
      }
    }
  ];

  // Example programs - Opportunities
  const opportunities = [
    {
      type: "xperience",
      name: "Product Development",
      term: "Spring 2024",
      status: {
        state: "applications_open",
        deadline: "2023-12-01"
      },
      compatibility: {
        compatible: true,
        message: "Compatible with your current programs"
      },
      actions: ["viewDetails", "apply"]
    },
    {
      type: "horizons",
      name: "AI for Good",
      term: "Winter 2023",
      status: {
        state: "applications_open",
        deadline: "2023-11-30"
      },
      compatibility: {
        compatible: true,
        message: "Compatible with your current programs"
      },
      actions: ["viewDetails", "apply"]
    },
    {
      type: "xperiment",
      name: "Machine Learning Fundamentals",
      term: "Spring 2024",
      status: {
        state: "upcoming",
        openDate: "2023-12-15"
      },
      schedule: {
        days: ["Tuesday", "Thursday"],
        time: "1:00-2:15pm"
      },
      instructors: [
        "Dr. James Wilson"
      ],
      location: "Tech Building 201",
      compatibility: {
        compatible: false,
        message: "Conflicts with Design Thinking 101"
      },
      actions: ["viewDetails"]
    },
    {
      type: "xtrapreneurs",
      name: "Social Media Marketing Challenge",
      term: "Winter 2023",
      status: {
        state: "applications_open",
        deadline: "2023-11-30"
      },
      compatibility: {
        compatible: true
      },
      points: {
        potential: 75
      },
      actions: ["viewDetails", "apply"]
    }
  ];

  // Example programs - Completed Programs
  const completedPrograms = [
    {
      type: "xperience",
      name: "Introduction to Entrepreneurship",
      term: "Spring 2023",
      status: {
        state: "completed",
        progressType: "milestone",
        current: 5,
        total: 5
      },
      team: {
        name: "Venture Pioneers",
        id: "team-old-1"
      },
      points: {
        personal: 135,
        team: 810
      },
      actions: ["viewDetails"]
    },
    {
      type: "xperiment",
      name: "Entrepreneurship 101",
      term: "Spring 2023",
      status: {
        state: "completed",
        progressType: "week",
        current: 15,
        total: 15
      },
      points: {
        personal: 145
      },
      actions: ["viewDetails", "viewSyllabus"]
    },
    {
      type: "horizons",
      name: "Education Innovation",
      term: "Summer 2023",
      status: {
        state: "completed",
        progressType: "milestone",
        current: 4,
        total: 4
      },
      team: {
        name: "EduTech Pioneers",
        id: "team-old-2"
      },
      points: {
        personal: 110,
        team: 550
      },
      actions: ["viewDetails"]
    }
  ];

  // Example programs - Application Pending
  const pendingPrograms = [
    {
      type: "xperience",
      name: "Software Product Management",
      term: "Winter 2023",
      status: {
        state: "application_pending",
        submittedDate: "2023-10-15"
      },
      actions: ["viewDetails"]
    },
    {
      type: "horizons",
      name: "Healthcare Innovation",
      term: "Winter 2023",
      status: {
        state: "waitlisted",
        position: 3
      },
      actions: ["viewDetails"]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Card Components</CardTitle>
        <CardDescription>
          Showcase of different program card variations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="active">Active Programs</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {activePrograms.map((program, index) => (
                <ProgramCard
                  key={`active-${index}`}
                  {...program}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="opportunities" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {opportunities.map((program, index) => (
                <ProgramCard
                  key={`opportunity-${index}`}
                  {...program}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {completedPrograms.map((program, index) => (
                <ProgramCard
                  key={`completed-${index}`}
                  {...program}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {pendingPrograms.map((program, index) => (
                <ProgramCard
                  key={`pending-${index}`}
                  {...program}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}