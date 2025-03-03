import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Import V2 components
import { DashboardLayout } from "../components/v2/dashboard-layout";
import { MainDashboard } from "../components/v2/main-dashboard";
import { ProgramShowcase } from "../components/v2/ProgramShowcase";
import { PointsDashboard } from "../components/v2/PointsDashboard";
import { PointsOverviewCard } from "../components/v2/PointsOverviewCard";
import { MilestoneProgressCard } from "../components/v2/MilestoneProgressCard";
import { PointsTrendCard } from "../components/v2/PointsTrendCard";
import ProfileEditModal from "../components/ProfileEditModal";
import LoadingScreen from "../components/LoadingScreen";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const DashboardV2 = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsProfileLoading(true);
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err.message);
        toast.error("Failed to load your profile");
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Show loading screen while fetching user data
  if (isUserLoading || isProfileLoading) {
    return <LoadingScreen />;
  }

  // Show error message if there's an error
  if (error) {
    return (
      <DashboardLayout title="xFoundry Dashboard (v2)">
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Handler functions
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <DashboardLayout
        title="Dashboard v2 | xFoundry"
        profile={userProfile}
      >
        <div className="mb-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">New Dashboard Design (v2)</AlertTitle>
            <AlertDescription className="text-blue-700">
              You're viewing the new dashboard design. 
              <a href="/dashboard" className="ml-2 underline font-medium">
                Switch back to the original dashboard
              </a>
            </AlertDescription>
          </Alert>
        </div>
        <div className="space-y-8">
          <MainDashboard userProfile={userProfile} />
          
          {/* Show Program Card showcase */}
          <div className="my-8">
            <h2 className="text-2xl font-bold mb-4">Program Card Component Showcase</h2>
            <p className="text-muted-foreground mb-6">
              Below is a showcase of the ProgramCard component in various states and configurations.
              This showcase demonstrates the implementation of Prompt 2 from the dashboard outline.
            </p>
            <ProgramShowcase />
          </div>
          
          {/* Show Points & Progress components */}
          <div className="my-8">
            <h2 className="text-2xl font-bold mb-4">Points & Progress Components</h2>
            <p className="text-muted-foreground mb-6">
              The following components demonstrate the implementation of Prompt 3 from the dashboard outline,
              which focuses on building points and progress tracking visualizations.
            </p>
            
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <PointsOverviewCard 
                  totalPoints={330}
                  programPoints={[
                    {
                      program: "Xperience: Design Thinking",
                      type: "xperience",
                      points: 120,
                      teamContribution: { team: "Innovation Squad", totalTeamPoints: 770 }
                    },
                    {
                      program: "Xperiment: Design Thinking 101",
                      type: "xperiment",
                      points: 125,
                      teamContribution: { team: "Innovation Squad", totalTeamPoints: 770 }
                    },
                    {
                      program: "Xtrapreneurs: Club Membership",
                      type: "xtrapreneurs",
                      points: 85
                    }
                  ]}
                />
                
                <MilestoneProgressCard 
                  programName="Design Thinking"
                  programType="xperience"
                  programId="xp-dt"
                  milestones={[
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
                  ]}
                />
              </div>
              
              <PointsTrendCard />
            </div>
            
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-semibold mb-2">Full Points Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To see a full implementation of the Points Dashboard with all components integrated, 
                view the PointsDashboard component which provides a comprehensive interface for tracking
                points and progress across all programs.
              </p>
              <PointsDashboard userProfile={userProfile} />
            </div>
          </div>
        </div>
      </DashboardLayout>
      
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          profile={userProfile}
          onSave={handleProfileUpdate}
          isLoading={isUpdating}
        />
      )}
    </>
  );
};

export const getServerSideProps = withPageAuthRequired();

export default DashboardV2;