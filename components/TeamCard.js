// components/TeamCard.js
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Info, Pencil } from "lucide-react";
import TeamDetailModal from "./TeamDetailModal";
import TeamEditDialog from "./TeamEditDialog";
import CohortCard from "./shared/CohortCard";
import { useToast } from "@/components/ui/use-toast";

/**
 * TeamCard component displays team information with associated cohorts.
 * @param {Object} props - Component props
 * @param {Object} props.team - Team data object
 * @param {Object} props.profile - User profile data
 * @param {Function} props.onTeamUpdated - Callback function when team is updated
 */
const TeamCard = ({ team, profile, onTeamUpdated }) => {
  const { toast } = useToast();
  const [currentTeam, setCurrentTeam] = useState(team);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTeamEditDialog, setShowTeamEditDialog] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [teamCohorts, setTeamCohorts] = useState([]);
  const [isLoadingCohorts, setIsLoadingCohorts] = useState(false);
  
  // Update current team when prop changes
  useEffect(() => {
    setCurrentTeam(team);
  }, [team]);
  
  // Handle viewing cohort details
  const handleViewCohortDetails = (cohort) => {
    setSelectedCohort(cohort);
  };
  
  // Handle team updates
  const handleTeamUpdated = (updatedTeam) => {
    setCurrentTeam(updatedTeam);
    
    // Call parent callback if provided
    if (onTeamUpdated) {
      onTeamUpdated(updatedTeam);
    }
    
    toast({
      title: "Team Updated",
      description: "Team details have been updated successfully",
    });
  };
  
  // Fetch cohorts for this team
  useEffect(() => {
    const fetchTeamCohorts = async () => {
      if (!currentTeam || !currentTeam.id) return;
      
      try {
        setIsLoadingCohorts(true);
        console.log(`Fetching cohorts for team ${currentTeam.id}...`);
        
        const response = await fetch(`/api/teams/${currentTeam.id}/cohorts`);
        const responseText = await response.text();
        
        try {
          // Try to parse as JSON
          const data = JSON.parse(responseText);
          console.log(`Fetched ${data.cohorts ? data.cohorts.length : 0} cohorts for team ${currentTeam.name}:`, data);
          
          if (data.cohorts && Array.isArray(data.cohorts)) {
            // Log each cohort for debugging
            data.cohorts.forEach((cohort, index) => {
              console.log(`Cohort ${index + 1}:`, {
                id: cohort.id,
                name: cohort.initiativeDetails?.name || 'No initiative name',
                status: cohort.Status,
                topics: cohort.topicNames || []
              });
            });
            
            // Don't filter by status - show all cohorts associated with this team
            console.log(`Setting all ${data.cohorts.length} cohorts for team`);
            setTeamCohorts(data.cohorts);
          } else {
            console.error("Invalid cohorts data:", data);
            setTeamCohorts([]);
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          console.error("Response text:", responseText);
          setTeamCohorts([]);
        }
      } catch (error) {
        console.error("Error fetching team cohorts:", error);
        setTeamCohorts([]);
      } finally {
        setIsLoadingCohorts(false);
      }
    };
    
    fetchTeamCohorts();
  }, [currentTeam]);
  
  // If no team data is provided, show a not found message
  if (!currentTeam) {
    return (
      <Card className="mb-5">
        <CardContent className="py-6 text-center text-muted-foreground italic">
          You are not currently part of any team.
        </CardContent>
      </Card>
    );
  }
  
  // Get active members only
  const activeMembers = currentTeam.members ? currentTeam.members.filter(member => member.status === "Active") : [];
  
  return (
    <>
      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{currentTeam.name}</CardTitle>
            <Badge className="ml-2">
              {activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {currentTeam.description || "No description available."}
          </p>
          
          {activeMembers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="h-4 w-4" />
              <span>
                {activeMembers.filter(m => m.isCurrentUser).length > 0 ? 
                  "You and " + (activeMembers.length - 1) + " others" : 
                  activeMembers.length + " team members"}
              </span>
            </div>
          )}
          
          {/* Team's Cohorts/Programs Section */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Team Programs:</h4>
            <div className="flex flex-wrap">
              {isLoadingCohorts ? (
                <p className="text-sm text-muted-foreground">Loading programs...</p>
              ) : teamCohorts && teamCohorts.length > 0 ? (
                teamCohorts.map(cohort => (
                  <CohortCard 
                    key={cohort.id}
                    cohort={{
                      ...cohort,
                      onViewDetails: () => handleViewCohortDetails(cohort)
                    }}
                    profile={profile}
                    condensed={true}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No programs associated with this team yet.</p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2 pt-2">
          <Button 
            variant="secondary"
            className="flex-1"
            size="default"
            onClick={() => setShowDetails(true)}
          >
            <Info className="h-4 w-4" />
            View Details
          </Button>
          
          {activeMembers.some(m => m.isCurrentUser) && (
            <Button
              variant="outline"
              className="flex-1"
              size="default"
              onClick={() => setShowTeamEditDialog(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit Details
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <TeamDetailModal 
        team={currentTeam} 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)} 
        onTeamUpdated={handleTeamUpdated}
      />
      
      <TeamEditDialog 
        team={currentTeam}
        open={showTeamEditDialog}
        onClose={() => setShowTeamEditDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
      
      {/* Program Detail Modal for cohorts */}
      {selectedCohort && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          onClick={() => setSelectedCohort(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{selectedCohort.initiativeDetails?.name || "Program Details"}</h2>
            
            {selectedCohort.topicNames && selectedCohort.topicNames.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">Topics:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCohort.topicNames.map((topic, index) => (
                    <Badge key={index} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {selectedCohort.className && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1">Class:</h3>
                <p className="text-sm">{selectedCohort.className}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-1">Description:</h3>
              <p className="text-sm">{selectedCohort.description || selectedCohort.initiativeDetails?.description || "No description available."}</p>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={() => setSelectedCohort(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamCard;