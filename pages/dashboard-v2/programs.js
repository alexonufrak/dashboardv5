import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Import V2 components
import { DashboardLayout } from "../../components/v2/dashboard-layout";
import { ActiveProgramsDashboard } from "../../components/v2/ActiveProgramsDashboard";
import LoadingScreen from "../../components/LoadingScreen";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ProgramsPage = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
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
      <DashboardLayout title="My Programs | xFoundry Dashboard (v2)">
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

  return (
    <DashboardLayout 
      title="My Programs | xFoundry Dashboard (v2)"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard-v2" },
        { label: "Programs", href: "/dashboard-v2/programs" }
      ]}
      profile={userProfile}
    >
      <ActiveProgramsDashboard userProfile={userProfile} />
    </DashboardLayout>
  );
};

export const getServerSideProps = withPageAuthRequired();

export default ProgramsPage;