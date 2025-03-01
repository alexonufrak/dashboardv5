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
import CohortGrid from "../components/shared/CohortGrid" // New shared component

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
  ArrowRight
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
        console.log("Checking onboarding status...")
        
        // First check session storage for immediate state 
        // This helps preserve state across page navigations and refreshes
        const sessionCompleted = sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true';
        const sessionSkipped = sessionStorage.getItem('xFoundry_onboardingSkipped') === 'true';
        
        if (sessionCompleted) {
          console.log("Session storage indicates onboarding is completed");
          setDashboardContent(true);
          setShowOnboardingBanner(false);
          // No need to check API if we know it's completed
          return;
        }
        
        if (sessionSkipped) {
          console.log("Session storage indicates onboarding was skipped");
          setDashboardContent(true);
          setShowOnboardingBanner(true);
          // Continue with API check to validate
        }
        
        // Fetch from API as backup
        const response = await fetch("/api/user/metadata")
        if (response.ok) {
          const metadata = await response.json()
          console.log("User metadata:", metadata)
          
          // Always enable dashboard content by default
          setDashboardContent(true)
          
          if (metadata.onboardingCompleted === true) {
            // If onboarding is fully completed, don't show any onboarding UI
            console.log("Onboarding completed, hiding banner")
            setShowOnboardingBanner(false)
            // Update session storage
            sessionStorage.setItem('xFoundry_onboardingCompleted', 'true');
          } else if (metadata.onboardingSkipped === true) {
            // If onboarding was skipped, show banner only if explicitly requested
            console.log("Onboarding skipped, banner visibility:", metadata.keepOnboardingVisible)
            setShowOnboardingBanner(metadata.keepOnboardingVisible === true)
            // Update session storage
            sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
          } else {
            // Check if we already know from session storage that it was skipped
            if (!sessionSkipped) {
              // By default, always show the condensed banner for new users
              console.log("New user or incomplete onboarding, showing banner")
              setShowOnboardingBanner(true)
            }
          }
        } else {
          // If there's an error fetching metadata but we have session data, trust that
          if (!sessionCompleted && !sessionSkipped) {
            // Default to showing the banner for new users
            console.log("Error fetching metadata, showing default banner")
            setShowOnboardingBanner(true)
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err)
        // If there's an error but we have session data, trust that
        if (!sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true') {
          // Default to showing the banner
          setShowOnboardingBanner(true)
        }
      }
    }

    if (user) {
      // Always show dashboard content by default
      setDashboardContent(true)
      
      // Fetch profile and team data
      fetchProfile()
      fetchTeamData()
      
      // Check onboarding status with a small delay to ensure state updates
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
    // Save the current state to sessionStorage for immediate persistence
    if (skipOnly) {
      sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
    } else {
      sessionStorage.setItem('xFoundry_onboardingCompleted', 'true');
    }
    
    // Update local state with smooth animation
    document.body.classList.add('onboarding-transition');
    
    setTimeout(() => {
      setShowFullOnboarding(false);
      setDashboardContent(true);
      setShowOnboardingBanner(skipOnly); // Only show banner if skipped, not if completed
      
      // Remove animation class after transition
      setTimeout(() => {
        document.body.classList.remove('onboarding-transition');
      }, 300);
    }, 150);
  };
  
  // These functions are now handled by the CohortGrid component

  // This function is now handled by the shared CohortGrid and CohortCard components
  
  // Main JSX content
  return (
    <ProperDashboardLayout title="xFoundry Hub" profile={profile} onEditClick={handleEditClick}>
      {/* No longer needed - CohortGrid component handles this */}
      
      {/* Full Onboarding Checklist - Only when shown */}
      {profile && showFullOnboarding && (
        <div className="animate-in slide-in-from-bottom-5 duration-300">
          <OnboardingChecklist 
            profile={profile}
            onComplete={handleCompletion}
          />
        </div>
      )}
      
      {/* Dashboard Content - Either condensed onboarding or full dashboard */}
      {profile && !showFullOnboarding && (
        <div className="space-y-8 pt-4">
          {/* Email mismatch alert - appears if user authenticated with different email than verified */}
          {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
          
          {/* Condensed onboarding if not completed */}
          {showOnboardingBanner && (
            <OnboardingChecklistCondensed 
              profile={profile}
              onViewAll={() => setShowFullOnboarding(true)}
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