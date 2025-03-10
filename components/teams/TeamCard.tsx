"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter, Badge, Tooltip } from "@heroui/react";

import { addToast } from "@heroui/toast";
import { Users, Info, Pencil, UserPlus } from "lucide-react";
import { TeamInviteDialog, TeamEditDialog, TeamDetailModal } from "./index";
import { Team, Profile, Cohort } from "@/types/dashboard";
import { Button } from "@heroui/react";

interface TeamCardProps {
  team: Team;
  profile?: Profile;
  onTeamUpdated?: (team: Team) => void;
}

/**
 * TeamCard component displays team information with associated cohorts.
 */
const TeamCard = ({ team, profile, onTeamUpdated }: TeamCardProps) => {
  const router = useRouter();
  const [currentTeam, setCurrentTeam] = useState<Team>(team);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showTeamEditDialog, setShowTeamEditDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(false);
  const [teamCohorts, setTeamCohorts] = useState<Cohort[]>([]);
  const [cohortsError, setCohortsError] = useState<Error | null>(null);
  
  // Update current team when prop changes
  useEffect(() => {
    setCurrentTeam(team);
  }, [team]);
  
  // Fetch team cohorts
  useEffect(() => {
    if (currentTeam?.id) {
      const fetchTeamCohorts = async () => {
        setIsLoadingCohorts(true);
        try {
          const response = await fetch(`/api/teams/${currentTeam.id}/cohorts?_t=${new Date().getTime()}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch team cohorts: ${response.statusText}`);
          }
          
          const data = await response.json();
          setTeamCohorts(data.cohorts || []);
        } catch (error) {
          console.error("Error fetching team cohorts:", error);
          setCohortsError(error as Error);
        } finally {
          setIsLoadingCohorts(false);
        }
      };
      
      fetchTeamCohorts();
    }
  }, [currentTeam?.id]);
  
  // Handle team updates
  const handleTeamUpdated = (updatedTeam: Team) => {
    setCurrentTeam(updatedTeam);
    
    // Call parent callback if provided
    if (onTeamUpdated) {
      onTeamUpdated(updatedTeam);
    }
  };
  
  // Handle program dashboard navigation
  const handleProgramDashboardClick = (cohort?: Cohort) => {
    if (cohort?.initiativeDetails?.id) {
      router.push(`/program/${cohort.initiativeDetails.id}`);
    } else {
      // Fallback to first cohort's initiative if available
      const firstCohort = teamCohorts && teamCohorts.length > 0 ? teamCohorts[0] : null;
      if (firstCohort?.initiativeDetails?.id) {
        router.push(`/program/${firstCohort.initiativeDetails.id}`);
      } else {
        // No specific program found, redirect to dashboard
        router.push("/dashboard");
      }
    }
  };
  
  // If no team data is provided, show a not found message
  if (!currentTeam) {
    return (
      <Card className="mb-5">
        <CardBody className="py-6 text-center text-default-500 italic">
          You are not currently part of any team.
        </CardBody>
      </Card>
    );
  }
  
  // Get active members only
  const activeMembers = currentTeam.members ? 
    currentTeam.members.filter(member => member.role === "Active" || !member.role) : 
    [];
  
  return (
    <>
      <Card className="mb-5">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">{currentTeam.name}</h3>
          </div>
          <Badge variant="flat" color="primary">
            {activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}
          </Badge>
        </CardHeader>
        
        <CardBody>
          <p className="text-sm text-default-500 line-clamp-2 mb-4">
            {currentTeam.description || "No description available."}
          </p>
          
          {activeMembers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-default-500 mb-4">
              <Users className="h-4 w-4" />
              <span>
                {activeMembers.some(m => m.email === profile?.email) ? 
                  `You and ${activeMembers.length - 1} others` : 
                  `${activeMembers.length} team members`}
              </span>
            </div>
          )}
          
          {/* Team's Cohorts/Programs Section */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Team Programs:</h4>
            <div className="flex flex-wrap gap-2">
              {isLoadingCohorts ? (
                <div className="w-full space-y-2">
                  <div className="flex animate-pulse space-x-2">
                    <div className="h-16 w-32 bg-gray-200 rounded"></div>
                    <div className="h-16 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : cohortsError ? (
                <p className="text-sm text-danger">Failed to load programs</p>
              ) : teamCohorts && teamCohorts.length > 0 ? (
                teamCohorts.map(cohort => (
                  <Card 
                    key={cohort.id}
                    isPressable
                    onPress={() => handleProgramDashboardClick(cohort)}
                    className="w-32 h-16"
                  >
                    <CardBody className="p-2 flex flex-col justify-center items-center">
                      <p className="text-xs font-medium text-center truncate w-full">
                        {cohort.initiativeDetails?.name || "Program"}
                      </p>
                      <p className="text-xs text-default-500 truncate w-full">
                        {cohort.name || "Cohort"}
                      </p>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-default-500 italic">No programs associated with this team yet.</p>
              )}
            </div>
          </div>
        </CardBody>
        
        <CardFooter className="flex gap-2 pt-2 flex-wrap">
          <Tooltip content="View team details">
            <Button
              variant="flat"
              className="flex-1"
              size="md"
              onPress={() => setShowDetailModal(true)}
            >
              <Info className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </Tooltip>
          
          {activeMembers.some(m => m.email === profile?.email) && (
            <>
              <Tooltip content="Edit team details">
                <Button
                  variant="bordered"
                  className="flex-1"
                  size="md"
                  onPress={() => setShowTeamEditDialog(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Details
                </Button>
              </Tooltip>
              
              <Tooltip content="Invite new member">
                <Button
                  color="primary"
                  className="flex-1"
                  size="md"
                  onPress={() => setShowInviteDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite Member
                </Button>
              </Tooltip>
            </>
          )}
        </CardFooter>
      </Card>
      
      <TeamInviteDialog
        team={currentTeam}
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
      
      <TeamEditDialog
        team={currentTeam}
        isOpen={showTeamEditDialog}
        onClose={() => setShowTeamEditDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
      
      <TeamDetailModal
        team={currentTeam}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onTeamUpdated={handleTeamUpdated}
      />
    </>
  );
};

export default TeamCard;