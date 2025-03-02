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
  
  // Onboarding state - much simpler approach with just one boolean flag
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

    // Simple, direct approach to check if onboarding is completed
    const checkOnboardingStatus = async () => {
      try {
        // Use our dedicated endpoint that only does one thing - check if onboarding is completed
        const response = await fetch("/api/user/onboarding-completed");
        
        if (response.ok) {
          const { completed } = await response.json();
          console.log("Onboarding completion status:", completed);
          
          // Simple logic: show checklist if not completed
          setShowOnboarding(!completed);
        } else {
          // If we can't get the status, default to showing the checklist
          console.warn("Error fetching onboarding status, defaulting to show");
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        // Default to showing for new users
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
      // Direct, reliable initialization sequence - first check if onboarding is completed
      checkOnboardingStatus();
      
      // Load all other data in parallel for faster loading
      fetchApplications();
      fetchProfile();
      fetchTeamData();
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

  // Simple, focused onboarding completion handler
  const handleCompletion = () => {
    console.log("Handling onboarding completion - simple approach");
    
    // Immediately hide the checklist for better UX
    setShowOnboarding(false);
    
    // Use our dedicated endpoint with a simple POST
    fetch('/api/user/onboarding-completed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: true })
    })
    .then(response => {
      if (!response.ok) {
        console.error("Failed to mark onboarding as completed");
      }
    })
    .catch(error => {
      console.error("Error marking onboarding as completed:", error);
    });
    
    // Refresh the data in the background for a fresh view
    Promise.all([
      // Refresh applications data
      fetch('/api/user/check-application')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.applications) setApplications(data.applications);
        })
        .catch(err => console.error("Error refreshing applications:", err)),
      
      // Refresh teams data  
      fetch("/api/teams")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.teams) {
            setTeamsData(data.teams);
            if (data.teams.length > 0) setTeamData(data.teams[0]);
          }
        })
        .catch(err => console.error("Error refreshing teams:", err)),
      
      // Refresh profile data
      fetch("/api/user/profile")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setProfile(data); })
        .catch(err => console.error("Error refreshing profile:", err))
    ])
    .then(() => console.log("Background data refresh complete"))
    .catch(err => console.error("Error in background refresh:", err));
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