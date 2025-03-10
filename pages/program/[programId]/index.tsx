import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Card, CardHeader, CardBody, Progress, Divider, Chip, Badge } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { Avatar, AvatarGroup } from "@heroui/react";


import DashboardLayout from "@/layouts/dashboard";
import { useDashboard } from "@/contexts/DashboardContext";
import { CalendarIcon, TeamIcon, MilestoneIcon } from "@/components/dashboard/icons";
import { Button, Link } from "@heroui/react";

export default function ProgramPage() {
  const router = useRouter();
  const { programId } = router.query;
  const [selected, setSelected] = useState("overview");
  
  const {
    profile,
    isLoading,
    error,
    milestones,
    teamData,
    isTeamLoading,
    teamsData,
    programLoading,
    setActiveProgram,
    getActiveProgramData
  } = useDashboard();
  
  // Set the active program when the component mounts and programId is available
  useEffect(() => {
    if (programId && typeof programId === 'string') {
      setActiveProgram(programId);
    }
  }, [programId, setActiveProgram]);
  
  // Get the program data for this specific program
  const programData = programId && typeof programId === 'string' ? getActiveProgramData(programId) : null;
  
  // Derive loading state for entire page
  const isPageLoading = isLoading || isTeamLoading || programLoading || !programId;
  
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
  
  // Calculate milestone status color
  const getStatusColor = (status: string | undefined) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'upcoming': return 'default';
      default: return 'default';
    }
  };
  
  // Sort milestones by number/due date
  const sortedMilestones = [...milestones].sort((a, b) => {
    // Sort by milestone number if available
    if (a.number !== undefined && b.number !== undefined) {
      return a.number - b.number;
    }
    
    // Otherwise sort by due date
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return dateA - dateB;
  });
  
  // Calculate program progress based on milestone completion
  const calculateProgramProgress = () => {
    if (milestones.length === 0) return 0;
    
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };
  
  const programProgress = calculateProgramProgress();
  
  // Find the current in-progress milestone
  const currentMilestone = sortedMilestones.find(m => m.status === 'in-progress');
  
  // If program not found and not loading
  if (!isPageLoading && !programData) {
    return (
      <DashboardLayout
        title="Program Not Found | xFoundry Hub"
        profile={profile}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">Program Not Found</h1>
          <p className="text-default-500 mb-6">The program you're looking for doesn't exist or you don't have access to it.</p>
          <Button as={Link} href="/dashboard" color="primary">
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={programData ? `${programData.initiativeName} | xFoundry Hub` : "Loading Program"}
      profile={profile}
      isLoading={isPageLoading}
      error={error}
      loadingMessage="Loading program details..."
    >
      <div className="space-y-6">
        {/* Program Header */}
        <Card className="w-full">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-default-500 mb-1">
                  <Link href="/dashboard" className="hover:text-default-700">
                    Dashboard
                  </Link>
                  <span>/</span>
                  <span>Program</span>
                </div>
                <h1 className="text-2xl font-bold">{programData?.initiativeName || 'Program'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Chip 
                    size="sm" 
                    color={programData?.participationType === 'Team' ? 'primary' : 'success'}
                    variant="flat"
                  >
                    {programData?.participationType === 'Team' ? 'Team-Based' : 'Individual'}
                  </Chip>
                  <Chip size="sm" color="secondary" variant="flat">
                    {programData?.cohort?.name || 'Current Cohort'}
                  </Chip>
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-500">Progress:</span>
                  <Progress 
                    value={programProgress} 
                    classNames={{
                      base: "max-w-md",
                      indicator: "bg-primary"
                    }}
                    showValueLabel={true}
                  />
                </div>
                {programData?.participationType === 'Team' && teamData && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-default-500">Team:</span>
                    <span className="text-sm font-medium">{teamData.name}</span>
                    <AvatarGroup max={3} size="sm">
                      {teamData.members?.map(member => (
                        <Avatar 
                          key={member.id} 
                          src={member.avatar || "/placeholder-user.jpg"} 
                          name={member.name || 'Team Member'}
                        />
                      ))}
                    </AvatarGroup>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tab Navigation */}
        <Tabs 
          aria-label="Program Tabs" 
          selectedKey={selected}
          onSelectionChange={setSelected as any}
          className="w-full"
        >
          <Tab key="overview" title="Overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <h2 className="text-xl font-bold">Program Overview</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <p className="text-default-700">
                      {programData?.cohort?.description || 
                       `This is the ${programData?.initiativeName} program. You're currently enrolled in the ${programData?.cohort?.name} cohort.`}
                    </p>
                    <div className="bg-default-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Next Milestone</h3>
                      {currentMilestone ? (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{currentMilestone.name}</p>
                            <p className="text-sm text-default-500 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Due: {formatDate(currentMilestone.dueDate)}
                            </p>
                          </div>
                          <Button 
                            color="primary" 
                            size="sm"
                            as={Link}
                            href={programId && typeof programId === 'string' ? 
                              `/program/${programId}/milestone/${currentMilestone.id}` : '#'}
                          >
                            View Task
                          </Button>
                        </div>
                      ) : (
                        <p className="text-default-500">No active milestones</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">
                    {programData?.participationType === 'Team' ? "Team Members" : "Your Progress"}
                  </h2>
                </CardHeader>
                <CardBody>
                  {programData?.participationType === 'Team' && teamData ? (
                    <div className="space-y-4">
                      {teamData.members?.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar 
                            src={member.avatar || "/placeholder-user.jpg"} 
                            name={member.name || 'Team Member'} 
                          />
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-default-500">{member.role}</p>
                          </div>
                        </div>
                      ))}
                      <Button 
                        size="sm" 
                        color="primary" 
                        variant="flat" 
                        className="w-full"
                        as={Link}
                        href={teamData ? `/team/${teamData.id}/invite` : '#'}
                      >
                        Invite Member
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Overall Progress</span>
                        <span className="text-sm font-medium">{programProgress}%</span>
                      </div>
                      <Progress value={programProgress} className="w-full" />
                      <div className="pt-2">
                        <p className="text-sm text-default-700">
                          You have completed {milestones.filter(m => m.status === 'completed').length} 
                          of {milestones.length} milestones.
                        </p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>
          
          <Tab key="milestones" title="Milestones">
            <div className="pt-4">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Program Milestones</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6">
                    {sortedMilestones.length > 0 ? (
                      sortedMilestones.map((milestone, index) => (
                        <div key={milestone.id} className="relative">
                          {/* Timeline connector */}
                          {index < sortedMilestones.length - 1 && (
                            <div className="absolute left-4 top-8 w-0.5 h-16 bg-default-200"></div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              milestone.status === 'completed' 
                                ? 'bg-success text-white' 
                                : milestone.status === 'in-progress'
                                  ? 'bg-primary text-white'
                                  : 'bg-default-200 text-default-500'
                            }`}>
                              {milestone.status === 'completed' ? '✓' : milestone.number || index + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">{milestone.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  milestone.status === 'completed' 
                                    ? 'bg-success/10 text-success' 
                                    : milestone.status === 'in-progress'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-default-100 text-default-500'
                                }`}>
                                  {milestone.status === 'completed' 
                                    ? 'Completed' 
                                    : milestone.status === 'in-progress'
                                      ? 'In Progress'
                                      : 'Upcoming'}
                                </span>
                              </div>
                              <p className="text-sm text-default-500">Due: {formatDate(milestone.dueDate)}</p>
                              {milestone.description && (
                                <p className="text-sm text-default-700 mt-1">{milestone.description}</p>
                              )}
                              {milestone.status === 'in-progress' && (
                                <Button 
                                  size="sm" 
                                  color="primary" 
                                  className="mt-2"
                                  as={Link}
                                  href={programId && typeof programId === 'string' ? 
                                    `/program/${programId}/milestone/${milestone.id}` : '#'}
                                >
                                  Work on Milestone
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <MilestoneIcon className="h-12 w-12 text-default-300 mb-3" />
                        <p className="text-default-500">No milestones available yet</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
          
          {programData?.participationType === 'Team' && (
            <Tab key="team" title="Team">
              <div className="pt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">
                        Team: {teamData?.name || 'Not Assigned'}
                      </h2>
                      {teamData && (
                        <Button 
                          color="primary" 
                          size="sm"
                          as={Link}
                          href={`/team/${teamData.id}/edit`}
                        >
                          Edit Team
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardBody>
                    {teamData ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teamData.members?.map(member => (
                            <Card key={member.id} className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  src={member.avatar || "/placeholder-user.jpg"} 
                                  name={member.name || 'Team Member'}
                                  size="lg"
                                />
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-default-500">{member.role}</p>
                                </div>
                              </div>
                            </Card>
                          ))}
                          <Card className="p-4 border-2 border-dashed border-default-200 flex items-center justify-center">
                            <Button 
                              color="primary" 
                              variant="flat"
                              as={Link}
                              href={`/team/${teamData.id}/invite`}
                            >
                              Invite New Member
                            </Button>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <TeamIcon className="h-12 w-12 text-default-300 mb-3" />
                        <p className="text-default-500 mb-4">You're not part of a team yet</p>
                        <Button 
                          color="primary"
                          as={Link}
                          href="/create-team"
                        >
                          Create a Team
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </Tab>
          )}
          
          <Tab key="activity" title="Activity">
            <div className="pt-4">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                </CardHeader>
                <CardBody>
                  <div className="h-64 flex items-center justify-center bg-default-100 rounded-lg">
                    <p className="text-default-500">No recent activity to display</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();