import { useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import DashboardLayout from "@/layouts/dashboard";
import { Card, CardHeader, CardBody, CardFooter, Badge, Skeleton, Divider } from "@heroui/react";


import { useDashboard } from "@/contexts/DashboardContext";
import { TeamIcon, PlusIcon } from "@/components/dashboard/icons";
import { TeamCard, TeamCreateDialog } from "@/components/teams";
import { Team } from "@/types/dashboard";
import { Button, Link } from "@heroui/react";

export default function TeamsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const {
    profile,
    isLoading,
    error,
    teamsData,
    isTeamLoading,
    refreshData
  } = useDashboard();
  
  // Handle team creation
  const handleCreateTeam = (team: Team) => {
    // Refresh teams to get the updated list by invalidating the teams query
    refreshData('teams');
  };
  
  return (
    <DashboardLayout
      title="Teams | xFoundry Hub"
      profile={profile}
      isLoading={isLoading || isTeamLoading}
      error={error}
      loadingMessage="Loading teams..."
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
              <span>Teams</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">Your Teams</h1>
          </div>
          
          <Button 
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={() => setShowCreateDialog(true)}
          >
            Create Team
          </Button>
        </div>
        
        {/* Teams List */}
        <div className="space-y-4">
          {isLoading || isTeamLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : teamsData && teamsData.length > 0 ? (
            teamsData.map((team) => (
              <TeamCard 
                key={team.id} 
                team={team} 
                profile={profile || undefined}
                onTeamUpdated={() => {
                  refreshData('teams');
                }}
              />
            ))
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">No Teams Yet</h2>
              </CardHeader>
              <Divider />
              <CardBody className="p-6">
                <div className="flex flex-col items-center py-8">
                  <TeamIcon className="w-16 h-16 text-default-300 mb-4" />
                  <p className="text-default-500 mb-4 text-center max-w-md">
                    You don't have any teams yet. Create a new team to collaborate with others on your program initiatives.
                  </p>
                  <Button color="primary" onPress={() => setShowCreateDialog(true)}>
                    Create Your First Team
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
      
      <TeamCreateDialog 
        isOpen={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
        onCreateTeam={handleCreateTeam}
      />
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();