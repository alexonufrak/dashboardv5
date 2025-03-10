import React, { useState } from "react";
import DashboardLayout from "@/layouts/dashboard";
import { Card, CardHeader, CardBody, CardFooter, Progress, Chip, Badge } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";


import { useDashboard } from "@/contexts/DashboardContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { CalendarIcon, AwardIcon, TeamIcon, CompassIcon } from "@/components/dashboard/icons";
import WithAuth from "@/components/auth/WithAuth";
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import { GlobalActivityFeed } from "@/components/activity";
import { Button, Link } from "@heroui/react";

export default function DashboardPage() {
  const [selected, setSelected] = useState("overview");
  
  // Use the dashboard context to access data
  const {
    profile,
    isLoading,
    error,
    milestones,
    teamData,
    isTeamLoading,
    cohort,
    initiativeName,
    participationType,
    programLoading,
    applications,
    getAllProgramInitiatives
  } = useDashboard();
  
  // Use the onboarding context
  const { isLoading: isOnboardingLoading, onboardingCompleted } = useOnboarding();

  // Get all program initiatives the user is participating in
  const initiatives = profile ? getAllProgramInitiatives() : [];
  
  // Derive loading state for entire dashboard
  const isDashboardLoading = isLoading || isTeamLoading || programLoading || isOnboardingLoading;
  
  // Define a helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No date";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Calculate milestone status
  const getStatusColor = (status: string | undefined) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'upcoming': return 'default';
      default: return 'default';
    }
  };
  
  return (
    <WithAuth>
      <DashboardLayout
        title="Dashboard | xFoundry Hub"
        profile={profile}
        isLoading={isDashboardLoading}
        error={error}
        loadingMessage="Loading dashboard..."
        applications={applications}
      >
        <div className="space-y-6">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex gap-2">
              <Button color="primary" variant="flat" as={Link} href="/programs">
                Browse Programs
              </Button>
              <Button color="primary" as={Link} href="/apply">
                Apply Now
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs 
            aria-label="Dashboard Tabs" 
            selectedKey={selected}
            onSelectionChange={setSelected as any}
            className="w-full"
          >
            <Tab key="overview" title="Overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {/* Show onboarding checklist if onboarding is not completed */}
                {!onboardingCompleted && (
                  <div className="md:col-span-3">
                    <OnboardingChecklist />
                  </div>
                )}
                
                {/* Programs and progress card */}
                <Card className="md:col-span-2">
                  <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                      <p className="text-md font-bold">Your Progress</p>
                      <p className="text-small text-default-500">Active programs and milestones</p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {initiatives.length > 0 ? (
                      <div className="space-y-6">
                        {initiatives.map((initiative) => (
                          <div key={initiative.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CompassIcon />
                                <Link href={`/program/${initiative.id}`} className="font-medium">
                                  {initiative.name}
                                </Link>
                                <Chip 
                                  size="sm" 
                                  variant="flat" 
                                  color={initiative.isTeamBased ? "primary" : "success"}
                                >
                                  {initiative.isTeamBased ? "Team" : "Individual"}
                                </Chip>
                              </div>
                            </div>
                            
                            {/* Show milestones only for the active cohort */}
                            {initiative.cohortId === cohort?.id && milestones.length > 0 && (
                              <div className="space-y-3 pl-7">
                                {milestones.slice(0, 3).map((milestone) => (
                                  <div key={milestone.id} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <div className="font-medium flex items-center gap-2">
                                        <Badge color={getStatusColor(milestone.status)} variant="flat" size="sm">
                                          {milestone.status || 'Unknown'}
                                        </Badge>
                                        {milestone.name}
                                      </div>
                                      <div className="text-default-500 flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {formatDate(milestone.dueDate)}
                                      </div>
                                    </div>
                                    <Progress 
                                      size="sm" 
                                      value={milestone.progress || 0} 
                                      color={getStatusColor(milestone.status)}
                                      className="max-w-full"
                                    />
                                  </div>
                                ))}
                                
                                {milestones.length > 3 && (
                                  <Link 
                                    href={`/program/${initiative.id}`} 
                                    className="text-sm text-primary pl-2"
                                  >
                                    View all milestones ({milestones.length})
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center bg-default-100 rounded-lg">
                        <CompassIcon className="h-10 w-10 text-default-400 mb-3" />
                        <p className="text-default-500">You&apos;re not part of any programs yet</p>
                        <Button 
                          color="primary" 
                          className="mt-4"
                          as={Link}
                          href="/programs"
                        >
                          Browse Available Programs
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
                
                {/* Team card */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col">
                      <p className="text-md font-bold">Your Team</p>
                      <p className="text-small text-default-500">
                        {teamData ? teamData.name : "No team joined yet"}
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {teamData ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {teamData.members?.map((member, index) => (
                            <div 
                              key={member.id || index} 
                              className="flex flex-col items-center gap-1"
                            >
                              <div className="relative">
                                <img 
                                  src={member.avatar || "/placeholder-user.jpg"} 
                                  alt={member.name} 
                                  className="w-12 h-12 rounded-full object-cover border border-divider"
                                />
                                {member.id === profile?.id && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border border-background"></div>
                                )}
                              </div>
                              <span className="text-xs font-medium">{member.name}</span>
                              <span className="text-xxs text-default-500">{member.role}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            color="primary" 
                            variant="flat" 
                            size="sm"
                            as={Link}
                            href={`/team/${teamData.id}`}
                            fullWidth
                          >
                            Manage Team
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center bg-default-100 rounded-lg">
                        <TeamIcon className="h-10 w-10 text-default-400 mb-3" />
                        <p className="text-default-500">No team joined yet</p>
                        {profile?.hasActiveTeamParticipation && (
                          <Button 
                            color="primary" 
                            className="mt-4"
                            as={Link}
                            href="/create-team"
                          >
                            Create a Team
                          </Button>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </Tab>
            
            <Tab key="programs" title="Programs">
              <div className="pt-4">
                <Card>
                  <CardHeader>
                    <p className="text-md font-bold">Your Programs</p>
                  </CardHeader>
                  <CardBody>
                    {initiatives.length > 0 ? (
                      <div className="space-y-4">
                        {initiatives.map((initiative) => (
                          <div 
                            key={initiative.id} 
                            className="border rounded-lg p-4 hover:bg-default-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{initiative.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-default-500 mt-1">
                                  <Chip 
                                    size="sm" 
                                    variant="flat" 
                                    color={initiative.isTeamBased ? "primary" : "success"}
                                  >
                                    {initiative.isTeamBased ? "Team" : "Individual"}
                                  </Chip>
                                  <span>·</span>
                                  <span>
                                    {initiative.isTeamBased && teamData ? `Team: ${teamData.name}` : "Individual Participation"}
                                  </span>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                color="primary"
                                as={Link}
                                href={`/program/${initiative.id}`}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center bg-default-100 rounded-lg">
                        <CompassIcon className="h-10 w-10 text-default-400 mb-3" />
                        <p className="text-default-500">You haven&apos;t joined any programs yet</p>
                      </div>
                    )}
                  </CardBody>
                  <CardFooter>
                    <Button color="primary" as={Link} href="/programs">
                      Browse Available Programs
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </Tab>
            
            <Tab key="activity" title="Activity">
              <div className="pt-4">
                <GlobalActivityFeed
                  detailed={true}
                  limit={10}
                  title="Your Recent Activity"
                />
              </div>
            </Tab>
          </Tabs>
        </div>
      </DashboardLayout>
    </WithAuth>
  );
}