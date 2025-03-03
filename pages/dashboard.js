import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Import V2 components
import { DashboardLayout } from "../components/v2/dashboard-layout";
import { MainDashboard } from "../components/v2/main-dashboard";
import ProfileEditModal from "../components/ProfileEditModal";
import LoadingScreen from "../components/LoadingScreen";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Dashboard = () => {
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
      <DashboardLayout title="xFoundry Dashboard">
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
        title="Dashboard | xFoundry"
        profile={userProfile}
      >
        <MainDashboard userProfile={userProfile} />
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

export default Dashboard;