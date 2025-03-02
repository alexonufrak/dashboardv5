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
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)

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

    // Handle onboarding state based on metadata and completion status
    const checkOnboardingStatus = async () => {
      try {
        // Get user metadata from API
        const response = await fetch("/api/user/metadata");
        
        if (response.ok) {
          const metadata = await response.json();
          console.log("User metadata from API:", metadata);
          
          // Check onboarding steps
          const onboardingSteps = metadata.onboarding || [];
          const hasCompletedRegister = Array.isArray(onboardingSteps) && onboardingSteps.includes('register');
          const hasAppliedToProgram = Array.isArray(onboardingSteps) && onboardingSteps.includes('selectCohort');
          
          // The definitive flag for onboarding completion
          const isOnboardingCompleted = metadata.onboardingCompleted === true;
          
          console.log("Onboarding status:", {
            steps: onboardingSteps,
            hasCompletedRegister,
            hasAppliedToProgram,
            onboardingCompleted: isOnboardingCompleted,
            completedAt: metadata.completedAt || 'Not completed'
          });
          
          // The definitive check for whether to hide onboarding
          if (isOnboardingCompleted) {
            // User has explicitly completed the onboarding - HIDE THE CHECKLIST
            console.log("Onboarding explicitly completed, hiding checklist");
            setShowOnboarding(false);
            return; // Exit early
          }
          
          // If the user has applied to a program but not explicitly completed onboarding,
          // we should show the checklist in the "confirmed" state so they can complete it
          if (hasAppliedToProgram) {
            console.log("User has applied but not completed onboarding, showing checklist in confirmed state");
            setShowOnboarding(true);
          } else {
            // Show onboarding in regular state
            console.log("Regular onboarding state, showing checklist");
            setShowOnboarding(true);
            
            // Explicitly mark register step as completed for new users
            if (!hasCompletedRegister) {
              await fetch('/api/user/metadata', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  onboarding: ['register']
                })
              });
            }
          }
        } else {
          console.warn("Error fetching metadata from API");
          // Default to showing onboarding for new users
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        // Default to showing onboarding for new users
        setShowOnboarding(true);
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
          
          // DON'T hide checklist when applications exist - let user close it themselves
          console.log('Applications found, but keeping checklist visible for user confirmation');
          
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
      // Load applications FIRST to immediately hide checklist if needed
      fetchApplications();
      
      // Load other data after
      fetchProfile();
      fetchTeamData();
      
      // Check onboarding status as a fallback
      checkOnboardingStatus();
    }
    
    // Add debugging to check when profile and teams are loaded
    if (profile && teamsData) {
      console.log("Profile and teams data loaded:", {
        cohorts: profile.cohorts?.length || 0,
        teams: teamsData.length
      });
    }
  }, [user]);
  
  // When applications data changes, check if we need to update the checklist state
  useEffect(() => {
    if (!isLoadingApplications && applications.length > 0) {
      console.log('Applications found, updating checklist state:', applications);
      
      // Don't hide checklist automatically when applications are found
      // Instead, just mark the step as completed in metadata
      fetch('/api/user/metadata')
        .then(res => res.json())
        .then(metadata => {
          const currentSteps = metadata.onboarding || ['register'];
          
          // Only update if application step not already marked as completed
          if (!currentSteps.includes('selectCohort')) {
            fetch('/api/user/metadata', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                // Don't set onboardingCompleted: true, to keep checklist visible
                // Mark that both steps are complete
                onboarding: [...currentSteps, 'selectCohort']
              })
            }).then(() => {
              console.log('Metadata updated to mark application step as complete');
            }).catch(err => {
              console.error('Error updating metadata:', err);
            });
          }
        });
    } else if (!isLoadingApplications) {
      console.log('No applications found:', applications);
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

  // Handle onboarding completion/skip
  const handleCompletion = async (skipOnly = false, hasAppliedToProgram = false) => {
    console.log("Handling onboarding completion:", { skipOnly, hasAppliedToProgram });
    
    // Refresh data before hiding the checklist to ensure dashboard is up-to-date
    try {
      // Refresh applications data
      const appResponse = await fetch('/api/user/check-application');
      if (appResponse.ok) {
        const appData = await appResponse.json();
        if (appData && Array.isArray(appData.applications)) {
          setApplications(appData.applications);
        }
      }
      
      // Refresh team data
      const teamsResponse = await fetch("/api/teams");
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeamsData(teamsData.teams || []);
        if (teamsData.teams && teamsData.teams.length > 0) {
          setTeamData(teamsData.teams[0]);
        }
      }
      
      // Refresh profile data
      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error refreshing data before hiding checklist:", error);
    }
    
    // Save the onboarding completed state to user metadata
    try {
      // This is the definitive flag to hide the checklist across sessions
      const metadata = {
        onboardingCompleted: true,
        onboardingSkipped: skipOnly,
        // Add timestamp to ensure we can track when the user completed onboarding
        completedAt: new Date().toISOString()
      };
      
      console.log("Saving completion state to Auth0:", metadata);
      
      const response = await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save metadata: ${response.status}`);
      }
      
      // Only hide the onboarding checklist when explicitly completed by the user
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error saving onboarding completion status:", error);
      // Still hide the onboarding even if API call fails
      setShowOnboarding(false);
    }
  };
  
  
  // Main JSX content
  return (
    <ProperDashboardLayout title="xFoundry Hub" profile={profile} onEditClick={handleEditClick}>
      {profile && (
        <div className="dashboard-content space-y-6">
          {/* Email mismatch alert */}
          {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
          
          {/* Onboarding Checklist */}
          {showOnboarding && (
            <OnboardingChecklist 
              profile={profile}
              onComplete={handleCompletion}
              applications={applications}
              isLoadingApplications={isLoadingApplications}
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
                  
                  // Update onboarding steps to include selectCohort, but don't hide the checklist
                  // This allows user to see the confirmation screen
                  fetch('/api/user/metadata').then(res => res.json()).then(metadata => {
                    const currentSteps = metadata.onboarding || ['register'];
                    if (!currentSteps.includes('selectCohort')) {
                      fetch('/api/user/metadata', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          onboarding: [...currentSteps, 'selectCohort']
                        })
                      });
                    }
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