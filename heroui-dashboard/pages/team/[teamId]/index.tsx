import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Card, CardHeader, CardBody, CardFooter, Tabs, Tab, Avatar, Badge, Chip } from "@heroui/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import DashboardLayout from "@/layouts/dashboard";
import { useDashboard } from "@/contexts/DashboardContext";
import { TeamIcon, CalendarIcon, CompassIcon } from "@/components/dashboard/icons";
import { TeamActivityFeed } from "@/components/activity";

export default function TeamDetailPage({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState("overview");
  
  const {
    profile,
    isLoading,
    error,
    teamsData,
    isTeamLoading,
    getAllProgramInitiatives
  } = useDashboard();
  
  // Find the team data for this team ID
  const teamData = teamsData.find(team => team.id === teamId);
  
  // Find programs this team is participating in
  const allInitiatives = profile ? getAllProgramInitiatives() : [];
  const teamPrograms = allInitiatives.filter(initiative => 
    initiative.isTeamBased && initiative.teamId === teamId
  );
  
  // Helper function to get member role label color
  const getRoleColor = (role: string | undefined) => {
    if (!role) return "default";
    
    switch(role.toLowerCase()) {
      case "team lead":
      case "leader":
      case "admin":
        return "primary";
      case "contributor":
        return "secondary";
      case "advisor":
        return "warning";
      default:
        return "default";
    }
  };
  
  // Redirect if team not found
  useEffect(() => {
    if (!isLoading && !isTeamLoading && !teamData) {
      router.push("/teams");
    }
  }, [teamData, isLoading, isTeamLoading, router]);
  
  return (
    <DashboardLayout
      title={teamData ? `${teamData.name} | Team` : "Team Details"}
      profile={profile}
      isLoading={isLoading || isTeamLoading}
      error={error}
      loadingMessage="Loading team details..."
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Link href="/dashboard" className="hover:text-default-700">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/teams" className="hover:text-default-700">
                Teams
              </Link>
              <span>/</span>
              <span>{teamData?.name || "Team"}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{teamData?.name || "Team Details"}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              as={Link} 
              href={`/team/${teamId}/invite`} 
              color="primary" 
              variant="flat"
            >
              Invite Members
            </Button>
            <Button 
              as={Link} 
              href={`/team/${teamId}/edit`} 
              color="primary"
            >
              Edit Team
            </Button>
          </div>
        </div>
        
        {teamData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Team Information</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-default-700">Description</p>
                    <p className="text-sm text-default-600 mt-1">
                      {teamData.fields?.Description || 
                       "A team formed for collaboration on program initiatives."}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-default-700">Created</p>
                    <p className="text-sm text-default-600 mt-1 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {/* In a real implementation, you would format the actual creation date */}
                      March 5, 2025
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-default-700">Members</p>
                    <p className="text-sm text-default-600 mt-1">
                      {teamData.members?.length || 0} team members
                    </p>
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-bold">Programs</h2>
                </CardHeader>
                <CardBody>
                  {teamPrograms.length > 0 ? (
                    <div className="space-y-3">
                      {teamPrograms.map(program => (
                        <div key={program.id} className="border rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <CompassIcon className="text-primary" />
                            <div>
                              <p className="font-medium text-sm">{program.name}</p>
                              <p className="text-xs text-default-500">Active Program</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Button
                              as={Link}
                              href={`/program/${program.id}`}
                              size="sm"
                              variant="flat"
                              color="primary"
                              fullWidth
                            >
                              View Program
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-default-500 text-sm">
                        Not participating in any programs
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <Tabs 
                    aria-label="Team tabs" 
                    selectedKey={selected} 
                    onSelectionChange={setSelected as any}
                  >
                    <Tab key="overview" title="Overview" />
                    <Tab key="members" title="Members" />
                    <Tab key="activity" title="Activity" />
                  </Tabs>
                </CardHeader>
                
                <CardBody>
                  {selected === "overview" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold mb-3">Team Overview</h3>
                        <p className="text-default-700">
                          {teamData.fields?.Description || 
                           `${teamData.name} is a collaborative team participating in xFoundry programs.`}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold mb-3">Key Members</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teamData.members?.slice(0, 4).map((member, index) => (
                            <div key={member.id || index} className="border rounded-md p-3 flex items-center gap-3">
                              <Avatar 
                                src={member.avatar || "/placeholder-user.jpg"} 
                                name={member.name || "Team Member"}
                                className="w-10 h-10"
                              />
                              <div>
                                <p className="font-medium">{member.name || "Team Member"}</p>
                                <div className="flex items-center gap-2">
                                  <Badge color={getRoleColor(member.role)} variant="flat" size="sm">
                                    {member.role || "Member"}
                                  </Badge>
                                  {member.id === profile?.id && (
                                    <span className="text-xs text-primary">(You)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {teamData.members && teamData.members.length > 4 && (
                          <Button 
                            variant="flat" 
                            color="primary" 
                            className="mt-3"
                            onPress={() => setSelected("members")}
                          >
                            View All {teamData.members.length} Members
                          </Button>
                        )}
                      </div>
                      
                      {teamPrograms.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold mb-3">Program Participation</h3>
                          <div className="space-y-4">
                            {teamPrograms.map(program => (
                              <div key={program.id} className="border rounded-md p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-md">{program.name}</h4>
                                    <p className="text-sm text-default-500 mt-1">
                                      {/* This would come from actual program data */}
                                      Program participation with active milestones.
                                    </p>
                                  </div>
                                  <Chip color="primary" variant="flat" size="sm">
                                    {program.participationType}
                                  </Chip>
                                </div>
                                <div className="mt-4">
                                  <Button
                                    as={Link}
                                    href={`/program/${program.id}`}
                                    size="sm"
                                    color="primary"
                                  >
                                    View Program Dashboard
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selected === "members" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Team Members</h3>
                        <Button
                          as={Link}
                          href={`/team/${teamId}/invite`}
                          size="sm"
                          color="primary"
                        >
                          Invite Members
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {teamData.members?.map((member, index) => (
                          <div key={member.id || index} className="border rounded-md p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                src={member.avatar || "/placeholder-user.jpg"} 
                                name={member.name || "Team Member"}
                                className="w-10 h-10"
                              />
                              <div>
                                <p className="font-medium">{member.name || "Team Member"}</p>
                                <p className="text-xs text-default-500">{member.email || ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge color={getRoleColor(member.role)} variant="flat">
                                {member.role || "Member"}
                              </Badge>
                              {member.id === profile?.id && (
                                <span className="text-xs text-primary">(You)</span>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {(!teamData.members || teamData.members.length === 0) && (
                          <div className="text-center py-8">
                            <TeamIcon className="w-12 h-12 text-default-300 mx-auto mb-3" />
                            <p className="text-default-500">No team members yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selected === "activity" && (
                    <div>
                      <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {/* Import TeamActivityFeed at the top of the file */}
                        <TeamActivityFeed team={teamData} detailed={true} />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(context: GetServerSidePropsContext) {
    const { teamId } = context.params || {};
    
    return {
      props: {
        teamId: teamId || null
      }
    };
  }
});