"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { toast } from "sonner"

// Import components
import ProperDashboardLayout from "../components/ProperDashboardLayout"
import ProfileEditModal from "../components/ProfileEditModal"
import TeamCard from "../components/TeamCard"
import EmailMismatchAlert from "../components/EmailMismatchAlert"
import CohortGrid from "../components/shared/CohortGrid"
import TeamCreateDialog from "../components/TeamCreateDialog"
import TeamSelectDialog from "../components/TeamSelectDialog"
import ProgramDetailModal from "../components/ProgramDetailModal"

// Import UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// Import icons
import { 
  BookOpen, 
  Users, 
  AlertTriangle, 
  Compass,
  ExternalLink,
  ArrowRight,
  Eye
} from "lucide-react"

// Import the OnboardingChecklist component dynamically to avoid hook issues
const OnboardingChecklist = dynamic(
  () => import('../components/OnboardingChecklist'),
  { ssr: false }
)

const Dashboard = () => {
  // All React hooks must be called at the top level
  const { user, isLoading: isUserLoading } = useUser()
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamLoading, setIsTeamLoading] = useState(true)
  const [teamsData, setTeamsData] = useState([])
  const [applications, setApplications] = useState([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [error, setError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // ALWAYS default to showing the checklist initially - we'll hide it if we confirm it's completed
  // This is the most reliable approach - if we can't confirm it's completed, we show it
  const [showOnboarding, setShowOnboarding] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
        toast.error("Failed to load your profile")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchTeamData = async () => {
      try {
        // Fetch multiple teams
        const teamsResponse = await fetch("/api/teams")
        if (!teamsResponse.ok) {
          throw new Error("Failed to fetch teams data")
        }
        
        const teamsData = await teamsResponse.json()
        
        // For backward compatibility, also set the first team to teamData
        if (teamsData.teams && teamsData.teams.length > 0) {
          setTeamData(teamsData.teams[0])
          setTeamsData(teamsData.teams)
          
          // Log team cohort IDs for debugging
          teamsData.teams.forEach(team => {
            console.log(`Team "${team.name}" (${team.id}) has cohort IDs:`, team.cohortIds || []);
          });
        } else {
          setTeamData(null)
          setTeamsData([])
        }
        
        console.log("Teams data loaded:", teamsData)
      } catch (err) {
        console.error("Error fetching team data:", err)
        toast.error("Failed to load team information")
      } finally {
        setIsTeamLoading(false)
      }
    }

    // Extremely simplified onboarding check: only hide the checklist if we're CERTAIN it should be hidden
    const checkOnboardingStatus = async () => {
      try {
        console.log("Starting simplified onboarding check...");
        
        // Most direct approach: Is there a TRUE flag in the session?
        if (user?.user_metadata?.onboardingCompleted === true) {
          console.log("Session confirms onboardingCompleted = true, hiding checklist");
          setShowOnboarding(false);
          return;
        }
        
        // Second check: Is there a TRUE flag in Auth0?
        try {
          // Make a direct request to the Auth0 Management API through our endpoint
          const directResponse = await fetch("/api/user/onboarding-completed");
          if (directResponse.ok) {
            const result = await directResponse.json();
            console.log("Direct Auth0 check result:", result);
            
            if (result.completed === true) {
              console.log("Auth0 confirms onboardingCompleted = true, hiding checklist");
              setShowOnboarding(false);
              return;
            }
          }
        } catch (checkError) {
          console.warn("Error checking Auth0 directly:", checkError);
        }
        
        // Third check: Is there a TRUE flag in our metadata API?
        try {
          const metadataResponse = await fetch("/api/user/metadata");
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            
            if (metadata.onboardingCompleted === true) {
              console.log("Metadata API confirms onboardingCompleted = true, hiding checklist");
              setShowOnboarding(false);
              return;
            }
          }
        } catch (metadataError) {
          console.warn("Error checking metadata API:", metadataError);
        }
        
        // By default: Show the checklist if we couldn't CONFIRM it's completed
        console.log("Could not positively confirm onboarding is completed, showing checklist");
        
        // No change needed - we already default to showing the checklist
        // This ensures new accounts always see it
      } catch (err) {
        console.error("Error in onboarding check:", err);
        // Already defaulting to showing - no action needed
      }
    };

    // Function to fetch user applications
    const fetchApplications = async () => {
      try {
        console.log('Fetching user applications...');
        setIsLoadingApplications(true);
        
        const response = await fetch('/api/user/check-application');
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Applications data from API:', data);
        
        if (data && Array.isArray(data.applications)) {
          const apps = data.applications;
          console.log(`Found ${apps.length} applications for user`);
          
          // We'll use the already loaded metadata in checkOnboardingStatus
          // so no need to fetch it again here
          setApplications(apps);
        } else {
          console.warn('No applications array in response');
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      } finally {
        setIsLoadingApplications(false);
      }
    };
    
    if (user) {
      // First load all data in parallel that we need for onboarding decisions
      const dataPromises = [
        fetchApplications(),
        fetchProfile(),
        fetchTeamData()
      ];
      
      // Then check onboarding status with all context available
      Promise.all(dataPromises)
        .then(() => {
          console.log("All data loaded, now checking onboarding status with full context");
          checkOnboardingStatus();
        })
        .catch(err => {
          console.error("Error loading data for onboarding check:", err);
          // Still try to check onboarding status even if some data failed to load
          checkOnboardingStatus();
        });
    }
    
    // Add debugging to check when profile and teams are loaded
    if (profile && teamsData) {
      console.log("Profile and teams data loaded:", {
        cohorts: profile.cohorts?.length || 0,
        teams: teamsData.length
      });
    }
  }, [user]);
  
  // Track application submissions but don't auto-complete onboarding
  useEffect(() => {
    // Only run this effect when applications load and we have any
    if (!isLoadingApplications && applications.length > 0) {
      console.log('Applications found, updating application tracking:', applications.length);
      
      // Track that the user has submitted an application, but don't set onboardingCompleted
      fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Mark the steps but don't set onboardingCompleted flag
          onboarding: ['register', 'selectCohort']
        })
      })
      .catch(err => {
        console.error('Error updating application tracking:', err);
      });
    }
  }, [applications, isLoadingApplications]);

  // Show loading screen while data is loading
  if (isUserLoading || isLoading) {
    return (
      <ProperDashboardLayout title="xFoundry Hub">
        <div className="flex flex-col gap-6 mt-10">
          <Skeleton className="h-[30px] w-[280px] rounded-sm" />
          
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[80px] w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
            </div>
          </div>
        </div>
      </ProperDashboardLayout>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <ProperDashboardLayout title="xFoundry Hub">
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </ProperDashboardLayout>
    )
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
      setProfile(updatedProfile);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Robust onboarding completion handler with better error handling
  const handleCompletion = async () => {
    console.log("Handling onboarding completion - robust approach with retries");
    
    // Immediately hide the checklist for better UX
    setShowOnboarding(false);
    
    try {
      // Use the specialized onboarding completion endpoint with direct Auth0 API access
      const completionResponse = await fetch('/api/user/onboarding-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: true })
      });
      
      if (completionResponse.ok) {
        const result = await completionResponse.json();
        console.log("Onboarding marked as completed:", result);
      } else {
        console.error("Failed to mark onboarding as completed");
      }
      
      // Update the metadata with redundancy - belt and suspenders approach
      try {
        // Also update through metadata API for double-confirmation
        const metadataResponse = await fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString()
          })
        });
        
        if (metadataResponse.ok) {
          console.log("Additional metadata update successful");
        }
      } catch (metadataError) {
        console.warn("Backup metadata update failed, but primary update should still be ok:", metadataError);
      }
      
      // Force a page reload to get a fresh session with the updated metadata
      // This ensures the client has the latest metadata from Auth0
      window.location.reload();
      
    } catch (error) {
      console.error("Error in onboarding completion process:", error);
      
      // If the primary approach fails, try a fallback to ensure we still update
      try {
        // Last-resort metadata update
        await fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
            // Add a flag to indicate this was set via fallback
            onboardingCompletionMethod: 'fallback'
          })
        });
        
        console.log("Used fallback method to complete onboarding");
        
        // Force reload anyway to refresh session
        window.location.reload();
      } catch (fallbackError) {
        console.error("Even fallback method failed:", fallbackError);
        
        // Keep the onboarding hidden anyway for current session
        setShowOnboarding(false);
      }
    }
  };
  
  
  // Main JSX content
  return (
    <ProperDashboardLayout title="xFoundry Hub" profile={profile} onEditClick={handleEditClick}>
      {profile && (
        <div className="dashboard-content space-y-6">
          {/* Email mismatch alert */}
          {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
          
          {/* Simple onboarding checklist display - just based on showOnboarding state */}
          {showOnboarding && (
            <OnboardingChecklist 
              profile={profile}
              onComplete={handleCompletion}
              applications={applications}
              isLoadingApplications={isLoadingApplications}
              onApplySuccess={(cohort) => {
                // When application is successful, update data but don't hide checklist
                toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
                
                // Refresh data to show updated state
                Promise.all([
                  // Refresh applications
                  fetch('/api/user/check-application')
                    .then(res => res.json())
                    .then(data => {
                      if (data?.applications) setApplications(data.applications);
                    })
                    .catch(err => console.error("Error refreshing apps:", err)),
                    
                  // Refresh teams  
                  fetch("/api/teams")
                    .then(res => res.json())
                    .then(data => {
                      setTeamsData(data.teams || []);
                      if (data.teams?.length > 0) setTeamData(data.teams[0]);
                    })
                    .catch(err => console.error("Error refreshing teams:", err))
                ]);
              }}
            />
          )}
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Hub</h1>
              <p className="text-muted-foreground">
                Welcome, {profile?.firstName || user?.name?.split(' ')[0] || 'Student'}
              </p>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="space-y-8">
            {/* Programs Section */}
            <section id="programs" className="space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Available Programs</h2>
              </div>
              
              <CohortGrid 
                cohorts={profile.cohorts || []}
                profile={profile}
                applications={applications}
                isLoadingApplications={isLoadingApplications}
                onApplySuccess={(cohort) => {
                  toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
                  
                  // Add the new application to our state
                  setApplications(prevApps => [
                    ...prevApps, 
                    { 
                      cohortId: cohort.id,
                      createdAt: new Date().toISOString(),
                      status: 'Submitted'
                    }
                  ]);
                  
                  // Simpler approach - just update steps without needing to check current state
                  fetch('/api/user/metadata', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      onboarding: ['register', 'selectCohort']
                    })
                  }).catch(err => {
                    console.error("Error updating steps after application:", err);
                  });
                }}
              />
            </section>
            
            {/* Teams Section */}
            <section id="teams" className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Teams</h2>
              </div>
              
              {isTeamLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : teamsData && teamsData.length > 0 ? (
                <div className="space-y-6">
                  {teamsData.map((team) => (
                    <TeamCard 
                      key={team.id} 
                      team={team}
                      profile={profile}
                    />
                  ))}
                </div>
              ) : (
                <TeamCard team={null} />
              )}
            </section>
          </div>
          
          {/* Modals */}
          {isEditModalOpen && (
            <ProfileEditModal
              isOpen={isEditModalOpen}
              onClose={handleEditClose}
              profile={profile}
              onSave={handleProfileUpdate}
            />
          )}
        </div>
      )}
    </ProperDashboardLayout>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Dashboard