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
import OnboardingChecklistCondensed from "../components/OnboardingChecklistCondensed"
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
  const [error, setError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dashboardContent, setDashboardContent] = useState(false)
  const [showFullOnboarding, setShowFullOnboarding] = useState(false)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)

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
        const response = await fetch("/api/user/team")
        if (!response.ok) {
          throw new Error("Failed to fetch team data")
        }
        const data = await response.json()
        setTeamData(data.team)
      } catch (err) {
        console.error("Error fetching team data:", err)
        toast.error("Failed to load team information")
      } finally {
        setIsTeamLoading(false)
      }
    }

    const checkOnboardingStatus = async () => {
      try {
        // First check session storage for immediate state 
        // This provides faster UI response across page navigations and refreshes
        const sessionCompleted = sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true';
        const sessionSkipped = sessionStorage.getItem('xFoundry_onboardingSkipped') === 'true';
        
        // Apply session storage state immediately for better UX
        if (sessionCompleted) {
          setDashboardContent(true);
          setShowFullOnboarding(false);
          setShowOnboardingBanner(false);
        } else if (sessionSkipped) {
          setDashboardContent(true);
          setShowFullOnboarding(false);
          setShowOnboardingBanner(true);
        } else {
          // For new users, default to showing onboarding
          setDashboardContent(false);
          setShowFullOnboarding(true);
          setShowOnboardingBanner(false);
        }
        
        // Always fetch from API to ensure data consistency
        const response = await fetch("/api/user/metadata");
        if (response.ok) {
          const metadata = await response.json();
          
          // If there's a conflict between session storage and API data,
          // trust the API data and update session storage
          if (metadata.onboardingCompleted === true) {
            // Only update state if it's different from current state to avoid unnecessary re-renders
            if (!dashboardContent || showFullOnboarding || showOnboardingBanner) {
              setShowFullOnboarding(false);
              setShowOnboardingBanner(false);
              setDashboardContent(true);
            }
            // Update session storage
            sessionStorage.setItem('xFoundry_onboardingCompleted', 'true');
            sessionStorage.removeItem('xFoundry_onboardingSkipped');
          } else if (metadata.onboardingSkipped === true) {
            // Show banner based on keepOnboardingVisible flag
            const keepVisible = metadata.keepOnboardingVisible !== false;
            
            // Only update state if it's different from current state
            if (!dashboardContent || showFullOnboarding || showOnboardingBanner !== keepVisible) {
              setShowFullOnboarding(false);
              setShowOnboardingBanner(keepVisible);
              setDashboardContent(true);
            }
            // Update session storage
            sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
            sessionStorage.removeItem('xFoundry_onboardingCompleted');
          } else if (!sessionCompleted && !sessionSkipped) {
            // New user with no stored preferences - show the full onboarding
            if (dashboardContent || !showFullOnboarding || showOnboardingBanner) {
              setShowFullOnboarding(true);
              setShowOnboardingBanner(false);
              setDashboardContent(false);
            }
          }
        } else {
          // If API fails but we have no session data, prefer showing onboarding
          if (!sessionCompleted && !sessionSkipped) {
            setShowFullOnboarding(true);
            setShowOnboardingBanner(false);
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        
        // If there's an error and no reliable session data, default to showing onboarding
        if (sessionStorage.getItem('xFoundry_onboardingCompleted') !== 'true' && 
            sessionStorage.getItem('xFoundry_onboardingSkipped') !== 'true') {
          setShowFullOnboarding(true);
          setShowOnboardingBanner(false);
        }
      }
    }

    if (user) {
      // Fetch profile and team data
      fetchProfile()
      fetchTeamData()
      
      // Check if we have session storage data to use immediately
      const hasSessionData = sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true' || 
                             sessionStorage.getItem('xFoundry_onboardingSkipped') === 'true';
      
      // If we have session data, show dashboard content immediately
      if (hasSessionData) {
        const isCompleted = sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true';
        setDashboardContent(true);
        setShowFullOnboarding(false);
        setShowOnboardingBanner(!isCompleted); // Show banner only when skipped, not completed
      } else {
        // For new users with no session data, show full onboarding
        setDashboardContent(false);
        setShowFullOnboarding(true);
        setShowOnboardingBanner(false);
      }
      
      // Check onboarding status with the API after initial render
      setTimeout(() => {
        checkOnboardingStatus()
      }, 100)
    }
  }, [user])

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

  const handleCompletion = (skipOnly = false) => {
    // Add animation class for transition
    document.body.classList.add('onboarding-transition');
    
    // Update session storage immediately for responsive UI
    if (skipOnly) {
      sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
      sessionStorage.removeItem('xFoundry_onboardingCompleted');
    } else {
      sessionStorage.setItem('xFoundry_onboardingCompleted', 'true');
      sessionStorage.removeItem('xFoundry_onboardingSkipped');
    }
    
    // Add a small delay to ensure animation is visible
    setTimeout(() => {
      // Update state
      setShowFullOnboarding(false);
      setDashboardContent(true);
      setShowOnboardingBanner(skipOnly); // Only show banner if skipped, not if completed
      
      // Remove animation class after UI updates
      setTimeout(() => {
        document.body.classList.remove('onboarding-transition');
        
        // Add fade-in animation to the newly visible content
        const dashboardContent = document.querySelector('.dashboard-content');
        if (dashboardContent) {
          dashboardContent.classList.add('onboarding-fade-in');
          
          // Remove animation class after completion
          setTimeout(() => {
            dashboardContent.classList.remove('onboarding-fade-in');
          }, 350);
        }
      }, 300);
    }, 200);
  };
  
  // These functions are now handled by the CohortGrid component

  // This function is now handled by the shared CohortGrid and CohortCard components
  
  // Main JSX content
  // Debug info - remove in production
  console.log("Render state:", {
    showFullOnboarding,
    dashboardContent,
    showOnboardingBanner,
    hasProfile: !!profile
  });
  
  return (
    <ProperDashboardLayout title="xFoundry Hub" profile={profile} onEditClick={handleEditClick}>
      {/* No longer needed - CohortGrid component handles this */}
      
      {/* Full Onboarding Checklist - Only when shown */}
      {profile && showFullOnboarding && !dashboardContent && (
        <div className="onboarding-slide-in">
          <OnboardingChecklist 
            profile={profile}
            onComplete={handleCompletion}
          />
        </div>
      )}
      
      {/* Dashboard Content - Either condensed onboarding or full dashboard */}
      {profile && dashboardContent && (
        <div className="space-y-8 pt-4 dashboard-content">
          {/* Email mismatch alert - appears if user authenticated with different email than verified */}
          {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
          
          {/* Condensed onboarding if not completed */}
          {showOnboardingBanner && (
            <OnboardingChecklistCondensed 
              profile={profile}
              onViewAll={() => {
                // Add animation for transitioning to full onboarding
                document.body.classList.add('onboarding-transition');
                
                setTimeout(() => {
                  setShowFullOnboarding(true);
                  setShowOnboardingBanner(false);
                  
                  // Remove animation class after UI updates
                  setTimeout(() => {
                    document.body.classList.remove('onboarding-transition');
                  }, 300);
                }, 200);
              }}
              onComplete={handleCompletion}
            />
          )}
          
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
                onApplySuccess={(cohort) => {
                  toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
                }}
              />
            </section>
            
            {/* Team Section */}
            <section id="teams" className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Team</h2>
              </div>
              
              {isTeamLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : (
                <TeamCard team={teamData} />
              )}
            </section>
          </div>
          
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