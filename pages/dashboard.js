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
  const [userMetadata, setUserMetadata] = useState(null)

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
        // Get user metadata from API - this is the single source of truth
        const response = await fetch("/api/user/metadata");
        
        if (response.ok) {
          const metadata = await response.json();
          console.log("User metadata from API:", metadata);
          
          // Save metadata to state for use throughout the component
          setUserMetadata(metadata);
          
          // Check onboarding steps
          const onboardingSteps = metadata.onboarding || [];
          const hasCompletedRegister = Array.isArray(onboardingSteps) && onboardingSteps.includes('register');
          const hasAppliedToProgram = Array.isArray(onboardingSteps) && onboardingSteps.includes('selectCohort');
          
          // The definitive flag for onboarding completion - this is what matters most
          const isOnboardingCompleted = metadata.onboardingCompleted === true;
          
          console.log("Onboarding status:", {
            steps: onboardingSteps,
            hasCompletedRegister,
            hasAppliedToProgram,
            onboardingCompleted: isOnboardingCompleted,
            completedAt: metadata.completedAt || 'Not completed'
          });
          
          // First check: if onboarding is completed, NEVER show checklist
          if (isOnboardingCompleted) {
            console.log("Onboarding explicitly completed, hiding checklist");
            setShowOnboarding(false);
            return; // Exit early
          } else {
            // For first-time users or those who haven't completed onboarding,
            // we should always show the checklist
            console.log("Onboarding not completed, showing checklist");
            setShowOnboarding(true);
            
            // Only make an API call if register step is missing
            if (!hasCompletedRegister) {
              console.log("Register step missing, adding it to metadata");
              const registerResponse = await fetch('/api/user/metadata', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  onboarding: ['register']
                })
              });
              
              if (registerResponse.ok) {
                const updatedMetadata = await registerResponse.json();
                setUserMetadata(updatedMetadata);
              }
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
        throw err; // Rethrow to allow catch in the calling code
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
      // Order is important: first get metadata, then other data
      checkOnboardingStatus().then(() => {
        // Then load applications
        fetchApplications();
        
        // Load other data after
        fetchProfile();
        fetchTeamData();
      }).catch(error => {
        console.error("Error in initialization sequence:", error);
        // Still load data even if metadata check fails
        fetchApplications();
        fetchProfile();
        fetchTeamData();
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
  
  // Update onboarding steps when applications are found, but don't make redundant API calls
  useEffect(() => {
    // Only run this effect when applications load and we have metadata
    if (!isLoadingApplications && userMetadata && applications.length > 0) {
      console.log('Applications found, checking if we need to update metadata:', applications);
      
      const currentSteps = userMetadata.onboarding || ['register'];
      
      // Only update if application step not already marked as completed 
      // AND onboarding is not already marked as completed
      if (!currentSteps.includes('selectCohort') && !userMetadata.onboardingCompleted) {
        console.log('Application found but not in metadata, updating steps');
        
        // Set the updated steps in metadata
        fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Just update the steps array, don't change other metadata
            onboarding: [...currentSteps, 'selectCohort']
          })
        }).then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to update metadata');
        }).then(updatedMetadata => {
          console.log('Metadata updated with selectCohort step:', updatedMetadata);
          setUserMetadata(updatedMetadata);
        }).catch(err => {
          console.error('Error updating metadata:', err);
        });
      }
    }
  }, [applications, isLoadingApplications, userMetadata]);

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
      const metadataUpdate = {
        onboardingCompleted: true,
        onboardingSkipped: skipOnly,
        // Add timestamp to ensure we can track when the user completed onboarding
        completedAt: new Date().toISOString()
      };
      
      // If we have existing metadata, preserve other fields
      if (userMetadata) {
        // Make sure to maintain onboarding steps
        const currentSteps = userMetadata.onboarding || [];
        if (!currentSteps.includes('register')) {
          currentSteps.push('register');
        }
        if (hasAppliedToProgram && !currentSteps.includes('selectCohort')) {
          currentSteps.push('selectCohort');
        }
        
        metadataUpdate.onboarding = currentSteps;
      }
      
      console.log("Saving completion state to Auth0:", metadataUpdate);
      
      const response = await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadataUpdate)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save metadata: ${response.status}`);
      }
      
      // Update local state
      const updatedMetadata = await response.json();
      setUserMetadata(updatedMetadata);
      
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
          
          {/* Onboarding Checklist - show if onboardingCompleted is not explicitly set to true */}
          {showOnboarding && !(userMetadata && userMetadata.onboardingCompleted === true) && (
            <OnboardingChecklist 
              profile={profile}
              onComplete={handleCompletion}
              applications={applications}
              isLoadingApplications={isLoadingApplications}
              onApplySuccess={(cohort) => {
                // When application is successful, update data but don't hide checklist
                toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
                
                // Refresh application data
                fetch('/api/user/check-application')
                  .then(res => res.json())
                  .then(data => {
                    if (data && Array.isArray(data.applications)) {
                      setApplications(data.applications);
                    }
                  });
                
                // Refresh teams data
                fetch("/api/teams")
                  .then(res => res.json())
                  .then(data => {
                    setTeamsData(data.teams || []);
                    if (data.teams && data.teams.length > 0) {
                      setTeamData(data.teams[0]);
                    }
                  });
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